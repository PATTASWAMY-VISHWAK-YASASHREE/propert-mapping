/**
 * Report Service
 * Handles report generation and scheduling
 */

const Report = require('../models/Report');
const Property = require('../models/Property');
const Owner = require('../models/Owner');
const WealthProfile = require('../models/WealthProfile');
const emailService = require('./emailService');
const { Parser } = require('json2csv');
const reportAllApi = require('../integrations/reportAllApi');

/**
 * Create a new report
 * @param {Object} reportData - Report data
 * @param {Object} user - User object
 * @returns {Promise<Object>} Created report
 */
exports.createReport = async (reportData, user) => {
  const { name, type, parameters } = reportData;

  // Create report
  const report = await Report.create({
    user: user._id,
    company: user.company,
    name,
    type,
    parameters,
    lastGenerated: new Date()
  });

  // Generate report data
  const reportData = await this.generateReportData(report);

  // Save report data
  report.data = reportData;
  await report.save();

  return report;
};

/**
 * Get all reports for a user
 * @param {Object} user - User object
 * @returns {Promise<Array>} User's reports
 */
exports.getReports = async (user) => {
  const reports = await Report.find({ user: user._id })
    .select('name type createdAt lastGenerated schedule')
    .sort('-createdAt');

  return reports;
};

/**
 * Get a single report
 * @param {string} id - Report ID
 * @param {Object} user - User object
 * @param {boolean} regenerate - Whether to regenerate the report
 * @returns {Promise<Object>} Report
 */
exports.getReport = async (id, user, regenerate = false) => {
  const report = await Report.findById(id);

  if (!report) {
    throw new Error(`Report not found with id of ${id}`);
  }

  // Check if user owns this report
  if (report.user.toString() !== user._id.toString()) {
    throw new Error('Not authorized to access this report');
  }

  // Check if report needs to be regenerated
  if (regenerate) {
    // Generate fresh report data
    const reportData = await this.generateReportData(report);
    
    // Update report
    report.data = reportData;
    report.lastGenerated = new Date();
    await report.save();
  }

  return report;
};

/**
 * Delete a report
 * @param {string} id - Report ID
 * @param {Object} user - User object
 * @returns {Promise<boolean>} Success status
 */
exports.deleteReport = async (id, user) => {
  const report = await Report.findById(id);

  if (!report) {
    throw new Error(`Report not found with id of ${id}`);
  }

  // Check if user owns this report
  if (report.user.toString() !== user._id.toString()) {
    throw new Error('Not authorized to delete this report');
  }

  await report.remove();
  return true;
};

/**
 * Schedule a report
 * @param {string} id - Report ID
 * @param {Object} scheduleData - Schedule data
 * @param {Object} user - User object
 * @returns {Promise<Object>} Updated report schedule
 */
exports.scheduleReport = async (id, scheduleData, user) => {
  const { frequency, dayOfWeek, dayOfMonth, time } = scheduleData;

  if (!frequency) {
    throw new Error('Please provide a frequency');
  }

  const report = await Report.findById(id);

  if (!report) {
    throw new Error(`Report not found with id of ${id}`);
  }

  // Check if user owns this report
  if (report.user.toString() !== user._id.toString()) {
    throw new Error('Not authorized to schedule this report');
  }

  // Update schedule
  report.schedule = {
    frequency,
    dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
    dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
    time: time || '00:00',
    nextRun: this.calculateNextRun(frequency, dayOfWeek, dayOfMonth, time)
  };

  await report.save();

  return report.schedule;
};

/**
 * Cancel a scheduled report
 * @param {string} id - Report ID
 * @param {Object} user - User object
 * @returns {Promise<boolean>} Success status
 */
exports.cancelSchedule = async (id, user) => {
  const report = await Report.findById(id);

  if (!report) {
    throw new Error(`Report not found with id of ${id}`);
  }

  // Check if user owns this report
  if (report.user.toString() !== user._id.toString()) {
    throw new Error('Not authorized to modify this report');
  }

  // Remove schedule
  report.schedule = undefined;
  await report.save();

  return true;
};

/**
 * Export report data
 * @param {string} id - Report ID
 * @param {string} format - Export format (csv, json, pdf)
 * @param {Object} user - User object
 * @param {Object} company - Company object
 * @returns {Promise<Object>} Export data
 */
