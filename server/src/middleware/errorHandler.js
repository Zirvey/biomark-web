/**
 * Global error handler middleware
 */
module.exports = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code?.startsWith('P')) {
    return res.status(500).json({
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: Array.isArray(err.errors) ? err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      })) : []
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
