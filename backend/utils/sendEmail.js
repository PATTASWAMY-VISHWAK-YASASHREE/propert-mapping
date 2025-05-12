/**
 * Email sending utility
 */

const nodemailer = require('nodemailer');
const config = require('../config/config');

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email message (HTML or text)
 * @returns {Promise} - Nodemailer response
 */
const sendEmail = async (options) => {
  // For development, use a test account
  let transporter;
  
  if (process.env.NODE_ENV === 'production' && config.email.host) {
    // Production configuration
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465, // true for 465, false for other ports
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });
  } else {
    // Development - use ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  // Email options
  const mailOptions = {
    from: `${config.email.fromName || 'Property Mapping Platform'} <${config.email.from || 'noreply@propertymapping.com'}>`,
    to: options.email,
    subject: options.subject,
    html: options.message
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);
  
  // Log URL for development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
  
  return info;
};

module.exports = sendEmail;