exports.exportReport = async (id, format, user, company) => {
  if (!format || !['csv', 'json', 'pdf'].includes(format)) {
    throw new Error('Please provide a valid format (csv, json, pdf)');
  }

  const report = await Report.findById(id);

  if (!report) {
    throw new Error(`Report not found with id of ${id}`);
  }

  // Check if user owns this report
  if (report.user.toString() !== user._id.toString()) {
    throw new Error('Not authorized to export this report');
  }

  // Check if company has export permissions
  if (!company.dataAccessPreferences.allowPropertyExport) {
    throw new Error('Your company does not have export permissions');
  }

  // Check if report has data
  if (!report.data || !report.data.length) {
    throw new Error('Report has no data to export');
  }

  // Handle different export formats
  if (format === 'json') {
    // Return JSON directly
    return {
      format: 'json',
      data: report.data
    };
  } else if (format === 'csv') {
    try {
      // Convert to CSV
      const parser = new Parser();
      const csv = parser.parse(report.data);
      
      return {
        format: 'csv',
        data: csv,
        filename: `${report.name.replace(/\s+/g, '_')}_${Date.now()}.csv`
      };
    } catch (err) {
      throw new Error('Error generating CSV');
    }
  } else if (format === 'pdf') {
    try {
      // Use ReportAll API to generate PDF
      const pdfBuffer = await reportAllApi.generatePDF({
        title: report.name,
        data: report.data,
        type: report.type
      });
      
      return {
        format: 'pdf',
        data: pdfBuffer,
        filename: `${report.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`
      };
    } catch (err) {
      throw new Error('Error generating PDF');
    }
  }
};

/**
 * Process scheduled reports
 * @returns {Promise<number>} Number of reports processed
 */
exports.processScheduledReports = async () => {
  const now = new Date();
  
  // Find reports that are scheduled to run now
  const reports = await Report.find({
    'schedule.nextRun': { $lte: now }
  }).populate('user');
  
  let processedCount = 0;
  
  for (const report of reports) {
    try {
      // Generate report data
      const reportData = await this.generateReportData(report);
      
      // Update report
      report.data = reportData;
      report.lastGenerated = now;
      
      // Calculate next run time
      report.schedule.nextRun = this.calculateNextRun(
        report.schedule.frequency,
        report.schedule.dayOfWeek,
        report.schedule.dayOfMonth,
        report.schedule.time
      );
      
      await report.save();
      
      // Send email notification
      if (report.user && report.user.email) {
        const downloadUrl = `${process.env.FRONTEND_URL}/reports/${report._id}`;
        await emailService.sendScheduledReportEmail(report.user, report, downloadUrl);
      }
      
      processedCount++;
    } catch (err) {
      console.error(`Error processing scheduled report ${report._id}:`, err);
    }
  }
  
  return processedCount;
};

/**
 * Generate report data based on type and parameters
 * @param {Object} report - Report object
 * @returns {Promise<Array>} Report data
 */
exports.generateReportData = async (report) => {
  const { type, parameters } = report;
  
  switch (type) {
    case 'property_list':
      return this.generatePropertyListReport(parameters);
    
    case 'owner_wealth':
      return this.generateOwnerWealthReport(parameters);
    
    case 'property_valuation':
      return this.generatePropertyValuationReport(parameters);
    
    case 'ownership_analysis':
      return this.generateOwnershipAnalysisReport(parameters);
    
    default:
      throw new Error(`Unsupported report type: ${type}`);
  }
};

/**
 * Generate property list report
 * @param {Object} parameters - Report parameters
 * @returns {Promise<Array>} Report data
 */
