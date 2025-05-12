/**
 * Request validation middleware
 * Uses express-validator to validate request data
 */

const { validationResult } = require('express-validator');

/**
 * Validate request middleware
 * Checks for validation errors and returns them as a response
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

module.exports = validateRequest;