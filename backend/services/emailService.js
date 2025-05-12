/**
 * Email Service
 * Handles email sending functionality
 */

const nodemailer = require('nodemailer');
const sendEmail = require('../utils/sendEmail');

/**
 * Send user invitation email
 * @param {Object} user - User object
 * @param {string} inviteUrl - Invitation URL
 * @param {Object} inviter - User who sent the invitation
 * @returns {Promise<boolean>} Success status
 */
exports.sendInvitationEmail = async (user, inviteUrl, inviter) => {
  try {
    await sendEmail({
      email: user.email,
      subject: 'Invitation to Property Mapping Platform',
      message: `
        <h1>You've been invited to join the Property Mapping Platform</h1>
        <p>Hello ${user.firstName},</p>
        <p>${inviter.fullName} has invited you to join their organization on the Property Mapping Platform.</p>
        <p>Please click the link below to set up your account:</p>
        <a href="${inviteUrl}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Accept Invitation</a>
        <p>This invitation will expire in 7 days.</p>
        <p>If you have any questions, please contact ${inviter.fullName} at ${inviter.email}.</p>
      `
    });
    
    return true;
  } catch (err) {
    console.error('Error sending invitation email:', err);
    return false;
  }
};

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} resetUrl - Password reset URL
 * @returns {Promise<boolean>} Success status
 */
exports.sendPasswordResetEmail = async (user, resetUrl) => {
  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message: `
        <h1>You have requested a password reset</h1>
        <p>Hello ${user.firstName},</p>
        <p>Please click on the link below to reset your password:</p>
        <a href="${resetUrl}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
        <p>This link will expire in 10 minutes.</p>
        <p>If you did not request this reset, please ignore this email.</p>
      `
    });
    
    return true;
  } catch (err) {
    console.error('Error sending password reset email:', err);
    return false;
  }
};

/**
 * Send scheduled report email
 * @param {Object} user - User object
 * @param {Object} report - Report object
 * @param {string} downloadUrl - Report download URL
 * @returns {Promise<boolean>} Success status
 */
exports.sendScheduledReportEmail = async (user, report, downloadUrl) => {
  try {
    await sendEmail({
      email: user.email,
      subject: `Your Scheduled Report: ${report.name}`,
      message: `
        <h1>Your Scheduled Report is Ready</h1>
        <p>Hello ${user.firstName},</p>
        <p>Your scheduled report "${report.name}" has been generated and is ready for download.</p>
        <p>Click the button below to view and download your report:</p>
        <a href="${downloadUrl}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Download Report</a>
        <p>This report was automatically generated according to your schedule.</p>
      `
    });
    
    return true;
  } catch (err) {
    console.error('Error sending scheduled report email:', err);
    return false;
  }
};

/**
 * Send notification email
 * @param {Object} user - User object
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 * @returns {Promise<boolean>} Success status
 */
exports.sendNotificationEmail = async (user, subject, message) => {
  try {
    await sendEmail({
      email: user.email,
      subject,
      message
    });
    
    return true;
  } catch (err) {
    console.error('Error sending notification email:', err);
    return false;
  }
};