exports.generatePropertyListReport = async (parameters) => {
  const { filters, fields } = parameters;
  
  // Build query from filters
  const query = {};
  
  if (filters.location) {
    if (filters.location.city) query['address.city'] = filters.location.city;
    if (filters.location.state) query['address.state'] = filters.location.state;
    if (filters.location.zipCode) query['address.zipCode'] = filters.location.zipCode;
  }
  
  if (filters.propertyType) {
    query.propertyType = filters.propertyType;
  }
  
  if (filters.valueRange) {
    query['valuation.marketValue'] = {};
    if (filters.valueRange.min) query['valuation.marketValue'].$gte = filters.valueRange.min;
    if (filters.valueRange.max) query['valuation.marketValue'].$lte = filters.valueRange.max;
  }
  
  if (filters.sizeRange) {
    query['details.squareFeet'] = {};
    if (filters.sizeRange.min) query['details.squareFeet'].$gte = filters.sizeRange.min;
    if (filters.sizeRange.max) query['details.squareFeet'].$lte = filters.sizeRange.max;
  }
  
  // Determine fields to return
  const selectFields = {};
  
  if (fields && fields.length > 0) {
    fields.forEach(field => {
      selectFields[field] = 1;
    });
  }
  
  // Execute query
  const properties = await Property.find(query)
    .select(selectFields)
    .limit(1000);
  
  // Format data for report
  return properties.map(property => {
    const formattedProperty = {
      id: property._id,
      address: property.formattedAddress,
      propertyType: property.propertyType
    };
    
    // Add selected fields
    if (fields && fields.includes('details')) {
      formattedProperty.details = {
        squareFeet: property.details.squareFeet,
        bedrooms: property.details.bedrooms,
        bathrooms: property.details.bathrooms,
        yearBuilt: property.details.yearBuilt
      };
    }
    
    if (fields && fields.includes('valuation')) {
      formattedProperty.valuation = {
        marketValue: property.valuation.marketValue,
        assessedValue: property.valuation.assessedValue
      };
    }
    
    if (fields && fields.includes('lastSale')) {
      const lastSale = property.getLastSale();
      if (lastSale) {
        formattedProperty.lastSale = {
          date: lastSale.date,
          price: lastSale.price
        };
      }
    }
    
    return formattedProperty;
  });
};

/**
 * Generate owner wealth report
 * @param {Object} parameters - Report parameters
 * @returns {Promise<Array>} Report data
 */
exports.generateOwnerWealthReport = async (parameters) => {
  const { filters, wealthThreshold } = parameters;
  
  // Get owners matching filters
  const ownerQuery = {};
  
  if (filters.type) {
    ownerQuery.type = filters.type;
  }
  
  if (filters.location) {
    if (filters.location.city) ownerQuery['contactInformation.address.city'] = filters.location.city;
    if (filters.location.state) ownerQuery['contactInformation.address.state'] = filters.location.state;
  }
  
  const owners = await Owner.find(ownerQuery);
  const ownerIds = owners.map(owner => owner._id);
  
  // Get wealth profiles for these owners
  const wealthQuery = { owner: { $in: ownerIds } };
  
  if (wealthThreshold) {
    wealthQuery['estimatedNetWorth.value'] = { $gte: wealthThreshold };
  }
  
  const wealthProfiles = await WealthProfile.find(wealthQuery);
  
  // Match wealth profiles with owners
  const ownerWealthData = owners.map(owner => {
    const wealthProfile = wealthProfiles.find(
      wp => wp.owner.toString() === owner._id.toString()
    );
    
    if (!wealthProfile) return null;
    
    return {
      id: owner._id,
      name: owner.displayName,
      type: owner.type,
      address: owner.formatAddress(owner.getPrimaryAddress()),
      netWorth: wealthProfile.estimatedNetWorth.value,
      formattedNetWorth: wealthProfile.getFormattedNetWorth(),
      wealthTier: wealthProfile.getWealthTier(),
      primaryWealthSource: wealthProfile.getPrimaryWealthSource(),
      confidenceScore: wealthProfile.metadata.overallConfidenceScore
    };
  }).filter(item => item !== null);
  
  // Sort by net worth descending
  return ownerWealthData.sort((a, b) => b.netWorth - a.netWorth);
};

/**
 * Generate property valuation report
 * @param {Object} parameters - Report parameters
 * @returns {Promise<Array>} Report data
 */
exports.generatePropertyValuationReport = async (parameters) => {
  const { location, propertyTypes, yearRange } = parameters;
  
  // Build query
  const query = {};
  
  if (location) {
    if (location.city) query['address.city'] = location.city;
    if (location.state) query['address.state'] = location.state;
    if (location.zipCode) query['address.zipCode'] = location.zipCode;
  }
  
  if (propertyTypes && propertyTypes.length > 0) {
    query.propertyType = { $in: propertyTypes };
  }
  
  if (yearRange) {
    query['details.yearBuilt'] = {};
    if (yearRange.min) query['details.yearBuilt'].$gte = yearRange.min;
    if (yearRange.max) query['details.yearBuilt'].$lte = yearRange.max;
  }
  
  // Get properties
  const properties = await Property.find(query)
    .select('address propertyType details.squareFeet valuation saleHistory')
    .limit(1000);
  
  // Calculate metrics
  const valuationData = properties.map(property => {
    const currentValue = property.getCurrentValue() || 0;
    const lastSale = property.getLastSale();
    const lastSalePrice = lastSale ? lastSale.price : 0;
    const lastSaleDate = lastSale ? lastSale.date : null;
    
    // Calculate price per square foot
    const pricePerSqFt = property.details.squareFeet > 0
      ? currentValue / property.details.squareFeet
      : 0;
    
    // Calculate appreciation if we have last sale data
    let appreciation = null;
    let annualAppreciation = null;
    
    if (lastSalePrice > 0 && lastSaleDate) {
      const yearsSinceSale = (new Date() - lastSaleDate) / (365 * 24 * 60 * 60 * 1000);
      
      if (yearsSinceSale > 0) {
        appreciation = ((currentValue - lastSalePrice) / lastSalePrice) * 100;
        annualAppreciation = appreciation / yearsSinceSale;
      }
    }
    
    return {
      id: property._id,
      address: property.formattedAddress,
      propertyType: property.propertyType,
      squareFeet: property.details.squareFeet,
      currentValue,
      pricePerSqFt,
      lastSalePrice,
      lastSaleDate,
      appreciation,
      annualAppreciation
    };
  });
  
  return valuationData;
};

