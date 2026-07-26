// Express application factory. Keeping this separate from server.js lets
// tests import the app directly (via supertest) without binding a port.

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import authRouter from './routes/auth.js';
import meRouter from './routes/me.js';
import progressRouter from './routes/progress.js';
import economyRouter from './routes/economy.js';
import adminRouter from './routes/admin.js';
import materialsRouter from './routes/materials.js';
import teacherRouter from './routes/teacher.js';
import journalRouter from './routes/journal.js';
import parentRouter from './routes/parent.js';
import { notFoundHandler, errorHandler } from './middleware/errors.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // --- Security headers -----------------------------------------------
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  // --- CORS allowlist ---------------------------------------------------
  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser requests (no Origin header, e.g. curl/server-to-server).
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );

  // --- Body parsing -------------------------------------------------------
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // --- Rate limiting --------------------------------------------------
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later.' },
  });

  app.use(globalLimiter);
  app.use('/api/auth', authLimiter);

  // --- Health check -----------------------------------------------------
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- Routes -------------------------------------------------------------
  app.use('/api/auth', authRouter);
  app.use('/api/me', meRouter);
  app.use('/api/progress', progressRouter);
  app.use('/api/economy', economyRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/materials', materialsRouter);
  app.use('/api/teacher', teacherRouter);
  app.use('/api/journal', journalRouter);
  app.use('/api/parent', parentRouter);

  // --- 404 + error handling ------------------------------------------
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
