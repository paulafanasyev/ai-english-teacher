// Centralized error handler. Never leaks stack traces (or any internal
// detail) in production responses.

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err, req, res, _next) {
  const isProd = process.env.NODE_ENV === 'production';
  const status = err.status || err.statusCode || 500;

  if (!isProd) {
    // eslint-disable-next-line no-console
    console.error(err);
  } else if (status >= 500) {
    // Log minimal, non-sensitive info server-side even in prod.
    // eslint-disable-next-line no-console
    console.error(`[error] ${req.method} ${req.originalUrl} -> ${status}: ${err.message}`);
  }

  const body = { error: status >= 500 ? 'Internal server error' : err.message || 'Error' };

  if (!isProd && err.stack) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
}
