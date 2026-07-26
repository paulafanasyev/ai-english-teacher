import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { logAdminAction } from '../middleware/adminLog.js';
import { extractText, isAllowedMime, MAX_UPLOAD_BYTES } from '../lib/textExtract.js';
import { generateTasksFromText } from '../lib/taskGenerator.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter(req, file, cb) {
    if (!isAllowedMime(file.mimetype)) {
      return cb(new Error('Unsupported file type. Only PDF, DOCX, and TXT are allowed.'));
    }
    cb(null, true);
  },
});

function uploadSingle(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File exceeds the 10MB size limit' });
      }
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    next();
  });
}

// POST /api/materials/upload
router.post('/upload', uploadSingle, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided (field name must be "file")' });
    }

    const { originalname, mimetype, buffer } = req.file;

    let text;
    try {
      text = await extractText(buffer, mimetype);
    } catch (extractErr) {
      return res.status(400).json({ error: `Could not extract text: ${extractErr.message}` });
    }

    const material = await prisma.material.create({
      data: {
        ownerId: req.user.id,
        filename: originalname,
        mime: mimetype,
        text,
      },
    });

    await logAdminAction({
      actorId: req.user.id,
      action: 'material.upload',
      target: material.id,
    });

    res.status(201).json({
      material: {
        id: material.id,
        filename: material.filename,
        mime: material.mime,
        createdAt: material.createdAt,
        textLength: text.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/materials
router.get('/', async (req, res, next) => {
  try {
    const materials = await prisma.material.findMany({});
    res.json({
      materials: materials.map((m) => ({
        id: m.id,
        filename: m.filename,
        mime: m.mime,
        ownerId: m.ownerId,
        createdAt: m.createdAt,
        textLength: (m.text || '').length,
      })),
    });
  } catch (err) {
    next(err);
  }
});

const idParamSchema = z.object({ id: z.string().trim().min(1) });

// DELETE /api/materials/:id
router.delete('/:id', validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const existing = await prisma.material.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Material not found' });
    }

    await prisma.material.delete({ where: { id: req.params.id } });

    await logAdminAction({
      actorId: req.user.id,
      action: 'material.delete',
      target: req.params.id,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/materials/:id/generate-tasks
router.post(
  '/:id/generate-tasks',
  validate({ params: idParamSchema }),
  async (req, res, next) => {
    try {
      const material = await prisma.material.findUnique({ where: { id: req.params.id } });
      if (!material) {
        return res.status(404).json({ error: 'Material not found' });
      }

      const { vocabCards, gapTasks } = generateTasksFromText(material.text || '');

      res.json({ vocabCards, gapTasks });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
