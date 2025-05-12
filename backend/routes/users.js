/**
 * User routes
 */

const express = require('express');
const {
  inviteUser,
  acceptInvite,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserActivity,
  setupMFA,
  verifyMFA
} = require('../controllers/userController');

const { protect, authorize, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Define routes
router.post('/invite', checkPermission('invite_users'), inviteUser);
router.post('/accept-invite', acceptInvite);
router.get('/', checkPermission('manage_users'), getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', checkPermission('manage_users'), deleteUser);
router.get('/:id/activity', getUserActivity);
router.post('/mfa/setup', setupMFA);
router.post('/mfa/verify', verifyMFA);

module.exports = router;