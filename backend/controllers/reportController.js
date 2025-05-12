/**
 * Report Controller
 * Handles report generation and exports
 */

const Report = require('../models/Report');
const Property = require('../models/Property');
const Owner = require('../models/Owner');
const WealthProfile = require('../models/WealthProfile');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Create a new report
 * @route   POST /api/reports
 * @access  Private
 */
exports.createReport = asyncHandler(async (req, res, next) => {
  const { name, type, parameters } = req.body;

  if (!name || !type || !parameters) {
    return next(new ErrorResponse('Please provide name, type, and parameters', 400));
  }

  // Create report
  const report = await Report.create({
    userId: req.user.id,
    companyId: req.user.companyId,
    name,
    type,
    parameters,
    lastGenerated: new Date()
  });

  // Generate report data
  const reportData = await generateReportData(report);

  // Save report data
  await Report.update(report.id, { data: reportData });

  res.status(201).json({
    success: true,
    data: {
      id: report.id,
      name: report.name,
      type: report.type,
      createdAt: report.createdAt,
      lastGenerated: report.lastGenerated
    }
  });
});

/**
 * @desc    Get all reports
 * @route   GET /api/reports
 * @access  Private
 */
exports.getReports = asyncHandler(async (req, res, next) => {
  const reports = await Report.getAll({
    userId: req.user.id
  });

  res.status(200).json({
    success: true,
    count: reports.length,
    data: reports
  });
});

/**
 * @desc    Get single report
 * @route   GET /api/reports/:id
 * @access  Private
 */
exports.getReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    return next(new ErrorResponse(`Report not found with id of ${req.params.id}`, 404));
  }

  // Check if user owns this report
  if (report.userId !== req.user.id) {
    return next(new ErrorResponse('Not authorized to access this report', 403));
  }

  // Check if report needs to be regenerated
  const regenerate = req.query.regenerate === 'true';
  
  if (regenerate) {
    // Generate fresh report data
    const reportData = await generateReportData(report);
    
    // Update report
    await Report.update(report.id, { 
      data: reportData,
      lastGenerated: new Date()
    });
    
    // Get updated report
    const updatedReport = await Report.findById(req.params.id);
    return res.status(200).json({
      success: true,
      data: updatedReport
    });
  }

  res.status(200).json({
    success: true,
    data: report
  });
});

/**
 * @desc    Delete report
 * @route   DELETE /api/reports/:id
 * @access  Private
 */
exports.deleteReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    return next(new ErrorResponse(`Report not found with id of ${req.params.id}`, 404));
  }

  // Check if user owns this report
  if (report.userId !== req.user.id) {
    return next(new ErrorResponse('Not authorized to delete this report', 403));
  }

  await Report.delete(report.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Schedule report
 * @route   POST /api/reports/:id/schedule
 * @access  Private
 */
exports.scheduleReport = asyncHandler(async (req, res, next) => {
  const { frequency, dayOfWeek, dayOfMonth, time } = req.body;

  if (!frequency) {
    return next(new ErrorResponse('Please provide a frequency', 400));
  }

  const report = await Report.findById(req.params.id);

  if (!report) {
    return next(new ErrorResponse(`Report not found with id of ${req.params.id}`, 404));
  }

  // Check if user owns this report
  if (report.userId !== req.user.id) {
    return next(new ErrorResponse('Not authorized to schedule this report', 403));
  }

  // Calculate next run date
  const nextRun = calculateNextRun(frequency, dayOfWeek, dayOfMonth, time);

  // Update schedule
  const schedule = {
    frequency,
    dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
    dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
    time: time || '00:00',
    nextRun
  };

  await Report.update(report.id, { schedule });

  // Get updated report
  const updatedReport = await Report.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: updatedReport.schedule
  });
});

/**
 * @desc    Cancel scheduled report
 * @route   DELETE /api/reports/:id/schedule
 * @access  Private
 */
exports.cancelSchedule = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    return next(new ErrorResponse(`Report not found with id of ${req.params.id}`, 404));
  }

  // Check if user owns this report
  if (report.userId !== req.user.id) {
    return next(new ErrorResponse('Not authorized to modify this report', 403));
  }

  // Remove schedule
  await Report.update(report.id, { schedule: null });

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Export report data
 * @route   GET /api/reports/:id/export
 * @access  Private
 */
