// Generic zod validation middleware factory.
// Usage: validate({ body: schema, query: schema, params: schema })

export function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({
            error: 'Validation failed',
            details: formatZodError(result.error),
          });
        }
        req.body = result.data;
      }

      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          return res.status(400).json({
            error: 'Validation failed',
            details: formatZodError(result.error),
          });
        }
        req.query = result.data;
      }

      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          return res.status(400).json({
            error: 'Validation failed',
            details: formatZodError(result.error),
          });
        }
        req.params = result.data;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

function formatZodError(zodError) {
  return zodError.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}
