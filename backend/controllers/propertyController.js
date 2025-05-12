/**
 * Property Controller
 * Handles property data and operations
 */

const Property = require('../models/Property');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get all properties
 * @route   GET /api/properties
 * @access  Private
 */
exports.getProperties = asyncHandler(async (req, res, next) => {
  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\\b(gt|gte|lt|lte|in)\\b/g, match => `$${match}`);

  // Finding resource
  let query = Property.find(JSON.parse(queryStr));

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Property.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const properties = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: properties.length,
    pagination,
    data: properties
  });
});

/**
 * @desc    Get single property
 * @route   GET /api/properties/:id
 * @access  Private
 */
exports.getProperty = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id).populate({
    path: 'currentOwnership.ownerId',
    select: 'displayName type'
  });

  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }

  // Log user activity
  await logUserActivity(req.user.id, 'property_view', {
    propertyId: property._id,
    address: property.formattedAddress
  });

  // Check if property is bookmarked by user
  const user = await User.findById(req.user.id);
  const isBookmarked = user.bookmarks && user.bookmarks.some(
    bookmark => bookmark.property.toString() === property._id.toString()
  );

  // Add isBookmarked field to response
  const propertyResponse = property.toObject();
  propertyResponse.isBookmarked = isBookmarked;

  res.status(200).json({
    success: true,
    data: propertyResponse
  });
});

/**
 * @desc    Create new property
 * @route   POST /api/properties
 * @access  Private
 */
exports.createProperty = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  const property = await Property.create(req.body);

  res.status(201).json({
    success: true,
    data: property
  });
});

/**
 * @desc    Update property
 * @route   PUT /api/properties/:id
 * @access  Private
 */
exports.updateProperty = asyncHandler(async (req, res, next) => {
  let property = await Property.findById(req.params.id);

  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user has admin role
  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this property`,
        403
      )
    );
  }

  property = await Property.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: property
  });
});

/**
 * @desc    Delete property
 * @route   DELETE /api/properties/:id
 * @access  Private
 */
exports.deleteProperty = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user has admin role
  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this property`,
        403
      )
    );
  }

  await property.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Get property history
 * @route   GET /api/properties/:id/history
 * @access  Private
 */
exports.getPropertyHistory = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${req.params.id}`, 404)
    );
  }

  // Get sale history
  const saleHistory = property.saleHistory || [];

  res.status(200).json({
    success: true,
    data: saleHistory
  });
});

/**
 * @desc    Bookmark property
 * @route   POST /api/properties/bookmark
 * @access  Private
 */
exports.bookmarkProperty = asyncHandler(async (req, res, next) => {
  const { propertyId, notes } = req.body;

  // Check if property exists
  const property = await Property.findById(propertyId);

  if (!property) {
    return next(
      new ErrorResponse(`Property not found with id of ${propertyId}`, 404)
    );
  }

  // Get user
  const user = await User.findById(req.user.id);

  // Check if property is already bookmarked
  if (user.bookmarks && user.bookmarks.some(
    bookmark => bookmark.property.toString() === propertyId
  )) {
    return next(
      new ErrorResponse(`Property ${propertyId} is already bookmarked`, 400)
    );
  }

  // Add bookmark
  user.bookmarks.push({
    property: propertyId,
    notes: notes || '',
    createdAt: Date.now()
  });

  await user.save();

  // Log user activity
  await logUserActivity(req.user.id, 'bookmark', {
    propertyId: property._id,
    address: property.formattedAddress
  });

  res.status(200).json({
    success: true,
    data: {
      propertyId,
      notes
    }
  });
});

/**
 * @desc    Remove bookmark
 * @route   DELETE /api/properties/bookmark/:id
 * @access  Private
 */
exports.removeBookmark = asyncHandler(async (req, res, next) => {
  const propertyId = req.params.id;

  // Get user
  const user = await User.findById(req.user.id);

  // Check if property is bookmarked
  const bookmarkIndex = user.bookmarks.findIndex(
    bookmark => bookmark.property.toString() === propertyId
  );

  if (bookmarkIndex === -1) {
    return next(
      new ErrorResponse(`Property ${propertyId} is not bookmarked`, 404)
    );
  }

  // Remove bookmark
  user.bookmarks.splice(bookmarkIndex, 1);
  await user.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Get bookmarked properties
 * @route   GET /api/properties/bookmarks
 * @access  Private
 */
exports.getBookmarkedProperties = asyncHandler(async (req, res, next) => {
  // Get user with bookmarks
  const user = await User.findById(req.user.id);

  // Get property IDs from bookmarks
  const propertyIds = user.bookmarks.map(bookmark => bookmark.property);

  // Get properties
  const properties = await Property.find({ _id: { $in: propertyIds } });

  // Combine property data with bookmark data
  const bookmarkedProperties = properties.map(property => {
    const bookmark = user.bookmarks.find(
      b => b.property.toString() === property._id.toString()
    );

    return {
      property,
      notes: bookmark.notes,
      bookmarkedAt: bookmark.createdAt
    };
  });

  res.status(200).json({
    success: true,
    count: bookmarkedProperties.length,
    data: bookmarkedProperties
  });
});

// Helper function to log user activity
const logUserActivity = async (userId, activityType, details) => {
  try {
    const user = await User.findById(userId);
    
    // In a real implementation, you would save to an activity log collection
    // This is a placeholder
    console.log(`User activity: ${userId} - ${activityType} - ${JSON.stringify(details)}`);
    
    return true;
  } catch (err) {
    console.error('Error logging user activity:', err);
    return false;
  }
};