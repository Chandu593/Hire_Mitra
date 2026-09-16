export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err?.code === 11000) {
    return res.status(409).json({
      message: 'A record with these unique fields already exists.'
    });
  }
  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      message: Object.values(err.errors)
        .map(error => error.message)
        .join(', ')
    });
  }
  if (err?.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid id format.'
    });
  }
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
}
