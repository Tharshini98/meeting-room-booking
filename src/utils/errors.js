
class AppError extends Error {
  constructor(name, message, statusCode, details) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super('ValidationError', message, 400, details);
  }
}

class NotFoundError extends AppError {
  constructor(message, details) {
    super('NotFoundError', message, 404, details);
  }
}

class ConflictError extends AppError {
  constructor(message, details) {
    super('ConflictError', message, 409, details);
  }
}

module.exports = { AppError, ValidationError, NotFoundError, ConflictError };