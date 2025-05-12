/**
 * Authentication routes
 */

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  refreshToken,
  setupMFA,
  verifyMFA,
  saveBrowsingHistory,
  getBrowsingHistory
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

// Input validation
const registerValidation = [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').exists().withMessage('Password is required')
];

const passwordValidation = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const updatePasswordValidation = [
  body('current_password').exists().withMessage('Current password is required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

const historyValidation = [
  body('url').notEmpty().withMessage('URL is required')
];

// Define routes with explicit function references and validation
router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.post('/refresh-token', refreshToken);
router.post('/forgotpassword', body('email').isEmail().withMessage('Please include a valid email'), validateRequest, forgotPassword);
router.put('/resetpassword/:resettoken', passwordValidation, validateRequest, resetPassword);
router.put('/updatepassword', protect, updatePasswordValidation, validateRequest, updatePassword);
router.post('/mfa/setup', protect, setupMFA);
router.post('/mfa/verify', protect, body('token').notEmpty().withMessage('MFA token is required'), validateRequest, verifyMFA);

// Browsing history routes
router.post('/history', protect, historyValidation, validateRequest, saveBrowsingHistory);
router.get('/history', protect, getBrowsingHistory);

module.exports = router;