/**
 * Map Controller
 * Handles map-related API endpoints
 */

const asyncHandler = require('../middleware/async');
const mapService = require('../services/mapService');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Geocode an address
 * @route   POST /api/map/geocode
 * @access  Private
 */
exports.geocodeAddress = asyncHandler(async (req, res, next) => {
  const { address } = req.body;

  if (!address) {
    return next(new ErrorResponse('Please provide an address', 400));
  }

  const result = await mapService.geocodeAddress(address);
  
  res.status(200).json(result);
});

/**
 * @desc    Reverse geocode coordinates
 * @route   GET /api/map/reverse-geocode
 * @access  Private
 */
exports.reverseGeocode = asyncHandler(async (req, res, next) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return next(new ErrorResponse('Please provide latitude and longitude', 400));
  }

  const result = await mapService.reverseGeocode(lat, lng);
  
  res.status(200).json(result);
});

/**
 * @desc    Get address suggestions
 * @route   GET /api/map/suggestions
 * @access  Private
 */
exports.getAddressSuggestions = asyncHandler(async (req, res, next) => {
  const { query } = req.query;

  if (!query || query.length < 3) {
    return next(new ErrorResponse('Please provide a search query with at least 3 characters', 400));
  }

  const result = await mapService.geocodeAddress(query);
  
  res.status(200).json(result);
});

/**
 * @desc    Save map view
 * @route   POST /api/map/views
 * @access  Private
 */
exports.saveMapView = asyncHandler(async (req, res, next) => {
  const { name, center, zoom, bounds, filters } = req.body;

  if (!name || !center || !zoom) {
    return next(new ErrorResponse('Please provide name, center, and zoom', 400));
  }

  const mapView = await mapService.saveMapView({
    name,
    center,
    zoom,
    bounds,
    filters
  }, req.user.id);
  
  res.status(201).json({
    success: true,
    data: mapView
  });
});

/**
 * @desc    Get saved map views
 * @route   GET /api/map/views
 * @access  Private
 */
exports.getSavedMapViews = asyncHandler(async (req, res, next) => {
  const mapViews = await mapService.getSavedMapViews(req.user.id);
  
  res.status(200).json({
    success: true,
    count: mapViews.length,
    data: mapViews
  });
});

/**
 * @desc    Delete saved map view
 * @route   DELETE /api/map/views/:id
 * @access  Private
 */
exports.deleteSavedMapView = asyncHandler(async (req, res, next) => {
  await mapService.deleteSavedMapView(req.params.id, req.user.id);
  
  res.status(200).json({
    success: true,
    data: {}
  });
});