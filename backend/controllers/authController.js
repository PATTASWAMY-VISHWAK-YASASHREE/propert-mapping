/**
 * Authentication Controller
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const db = require('../db');
const config = require('../config/config');

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
function register(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    const { first_name, last_name, email, password, company_id } = req.body;

    // Check if user already exists
    const userExists = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return next(new ErrorResponse('Email already in use', 400));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await db.query(
      `INSERT INTO users (first_name, last_name, email, password, company_id, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [first_name, last_name, email, hashedPassword, company_id, 'user', 'active']
    );

    const user = result.rows[0];

    sendTokenResponse(user, 200, res);
  })(req, res, next);
}

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
function login(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for user
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    const user = result.rows[0];

    // Check if user is active
    if (user.status !== 'active') {
      return next(new ErrorResponse('Your account is not active', 401));
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Log failed login attempt
      try {
        await db.query(
          `INSERT INTO login_attempts (user_id, ip_address, success)
           VALUES ($1, $2, $3)`,
          [user.id, req.ip, false]
        );
      } catch (err) {
        console.error('Failed to log login attempt:', err);
        // Continue anyway, this is not critical
      }
      
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Log successful login
    try {
      await db.query(
        `INSERT INTO login_attempts (user_id, ip_address, success)
         VALUES ($1, $2, $3)`,
        [user.id, req.ip, true]
      );
    } catch (err) {
      console.error('Failed to log login attempt:', err);
      // Continue anyway, this is not critical
    }

    // Store browser info and save to database
    try {
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const ipAddress = req.ip || req.connection.remoteAddress;
      
      await db.query(
        `INSERT INTO user_sessions (user_id, ip_address, user_agent, last_active)
         VALUES ($1, $2, $3, NOW())`,
        [user.id, ipAddress, userAgent]
      );
    } catch (err) {
      console.error('Failed to log user session:', err);
      // Continue anyway, this is not critical
    }

    sendTokenResponse(user, 200, res);
  })(req, res, next);
}

/**
 * @desc    Refresh authentication token
 * @route   POST /api/auth/refresh-token
 * @access  Public (with refresh token)
 */
function refreshToken(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return next(new ErrorResponse('No refresh token provided', 401));
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

      // Get user from the token
      const userResult = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [decoded.id]
      );

      if (userResult.rows.length === 0) {
        return next(new ErrorResponse('User not found', 401));
      }

      const user = userResult.rows[0];

      // Check if user is active
      if (user.status !== 'active') {
        return next(new ErrorResponse('Your account is not active', 401));
      }

      // Generate new tokens
      sendTokenResponse(user, 200, res);
    } catch (err) {
      return next(new ErrorResponse('Invalid refresh token', 401));
    }
  })(req, res, next);
}

/**
 * @desc    Log user out / clear cookie
 * @route   GET /api/auth/logout
 * @access  Private
 */
function logout(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    // Clear access token cookie
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    // Clear refresh token cookie
    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  })(req, res, next);
}

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
function getMe(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    // User is already available in req.user from the auth middleware
    const user = req.user;

    // Get user's company
    let company = null;
    if (user.company_id) {
      const companyResult = await db.query(
        'SELECT id, name FROM companies WHERE id = $1',
        [user.company_id]
      );
      
      if (companyResult.rows.length > 0) {
        company = companyResult.rows[0];
      }
    }

    // Remove sensitive data
    delete user.password;

    res.status(200).json({
      success: true,
      data: {
        ...user,
        company
      }
    });
  })(req, res, next);
}

/**
 * @desc    Update user details
 * @route   PUT /api/auth/updatedetails
 * @access  Private
 */
function updateDetails(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    const { first_name, last_name, email } = req.body;

    // Update user
    const result = await db.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, email = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [first_name, last_name, email, req.user.id]
    );

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: user
    });
  })(req, res, next);
}

/**
 * @desc    Update password
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
function updatePassword(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    // Get user
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];

    // Check current password
    const isMatch = await bcrypt.compare(req.body.current_password, user.password);

    if (!isMatch) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.new_password, salt);

    // Update password
    await db.query(
      `UPDATE users
       SET password = $1, updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, req.user.id]
    );

    sendTokenResponse(user, 200, res);
  })(req, res, next);
}

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgotpassword
 * @access  Public
 */