/**
 * Generate ownership analysis report
 * @param {Object} parameters - Report parameters
 * @returns {Promise<Array>} Report data
 */
exports.generateOwnershipAnalysisReport = async (parameters) => {
  const { location, ownerTypes, minProperties } = parameters;
  
  // Get properties in location
  const propertyQuery = {};
  
  if (location) {
    if (location.city) propertyQuery['address.city'] = location.city;
    if (location.state) propertyQuery['address.state'] = location.state;
    if (location.zipCode) propertyQuery['address.zipCode'] = location.zipCode;
  }
  
  const properties = await Property.find(propertyQuery)
    .select('currentOwnership valuation.marketValue');
  
  // Extract owner IDs
  const ownershipMap = {};
  
  properties.forEach(property => {
    if (!property.currentOwnership) return;
    
    property.currentOwnership.forEach(ownership => {
      const ownerId = ownership.ownerId.toString();
      
      if (!ownershipMap[ownerId]) {
        ownershipMap[ownerId] = {
          properties: [],
          totalValue: 0
        };
      }
      
      ownershipMap[ownerId].properties.push({
        id: property._id,
        value: property.valuation.marketValue || 0,
        ownershipPercentage: ownership.ownershipPercentage || 100
      });
      
      // Add weighted value based on ownership percentage
      const weightedValue = (property.valuation.marketValue || 0) * 
        (ownership.ownershipPercentage || 100) / 100;
      
      ownershipMap[ownerId].totalValue += weightedValue;
    });
  });
  
  // Filter owners by number of properties
  const filteredOwnerIds = Object.keys(ownershipMap).filter(
    ownerId => ownershipMap[ownerId].properties.length >= (minProperties || 1)
  );
  
  // Get owner details
  const owners = await Owner.find({ _id: { $in: filteredOwnerIds } });
  
  // Filter by owner type if specified
  const filteredOwners = ownerTypes && ownerTypes.length > 0
    ? owners.filter(owner => ownerTypes.includes(owner.type))
    : owners;
  
  // Build report data
  const ownershipData = filteredOwners.map(owner => {
    const ownerData = ownershipMap[owner._id.toString()];
    
    return {
      id: owner._id,
      name: owner.displayName,
      type: owner.type,
      propertyCount: ownerData.properties.length,
      totalValue: ownerData.totalValue,
      properties: ownerData.properties.map(p => ({
        id: p.id,
        value: p.value,
        ownershipPercentage: p.ownershipPercentage
      }))
    };
  });
  
  // Sort by property count descending
  return ownershipData.sort((a, b) => b.propertyCount - a.propertyCount);
};

/**
 * Calculate next run date for scheduled reports
 * @param {string} frequency - Schedule frequency (daily, weekly, monthly)
 * @param {number} dayOfWeek - Day of week for weekly schedule (0-6)
 * @param {number} dayOfMonth - Day of month for monthly schedule (1-31)
 * @param {string} time - Time of day (HH:MM)
 * @returns {Date} Next run date
 */
exports.calculateNextRun = (frequency, dayOfWeek, dayOfMonth, time) => {
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
      nextRun.setDate(Math.min(targetDate, this.getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth())));
      break;
    
    default:
      // Default to tomorrow
      nextRun.setDate(nextRun.getDate() + 1);
  }
  
  return nextRun;
};

/**
 * Helper to get days in a month
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {number} Days in month
 */
exports.getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};