exports.exportReport = asyncHandler(async (req, res, next) => {
  const { format } = req.query;
  
  if (!format || !['csv', 'json'].includes(format)) {
    return next(new ErrorResponse('Please provide a valid format (csv, json)', 400));
  }

  const report = await Report.findById(req.params.id);

  if (!report) {
    return next(new ErrorResponse(`Report not found with id of ${req.params.id}`, 404));
  }

  // Check if user owns this report
  if (report.userId !== req.user.id) {
    return next(new ErrorResponse('Not authorized to export this report', 403));
  }

  // Check if company has export permissions
  const Company = require('../models/Company');
  const company = await Company.findById(req.user.companyId);
  
  if (company && company.dataAccessPreferences && !company.dataAccessPreferences.allowPropertyExport) {
    return next(new ErrorResponse('Your company does not have export permissions', 403));
  }

  // Check if report has data
  if (!report.data || !report.data.length) {
    return next(new ErrorResponse('Report has no data to export', 400));
  }

  // Handle different export formats
  if (format === 'json') {
    // Send JSON directly
    return res.status(200).json({
      success: true,
      data: report.data
    });
  } else if (format === 'csv') {
    try {
      // Convert to CSV
      const parser = new Parser();
      const csv = parser.parse(report.data);
      
      // Set headers for file download
      res.header('Content-Type', 'text/csv');
      res.attachment(`${report.name.replace(/\s+/g, '_')}_${Date.now()}.csv`);
      
      return res.send(csv);
    } catch (err) {
      return next(new ErrorResponse('Error generating CSV', 500));
    }
  }
});

/**
 * @desc    Get export history
 * @route   GET /api/reports/exports
 * @access  Private
 */
exports.getExportHistory = asyncHandler(async (req, res, next) => {
  // In a real implementation, you would query your export logs
  // This is a placeholder
  const exports = [
    {
      id: '5f8d0c1b8f3ec31234567890',
      reportName: 'Property Owners in New York',
      format: 'csv',
      recordCount: 156,
      exportedAt: new Date(Date.now() - 86400000) // 1 day ago
    },
    {
      id: '5f8d0c1b8f3ec31234567891',
      reportName: 'High Net Worth Individuals',
      format: 'pdf',
      recordCount: 42,
      exportedAt: new Date(Date.now() - 172800000) // 2 days ago
    },
    {
      id: '5f8d0c1b8f3ec31234567892',
      reportName: 'Commercial Properties',
      format: 'json',
      recordCount: 87,
      exportedAt: new Date(Date.now() - 259200000) // 3 days ago
    }
  ];

  res.status(200).json({
    success: true,
    count: exports.length,
    data: exports
  });
});

/**
 * Helper function to generate report data based on type and parameters
 */
const generateReportData = async (report) => {
  const { type, parameters } = report;
  
  switch (type) {
    case 'property_list':
      return generatePropertyListReport(parameters);
    
    case 'owner_wealth':
      return generateOwnerWealthReport(parameters);
    
    case 'property_valuation':
      return generatePropertyValuationReport(parameters);
    
    case 'ownership_analysis':
      return generateOwnershipAnalysisReport(parameters);
    
    default:
      throw new Error(`Unsupported report type: ${type}`);
  }
};

/**
 * Generate property list report
 */
