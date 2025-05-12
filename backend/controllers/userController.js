/**
 * User Controller
 * Handles user management and onboarding
 */

const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');

/**
 * @desc    Invite a new user
 * @route   POST /api/users/invite
 * @access  Private (Admin, Manager)
 */
function inviteUser(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    const { email, first_name, last_name, role } = req.body;

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return next(new ErrorResponse('User already exists with that email', 400));
    }

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(10).toString('hex');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);
    
    // Create user
    const result = await db.query(
      `INSERT INTO users (first_name, last_name, email, password, role, status, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [first_name, last_name, email, hashedPassword, role || 'user', 'invited', req.user.company_id]
    );
    
    const user = result.rows[0];

    // Generate invite token (would be implemented in a real application)
    const inviteToken = crypto.randomBytes(20).toString('hex');
    
    // Create invite URL
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite/${inviteToken}`;

    // Send email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Invitation to Property Mapping Platform',
        message: `
          <h1>You've been invited to join the Property Mapping Platform</h1>
          <p>Hello ${user.first_name},</p>
          <p>${req.user.first_name} ${req.user.last_name} has invited you to join their organization on the Property Mapping Platform.</p>
          <p>Please click the link below to set up your account:</p>
          <a href="${inviteUrl}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Accept Invitation</a>
          <p>This invitation will expire in 7 days.</p>
          <p>If you have any questions, please contact ${req.user.first_name} ${req.user.last_name} at ${req.user.email}.</p>
        `
      });

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          status: user.status
        }
      });
    } catch (err) {
      // In a real application, you would update the user to remove the invite token
      return next(new ErrorResponse('Email could not be sent', 500));
    }
  })(req, res, next);
}

/**
 * @desc    Accept user invitation
 * @route   POST /api/users/accept-invite
 * @access  Public
 */
function acceptInvite(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    const { token, password } = req.body;

    if (!token || !password) {
      return next(new ErrorResponse('Please provide token and password', 400));
    }

    // In a real application, you would find the user by the invite token
    // For now, we'll just return a success response
    res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully'
    });
  })(req, res, next);
}

/**
 * @desc    Get all users (for a company)
 * @route   GET /api/users
 * @access  Private (Admin)
 */
function getUsers(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    // Get users for the company
    const result = await db.query(
      `SELECT id, first_name, last_name, email, role, status, created_at, updated_at
       FROM users
       WHERE company_id = $1
       ORDER BY first_name, last_name`,
      [req.user.company_id]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  })(req, res, next);
}

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private (Admin)
 */
function getUser(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    const result = await db.query(
      `SELECT id, first_name, last_name, email, role, status, company_id, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    const user = result.rows[0];

    // Check if user belongs to same company
    if (user.company_id !== req.user.company_id) {
      return next(new ErrorResponse('Not authorized to view this user', 403));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  })(req, res, next);
}

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private (Admin or Self)
 */
function updateUser(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    // Check if user has permission to update this user
    const isSelf = req.params.id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isAdmin && !isSelf) {
      return next(new ErrorResponse('Not authorized to update this user', 403));
    }

    // Get user
    const userResult = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [req.params.id]
    );

    if (userResult.rows.length === 0) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    const user = userResult.rows[0];

    // Check if user belongs to same company
    if (user.company_id !== req.user.company_id) {
      return next(new ErrorResponse('Not authorized to update this user', 403));
    }

    // Fields that can be updated by self
    const selfUpdateFields = ['first_name', 'last_name'];
    
    // Fields that can only be updated by admin
    const adminOnlyFields = ['role', 'status'];

    // Create update object
    const updateFields = {};
    const updateValues = [];
    let updateQuery = 'UPDATE users SET ';
    let paramIndex = 1;
    
    // Add fields that can be updated by self
    selfUpdateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
        updateQuery += `${field} = $${paramIndex}, `;
        updateValues.push(req.body[field]);
        paramIndex++;
      }
    });
    
    // Add admin-only fields if user is admin
    if (isAdmin) {
      adminOnlyFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateFields[field] = req.body[field];
          updateQuery += `${field} = $${paramIndex}, `;
          updateValues.push(req.body[field]);
          paramIndex++;
        }
      });
    }
    
    // Add updated_at timestamp
    updateQuery += `updated_at = NOW() WHERE id = $${paramIndex}`;
    updateValues.push(req.params.id);
    
    // Update user
    const result = await db.query(
      updateQuery + ' RETURNING *',
      updateValues
    );

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  })(req, res, next);
}

/**
 * @desc    Delete/Disable user
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 */
function deleteUser(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    // Get user
    const userResult = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [req.params.id]
    );

    if (userResult.rows.length === 0) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    const user = userResult.rows[0];

    // Check if user belongs to same company
    if (user.company_id !== req.user.company_id) {
      return next(new ErrorResponse('Not authorized to delete this user', 403));
    }

    // Don't allow deleting self
    if (user.id === req.user.id) {
      return next(new ErrorResponse('Cannot delete your own account', 400));
    }

    // Instead of deleting, update status to disabled
    await db.query(
      `UPDATE users
       SET status = 'disabled', updated_at = NOW()
       WHERE id = $1`,
      [req.params.id]
    );

    res.status(200).json({
      success: true,
      data: {}
    });
  })(req, res, next);
}

/**
 * @desc    Get user activity
 * @route   GET /api/users/:id/activity
 * @access  Private (Admin or Self)
 */
function getUserActivity(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    // Check if user has permission to view activity
    const isSelf = req.params.id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isAdmin && !isSelf) {
      return next(new ErrorResponse('Not authorized to view this user activity', 403));
    }

    // Get user
    const userResult = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [req.params.id]
    );

    if (userResult.rows.length === 0) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    const user = userResult.rows[0];

    // Check if user belongs to same company
    if (user.company_id !== req.user.company_id) {
      return next(new ErrorResponse('Not authorized to view this user activity', 403));
    }

    // In a real implementation, you would query your activity logs
    // This is a placeholder
    const activities = [
      {
        type: 'login',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        details: { ip: '192.168.1.1', device: 'Chrome on Windows' }
      },
      {
        type: 'property_view',
        timestamp: new Date(Date.now() - 85400000),
        details: { propertyId: '5f8d0c1b8f3ec31234567890', address: '123 Main St' }
      },
      {
        type: 'search',
        timestamp: new Date(Date.now() - 84400000),
        details: { query: 'properties in New York', results: 42 }
      },
      {
        type: 'export',
        timestamp: new Date(Date.now() - 83400000),
        details: { type: 'csv', records: 15 }
      }
    ];

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  })(req, res, next);
}

/**
 * @desc    Setup MFA for user
 * @route   POST /api/users/mfa/setup
 * @access  Private
 */
function setupMFA(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    // This is a placeholder implementation
    // In a real application, you would generate a secret and QR code
    
    res.status(200).json({
      success: true,
      data: {
        message: 'MFA setup placeholder - not yet implemented'
      }
    });
  })(req, res, next);
}

/**
 * @desc    Verify and enable MFA
 * @route   POST /api/users/mfa/verify
 * @access  Private
 */
function verifyMFA(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    // This is a placeholder implementation
    // In a real application, you would verify the token and enable MFA
    
    res.status(200).json({
      success: true,
      data: {
        message: 'MFA verification placeholder - not yet implemented'
      }
    });
  })(req, res, next);
}

module.exports = {
  inviteUser,
  acceptInvite,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserActivity,
  setupMFA,
  verifyMFA
};