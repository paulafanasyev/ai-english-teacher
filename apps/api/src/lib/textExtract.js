// Text extraction from uploaded materials (pdf, docx, txt) with no external
// network calls — everything runs locally via pdf-parse / mammoth / utf8.

import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',
]);

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

export function isAllowedMime(mime) {
  return ALLOWED_MIME_TYPES.has(mime);
}

/**
 * Extract plain text from a buffer given its mime type.
 */
export async function extractText(buffer, mime) {
  if (mime === 'application/pdf') {
    const result = await pdfParse(buffer);
    return result.text || '';
  }

  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  if (mime === 'text/plain') {
    return buffer.toString('utf8');
  }

  throw new Error(`Unsupported mime type: ${mime}`);
}