const generatePropertyListReport = async (parameters) => {
  const { filters, fields } = parameters;
  
  // Build query options from filters
  const options = {};
  
  if (filters) {
    if (filters.location) {
      if (filters.location.city) options.city = filters.location.city;
      if (filters.location.state) options.state = filters.location.state;
      if (filters.location.zip) options.zip = filters.location.zip;
    }
    
    if (filters.propertyType) {
      options.propertyType = filters.propertyType;
    }
    
    if (filters.valueRange) {
      if (filters.valueRange.min) options.minValue = filters.valueRange.min;
      if (filters.valueRange.max) options.maxValue = filters.valueRange.max;
    }
    
    if (filters.sizeRange) {
      if (filters.sizeRange.min) options.minSquareFeet = filters.sizeRange.min;
      if (filters.sizeRange.max) options.maxSquareFeet = filters.sizeRange.max;
    }
  }
  
  // Execute query
  const properties = await Property.getAll(options);
  
  // Format data for report
  return properties.map(property => {
    const formattedProperty = {
      id: property.id,
      address: `${property.address}, ${property.city}, ${property.state} ${property.zip}`,
      propertyType: property.propertyType
    };
    
    // Add selected fields
    if (fields && fields.includes('details')) {
      formattedProperty.details = {
        squareFeet: property.squareFeet,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        yearBuilt: property.yearBuilt
      };
    }
    
    if (fields && fields.includes('valuation')) {
      formattedProperty.valuation = {
        marketValue: property.value,
        assessedValue: property.value * 0.8 // Simplified example
      };
    }
    
    if (fields && fields.includes('lastSale')) {
      if (property.lastSaleDate && property.lastSaleAmount) {
        formattedProperty.lastSale = {
          date: property.lastSaleDate,
          price: property.lastSaleAmount
        };
      }
    }
    
    return formattedProperty;
  });
};

/**
 * Generate owner wealth report
 */
const generateOwnerWealthReport = async (parameters) => {
  const { filters, wealthThreshold } = parameters;
  
  // Get owners matching filters
  const ownerOptions = {};
  
  if (filters) {
    if (filters.type) {
      ownerOptions.type = filters.type;
    }
    
    if (filters.location) {
      if (filters.location.city) ownerOptions.city = filters.location.city;
      if (filters.location.state) ownerOptions.state = filters.location.state;
    }
  }
  
  const owners = await Owner.getAll(ownerOptions);
  const ownerIds = owners.map(owner => owner.id);
  
  // Get wealth profiles for these owners
  const wealthOptions = {
    ownerIds,
    minNetWorth: wealthThreshold
  };
  
  const wealthProfiles = await WealthProfile.getAll(wealthOptions);
  
  // Match wealth profiles with owners
  const ownerWealthData = [];
  
  for (const owner of owners) {
    const wealthProfile = wealthProfiles.find(wp => wp.ownerId === owner.id);
    
    if (!wealthProfile) continue;
    
    ownerWealthData.push({
      id: owner.id,
      name: owner.displayName,
      type: owner.type,
      address: Owner.formatAddress(Owner.getPrimaryAddress(owner)),
      netWorth: wealthProfile.estimatedNetWorth.value,
      formattedNetWorth: WealthProfile.getFormattedNetWorth(wealthProfile),
      wealthTier: WealthProfile.getWealthTier(wealthProfile),
      primaryWealthSource: WealthProfile.getPrimaryWealthSource(wealthProfile),
      confidenceScore: wealthProfile.metadata?.overallConfidenceScore || 0
    });
  }
  
  // Sort by net worth descending
  return ownerWealthData.sort((a, b) => b.netWorth - a.netWorth);
};

/**
 * Generate property valuation report
 */
const generatePropertyValuationReport = async (parameters) => {
  const { location, propertyTypes, yearRange } = parameters;
  
  // Build query options
  const options = {};
  
  if (location) {
    if (location.city) options.city = location.city;
    if (location.state) options.state = location.state;
    if (location.zip) options.zip = location.zip;
  }
  
  if (propertyTypes && propertyTypes.length > 0) {
    options.propertyType = propertyTypes[0]; // Simplified for now
  }
  
  if (yearRange) {
    if (yearRange.min) options.minYearBuilt = yearRange.min;
    if (yearRange.max) options.maxYearBuilt = yearRange.max;
  }
  
  // Get properties
  const properties = await Property.getAll(options);
  
  // Calculate metrics
  return properties.map(property => {
    const currentValue = property.value || 0;
    const lastSalePrice = property.lastSaleAmount || 0;
    const lastSaleDate = property.lastSaleDate;
    
    // Calculate price per square foot
    const pricePerSqFt = property.squareFeet > 0
      ? currentValue / property.squareFeet
      : 0;
    
    // Calculate appreciation if we have last sale data
    let appreciation = null;
    let annualAppreciation = null;
    
    if (lastSalePrice > 0 && lastSaleDate) {
      const yearsSinceSale = (new Date() - new Date(lastSaleDate)) / (365 * 24 * 60 * 60 * 1000);
      
      if (yearsSinceSale > 0) {
        appreciation = ((currentValue - lastSalePrice) / lastSalePrice) * 100;
        annualAppreciation = appreciation / yearsSinceSale;
      }
    }
    
    return {
      id: property.id,
      address: `${property.address}, ${property.city}, ${property.state} ${property.zip}`,
      propertyType: property.propertyType,
      squareFeet: property.squareFeet,
      currentValue,
      pricePerSqFt,
      lastSalePrice,
      lastSaleDate,
      appreciation,
      annualAppreciation
    };
  });
};

