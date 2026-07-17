const { AppError } = require('../utils/errors');


function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const body = { error: err.name, message: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.statusCode).json(body);
  }

  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'ValidationError', message: 'Invalid payload', details });
  }


  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'ValidationError', message: `Invalid ${err.path}: ${err.value}` });
  }

 
  if (err.code === 11000) {
    return res.status(409).json({ error: 'ConflictError', message: 'Duplicate resource', details: err.keyValue });
  }

  console.error(err);
  return res.status(500).json({ error: 'InternalServerError', message: 'An unexpected error occurred' });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'NotFoundError', message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFoundHandler };