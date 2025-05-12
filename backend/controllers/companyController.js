/**
 * Company Controller
 * Handles company registration and management
 */

const Company = require('../models/Company');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Register a new company
 * @route   POST /api/companies
 * @access  Public
 */
exports.registerCompany = asyncHandler(async (req, res, next) => {
  const { name, contactEmail, contactPhone, address, website } = req.body;

  // Create company
  const company = await Company.create({
    name,
    contactEmail,
    contactPhone,
    address,
    website
  });

  // Create admin user
  const { adminFirstName, adminLastName, adminEmail, adminPassword } = req.body;
  
  const user = await User.create({
    company: company._id,
    firstName: adminFirstName,
    lastName: adminLastName,
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
    status: 'active',
    acceptedTerms: true,
    completedOnboarding: false
  });

  // Update company with created by
  company.createdBy = user._id;
  await company.save();

  // Generate token
  const token = user.getSignedJwtToken();

  res.status(201).json({
    success: true,
    data: {
      company,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      token
    }
  });
});

/**
 * @desc    Get company details
 * @route   GET /api/companies/:id
 * @access  Private (Admin only)
 */
exports.getCompany = asyncHandler(async (req, res, next) => {
  // Check if user belongs to this company
  if (req.params.id !== req.user.company.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this company', 403));
  }

  const company = await Company.findById(req.params.id);

  if (!company) {
    return next(new ErrorResponse(`Company not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: company
  });
});

/**
 * @desc    Update company details
 * @route   PUT /api/companies/:id
 * @access  Private (Admin only)
 */
exports.updateCompany = asyncHandler(async (req, res, next) => {
  // Check if user belongs to this company and is admin
  if (req.params.id !== req.user.company.toString() || req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this company', 403));
  }

  // Fields to update
  const fieldsToUpdate = {
    name: req.body.name,
    logo: req.body.logo,
    contactEmail: req.body.contactEmail,
    contactPhone: req.body.contactPhone,
    address: req.body.address,
    website: req.body.website,
    dataAccessPreferences: req.body.dataAccessPreferences
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const company = await Company.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  if (!company) {
    return next(new ErrorResponse(`Company not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: company
  });
});

/**
 * @desc    Get company usage statistics
 * @route   GET /api/companies/:id/stats
 * @access  Private (Admin only)
 */
exports.getCompanyStats = asyncHandler(async (req, res, next) => {
  // Check if user belongs to this company and is admin
  if (req.params.id !== req.user.company.toString() || req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access company statistics', 403));
  }

  // Get user count
  const userCount = await User.countDocuments({ company: req.params.id });

  // Get active users in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activeUsers = await User.countDocuments({
    company: req.params.id,
    lastLogin: { $gte: thirtyDaysAgo }
  });

  // Get user activity stats (would typically come from an activity log collection)
  // This is a placeholder - in a real implementation, you would query your activity logs
  const activityStats = {
    totalSearches: 1250,
    totalExports: 87,
    totalReports: 42,
    propertiesViewed: 3567,
    wealthProfilesViewed: 189
  };

  // Get subscription info
  const company = await Company.findById(req.params.id).select('subscription');

  res.status(200).json({
    success: true,
    data: {
      users: {
        total: userCount,
        active: activeUsers
      },
      activity: activityStats,
      subscription: company.subscription
    }
  });
});

/**
 * @desc    Generate API key for company
 * @route   POST /api/companies/:id/api-keys
 * @access  Private (Admin only)
 */
exports.generateApiKey = asyncHandler(async (req, res, next) => {
  // Check if user belongs to this company and is admin
  if (req.params.id !== req.user.company.toString() || req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to generate API keys', 403));
  }

  const { name, permissions } = req.body;

  if (!name) {
    return next(new ErrorResponse('Please provide a name for the API key', 400));
  }

  // Generate a secure random API key
  const crypto = require('crypto');
  const apiKey = crypto.randomBytes(32).toString('hex');

  // Add API key to company
  const company = await Company.findById(req.params.id);

  if (!company) {
    return next(new ErrorResponse(`Company not found with id of ${req.params.id}`, 404));
  }

  company.apiKeys.push({
    name,
    key: apiKey,
    permissions: permissions || [],
    createdAt: Date.now()
  });

  await company.save();

  res.status(201).json({
    success: true,
    data: {
      name,
      key: apiKey,
      permissions: permissions || [],
      createdAt: Date.now()
    }
  });
});

/**
 * @desc    Delete API key
 * @route   DELETE /api/companies/:id/api-keys/:keyId
 * @access  Private (Admin only)
 */
exports.deleteApiKey = asyncHandler(async (req, res, next) => {
  // Check if user belongs to this company and is admin
  if (req.params.id !== req.user.company.toString() || req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete API keys', 403));
  }

  const company = await Company.findById(req.params.id);

  if (!company) {
    return next(new ErrorResponse(`Company not found with id of ${req.params.id}`, 404));
  }

  // Find and remove the API key
  const keyIndex = company.apiKeys.findIndex(
    key => key._id.toString() === req.params.keyId
  );

  if (keyIndex === -1) {
    return next(new ErrorResponse(`API key not found with id of ${req.params.keyId}`, 404));
  }

  company.apiKeys.splice(keyIndex, 1);
  await company.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});