/**
 * Generate ownership analysis report
 */
const generateOwnershipAnalysisReport = async (parameters) => {
  const { location, ownerTypes, minProperties } = parameters;
  
  // Get properties in location
  const propertyOptions = {};
  
  if (location) {
    if (location.city) propertyOptions.city = location.city;
    if (location.state) propertyOptions.state = location.state;
    if (location.zip) propertyOptions.zip = location.zip;
  }
  
  const properties = await Property.getAll(propertyOptions);
  
  // Extract owner IDs and build ownership map
  const ownershipMap = {};
  
  for (const property of properties) {
    if (!property.ownerId) continue;
    
    const ownerId = property.ownerId;
    
    if (!ownershipMap[ownerId]) {
      ownershipMap[ownerId] = {
        properties: [],
        totalValue: 0
      };
    }
    
    ownershipMap[ownerId].properties.push({
      id: property.id,
      value: property.value || 0,
      ownershipPercentage: 100 // Simplified for now
    });
    
    // Add value
    ownershipMap[ownerId].totalValue += (property.value || 0);
  }
  
  // Filter owners by number of properties
  const filteredOwnerIds = Object.keys(ownershipMap).filter(
    ownerId => ownershipMap[ownerId].properties.length >= (minProperties || 1)
  );
  
  // Get owner details
  const ownerOptions = {
    ids: filteredOwnerIds
  };
  
  if (ownerTypes && ownerTypes.length > 0) {
    ownerOptions.type = ownerTypes[0]; // Simplified for now
  }
  
  const owners = await Owner.getAll(ownerOptions);
  
  // Build report data
  const ownershipData = owners.map(owner => {
    const ownerData = ownershipMap[owner.id];
    
    if (!ownerData) return null;
    
    return {
      id: owner.id,
      name: owner.displayName,
      type: owner.type,
      propertyCount: ownerData.properties.length,
      totalValue: ownerData.totalValue,
      properties: ownerData.properties
    };
  }).filter(item => item !== null);
  
  // Sort by property count descending
  return ownershipData.sort((a, b) => b.propertyCount - a.propertyCount);
};

/**
 * Calculate next run date for scheduled reports
 */
const calculateNextRun = (frequency, dayOfWeek, dayOfMonth, time) => {
  const now = new Date();
  const [hours, minutes] = (time || '00:00').split(':').map(Number);
  
  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);
  
  // If time today has passed, start from tomorrow
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  switch (frequency) {
    case 'daily':
      // Already set for next day
      break;
    
    case 'weekly':
      // Set to next occurrence of day of week (0 = Sunday, 6 = Saturday)
      const targetDay = parseInt(dayOfWeek) || 0;
      const currentDay = nextRun.getDay();
      const daysToAdd = (targetDay + 7 - currentDay) % 7;
      
      nextRun.setDate(nextRun.getDate() + daysToAdd);
      break;
    
    case 'monthly':
      // Set to specified day of month
      const targetDate = parseInt(dayOfMonth) || 1;
      
      // Move to next month if current day has passed
      if (nextRun.getDate() > targetDate) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      
      // Set the target date, handling month length issues
      nextRun.setDate(Math.min(targetDate, getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth())));
      break;
    
    default:
      // Default to tomorrow
      nextRun.setDate(nextRun.getDate() + 1);
  }
  
  return nextRun;
};

/**
 * Helper to get days in a month
 */
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};