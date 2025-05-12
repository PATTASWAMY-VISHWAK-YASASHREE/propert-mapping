/**
 * Authentication Service
 * Handles authentication-related business logic
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const emailService = require('./emailService');

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
exports.generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, company: user.company },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token or null if invalid
 */
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

/**
 * Generate password reset token
 * @param {Object} user - User object
 * @returns {string} Reset token
 */
exports.generatePasswordResetToken = async (user) => {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time (10 minutes)
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  return resetToken;
};

/**
 * Generate invite token
 * @param {Object} user - User object
 * @returns {string} Invite token
 */
exports.generateInviteToken = async (user) => {
  // Generate token
  const inviteToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to inviteToken field
  user.inviteToken = crypto
    .createHash('sha256')
    .update(inviteToken)
    .digest('hex');

  // Set expire time (7 days)
  user.inviteExpires = Date.now() + 7 * 24 * 60 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  return inviteToken;
};

/**
 * Setup MFA for user
 * @param {Object} user - User object
 * @returns {Object} MFA setup data
 */
exports.setupMFA = async (user) => {
  // Generate MFA secret
  const secret = speakeasy.generateSecret({
    name: `PropertyMapping:${user.email}`
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  // Save secret to user
  user.mfa.secret = secret.base32;
  await user.save();

  return {
    secret: secret.base32,
    qrCode: qrCodeUrl
  };
};

/**
 * Verify MFA token
 * @param {Object} user - User object
 * @param {string} token - MFA token
 * @returns {boolean} Verification result
 */
exports.verifyMFA = (user, token) => {
  return speakeasy.totp.verify({
    secret: user.mfa.secret,
    encoding: 'base32',
    token
  });
};

/**
 * Generate backup codes for MFA
 * @param {Object} user - User object
 * @returns {Array<string>} Backup codes
 */
exports.generateBackupCodes = async (user) => {
  // Generate 10 backup codes
  const backupCodes = Array(10)
    .fill()
    .map(() => crypto.randomBytes(4).toString('hex'));

  // Save backup codes to user
  user.mfa.backupCodes = backupCodes;
  await user.save();

  return backupCodes;
};

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} resetUrl - Reset URL
 * @returns {Promise<boolean>} Success status
 */
exports.sendPasswordResetEmail = async (user, resetUrl) => {
  return await emailService.sendPasswordResetEmail(user, resetUrl);
};

/**
 * Send invitation email
 * @param {Object} user - User object
 * @param {string} inviteUrl - Invitation URL
 * @param {Object} inviter - User who sent the invitation
 * @returns {Promise<boolean>} Success status
 */
exports.sendInvitationEmail = async (user, inviteUrl, inviter) => {
  return await emailService.sendInvitationEmail(user, inviteUrl, inviter);
};