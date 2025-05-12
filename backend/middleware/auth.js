/**
 * Authentication middleware
 */

const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const db = require('../db');
const config = require('../config/config');

/**
 * Protect routes - require authentication
 */
function protect(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    let token;

    // Get token from Authorization header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Set token from Bearer token in header
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      // Set token from cookie
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Check token expiration
      if (decoded.exp < Date.now() / 1000) {
        return next(new ErrorResponse('Token expired, please log in again', 401));
      }

      // Get user from the token
      const userResult = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [decoded.id]
      );

      if (userResult.rows.length === 0) {
        return next(new ErrorResponse('User not found', 401));
      }

      // Check if user is active
      if (userResult.rows[0].status !== 'active') {
        return next(new ErrorResponse('User account is not active', 401));
      }

      req.user = userResult.rows[0];
      next();
    } catch (err) {
      console.error('Auth error:', err.message);
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
  })(req, res, next);
}

/**
 * Grant access to specific roles
 */
function authorize(...roles) {
  return function(req, res, next) {
    if (!req.user) {
      return next(new ErrorResponse('User not found', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
}

/**
 * Check if user has specific permission
 */
function checkPermission(permission) {
  return function(req, res, next) {
    return asyncHandler(async function(req, res, next) {
      if (!req.user) {
        return next(new ErrorResponse('User not found', 401));
      }
      
      // Admin has all permissions
      if (req.user.role === 'admin') {
        return next();
      }
      
      // For now, map permissions to roles
      // In a more complex system, you would check a permissions table
      const rolePermissions = {
        'admin': ['manage_users', 'invite_users', 'delete_users', 'manage_companies', 'generate_reports', 'export_data'],
        'manager': ['invite_users', 'generate_reports', 'export_data'],
        'user': ['generate_reports']
      };
      
      const userPermissions = rolePermissions[req.user.role] || [];
      
      if (!userPermissions.includes(permission)) {
        return next(
          new ErrorResponse(
            `User does not have permission: ${permission}`,
            403
          )
        );
      }
      
      next();
    })(req, res, next);
  };
}

module.exports = {
  protect,
  authorize,
  checkPermission
};