function forgotPassword(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    // Get user by email
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [req.body.email]
    );

    if (result.rows.length === 0) {
      return next(new ErrorResponse('There is no user with that email', 404));
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire
    const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user
    await db.query(
      `UPDATE users
       SET reset_token = $1, reset_token_expires = $2
       WHERE id = $3`,
      [resetPasswordToken, resetPasswordExpire, user.id]
    );

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/auth/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message
      });

      res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
      console.log(err);

      // Clear reset token fields
      await db.query(
        `UPDATE users
         SET reset_token = NULL, reset_token_expires = NULL
         WHERE id = $1`,
        [user.id]
      );

      return next(new ErrorResponse('Email could not be sent', 500));
    }
  })(req, res, next);
}

/**
 * @desc    Reset password
 * @route   PUT /api/auth/resetpassword/:resettoken
 * @access  Public
 */
function resetPassword(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    // Get hashed token
    const resetToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    // Find user by reset token
    const result = await db.query(
      `SELECT * FROM users
       WHERE reset_token = $1
       AND reset_token_expires > $2`,
      [resetToken, new Date()]
    );

    if (result.rows.length === 0) {
      return next(new ErrorResponse('Invalid token', 400));
    }

    const user = result.rows[0];

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Update password and clear reset token fields
    await db.query(
      `UPDATE users
       SET password = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    sendTokenResponse(user, 200, res);
  })(req, res, next);
}

/**
 * @desc    Setup Multi-Factor Authentication
 * @route   POST /api/auth/mfa/setup
 * @access  Private
 */
function setupMFA(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    // This is a placeholder implementation
    // In a real application, you would:
    // 1. Generate a secret key
    // 2. Create a QR code for the user to scan
    // 3. Save the secret to the user's profile
    
    res.status(200).json({
      success: true,
      data: {
        message: 'MFA setup placeholder - not yet implemented'
      }
    });
  })(req, res, next);
}

/**
 * @desc    Verify Multi-Factor Authentication
 * @route   POST /api/auth/mfa/verify
 * @access  Private
 */
function verifyMFA(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    // This is a placeholder implementation
    // In a real application, you would:
    // 1. Get the token from the request
    // 2. Verify it against the user's secret
    // 3. Complete the authentication if valid
    
    res.status(200).json({
      success: true,
      data: {
        message: 'MFA verification placeholder - not yet implemented'
      }
    });
  })(req, res, next);
}

/**
 * @desc    Save browsing history
 * @route   POST /api/auth/history
 * @access  Private
 */
function saveBrowsingHistory(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    const { url, title, timestamp } = req.body;
    
    if (!url) {
      return next(new ErrorResponse('URL is required', 400));
    }
    
    // Save browsing history to database
    await db.query(
      `INSERT INTO browsing_history (user_id, url, title, visited_at)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, url, title || url, timestamp || new Date()]
    );
    
    res.status(200).json({
      success: true,
      data: {}
    });
  })(req, res, next);
}

/**
 * @desc    Get browsing history
 * @route   GET /api/auth/history
 * @access  Private
 */
function getBrowsingHistory(req, res, next) {
  return asyncHandler(async function(req, res, next) {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    // Get browsing history from database
    const result = await db.query(
      `SELECT * FROM browsing_history
       WHERE user_id = $1
       ORDER BY visited_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  })(req, res, next);
}

/**
 * Get token from model, create cookie and send response
 */
function sendTokenResponse(user, statusCode, res) {
  // Create access token
  const accessToken = generateAccessToken(user);
  
  // Create refresh token
  const refreshToken = generateRefreshToken(user);

  // Set cookie options - FIXED: Use maxAge instead of expires
  const cookieOptions = {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  // Send response with cookies
  res
    .status(statusCode)
    .cookie('token', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json({
      success: true,
      token: accessToken
    });
}

/**
 * Generate access token
 */
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id },
    config.jwt.secret,
    { expiresIn: config.jwt.expire }
  );
}

/**
 * Generate refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    config.jwt.refreshSecret || config.jwt.secret,
    { expiresIn: config.jwt.refreshExpire || '7d' }
  );
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
  setupMFA,
  verifyMFA,
  saveBrowsingHistory,
  getBrowsingHistory
};