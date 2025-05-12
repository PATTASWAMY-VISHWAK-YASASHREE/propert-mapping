/**
 * Error handling middleware
 */

const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(err.stack);

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // PostgreSQL foreign key constraint violation
  if (err.code === '23503') {
    const message = 'Referenced resource not found';
    error = new ErrorResponse(message, 404);
  }

  // PostgreSQL not null constraint violation
  if (err.code === '23502') {
    const message = 'Required field missing';
    error = new ErrorResponse(message, 400);
  }

  // PostgreSQL invalid input syntax
  if (err.code === '22P02') {
    const message = 'Invalid input syntax';
    error = new ErrorResponse(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new ErrorResponse(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new ErrorResponse(message, 401);
  }

  // Network errors
  if (err.name === 'NetworkError' || (err.code && err.code === 'ECONNREFUSED')) {
    const message = 'Network connection error';
    error = new ErrorResponse(message, 503);
  }

  // JSON parsing errors
  if (err.type === 'entity.parse.failed' || err.message.includes('JSON')) {
    const message = 'Invalid JSON format';
    error = new ErrorResponse(message, 400);
  }

  // Always ensure proper content type for error responses
  res.setHeader('Content-Type', 'application/json');
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    // Include stack trace in development mode
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;