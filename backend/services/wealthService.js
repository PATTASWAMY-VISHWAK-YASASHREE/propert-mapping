/**
 * Wealth Service
 * Handles wealth analysis business logic
 */

const WealthProfile = require('../models/WealthProfile');
const Owner = require('../models/Owner');
const Property = require('../models/Property');
const wealthEngineApi = require('../integrations/wealthEngineApi');

/**
 * Get owner wealth profile
 * @param {string} ownerId - Owner ID
 * @param {Object} company - Company object
 * @returns {Promise<Object>} Wealth profile with properties
 */
exports.getOwnerWealthProfile = async (ownerId, company) => {
  // Check if company has access to wealth data
  if (!company.dataAccessPreferences.allowWealthDataAccess) {
    throw new Error('Your company does not have access to wealth data');
  }

  // Get owner
  const owner = await Owner.findById(ownerId);
  
  if (!owner) {
    throw new Error(`Owner not found with id of ${ownerId}`);
  }

  // Get wealth profile
  let wealthProfile = await WealthProfile.findOne({ owner: ownerId });
  
  // If no wealth profile exists, try to fetch from Wealth Engine API
  if (!wealthProfile) {
    try {
      // Get owner data to pass to Wealth Engine
      const ownerData = {
        type: owner.type,
        name: owner.type === 'individual' ? owner.fullName : owner.entity.name,
        address: owner.getPrimaryAddress()
      };
      
      // Call Wealth Engine API
      const wealthData = await wealthEngineApi.getWealthProfile(ownerData);
      
      if (wealthData) {
        // Create new wealth profile
        wealthProfile = await WealthProfile.create({
          owner: ownerId,
          estimatedNetWorth: {
            value: wealthData.netWorth,
            confidenceScore: wealthData.confidenceScore
          },
          wealthComposition: wealthData.composition,
          dataSources: [{
            name: 'Wealth Engine',
            lastUpdated: new Date(),
            confidenceScore: wealthData.confidenceScore
          }],
          metadata: {
            lastUpdated: new Date(),
            overallConfidenceScore: wealthData.confidenceScore
          }
        });
      }
    } catch (err) {
      console.error('Error fetching wealth data:', err);
      // Continue with null wealth profile
    }
  }

  // If still no wealth profile, return error
  if (!wealthProfile) {
    throw new Error('Wealth profile not available for this owner');
  }

  // Get owner's properties
  const properties = await Property.find({
    'currentOwnership.ownerId': ownerId
  }).select('address propertyType valuation.marketValue');

  // Add properties to response
  const response = {
    ...wealthProfile.toObject(),
    properties
  };

  return response;
};

/**
 * Compare multiple owners' wealth profiles
 * @param {Array<string>} ownerIds - Owner IDs to compare
 * @param {Object} company - Company object
 * @returns {Promise<Array>} Comparison data
 */
exports.compareWealthProfiles = async (ownerIds, company) => {
  // Check if company has access to wealth data
  if (!company.dataAccessPreferences.allowWealthDataAccess) {
    throw new Error('Your company does not have access to wealth data');
  }
  
  if (!ownerIds || ownerIds.length < 2) {
    throw new Error('Please provide at least 2 owner IDs to compare');
  }
  
  if (ownerIds.length > 5) {
    throw new Error('Please provide no more than 5 owner IDs to compare');
  }

  // Get owners
  const owners = await Owner.find({ _id: { $in: ownerIds } });
  
  if (owners.length !== ownerIds.length) {
    throw new Error('One or more owners not found');
  }

  // Get wealth profiles
  const wealthProfiles = await WealthProfile.find({ owner: { $in: ownerIds } });
  
  // Map wealth profiles to owners
  const comparison = owners.map(owner => {
    const profile = wealthProfiles.find(wp => wp.owner.toString() === owner._id.toString());
    
    return {
      owner: {
        id: owner._id,
        name: owner.displayName,
        type: owner.type
      },
      wealthProfile: profile ? {
        estimatedNetWorth: profile.estimatedNetWorth,
        wealthTier: profile.getWealthTier(),
        primaryWealthSource: profile.getPrimaryWealthSource(),
        confidenceScore: profile.metadata.overallConfidenceScore,
        confidenceDescription: profile.getConfidenceDescription()
      } : null
    };
  });

  return comparison;
};

/**
 * Get wealth distribution statistics
 * @param {Object} params - Query parameters
 * @param {string} params.region - Region filter (state)
 * @param {string} params.propertyType - Property type filter
 * @param {Object} company - Company object
 * @returns {Promise<Object>} Wealth statistics
 */
exports.getWealthStatistics = async (params, company) => {
  // Check if company has access to wealth data
  if (!company.dataAccessPreferences.allowWealthDataAccess) {
    throw new Error('Your company does not have access to wealth data');
  }

  const { region, propertyType } = params;
  
  // Build match query for properties
  const propertyMatch = {};
  
  if (region) {
    propertyMatch['address.state'] = region;
  }
  
  if (propertyType) {
    propertyMatch.propertyType = propertyType;
  }
  
  // Get owners from matching properties
  let ownerIds = [];
  
  if (Object.keys(propertyMatch).length > 0) {
    const properties = await Property.find(propertyMatch)
      .select('currentOwnership.ownerId');
    
    ownerIds = properties
      .flatMap(p => p.currentOwnership?.map(o => o.ownerId) || [])
      .filter(id => id)
      .map(id => id.toString());
    
    // Remove duplicates
    ownerIds = [...new Set(ownerIds)];
  }
  
  // Build wealth profile query
  const wealthMatch = {};
  
  if (ownerIds.length > 0) {
    wealthMatch.owner = { $in: ownerIds };
  }
  
  // Get wealth distribution statistics
  const wealthDistribution = await WealthProfile.aggregate([
    { $match: wealthMatch },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avgNetWorth: { $avg: '$estimatedNetWorth.value' },
        medianNetWorth: { $median: '$estimatedNetWorth.value' },
        minNetWorth: { $min: '$estimatedNetWorth.value' },
        maxNetWorth: { $max: '$estimatedNetWorth.value' },
        totalNetWorth: { $sum: '$estimatedNetWorth.value' }
      }
    }
  ]);
  
  // Get wealth tier distribution
  const wealthTiers = await WealthProfile.aggregate([
    { $match: wealthMatch },
    {
      $bucket: {
        groupBy: '$estimatedNetWorth.value',
        boundaries: [0, 500000, 1000000, 5000000, 30000000, 100000000, 1000000000, Infinity],
        default: 'Unknown',
        output: {
          count: { $sum: 1 },
          owners: { $push: '$owner' }
        }
      }
    }
  ]);
  
  // Map wealth tiers to readable names
  const tierNames = [
    'Under $500K',
    '$500K - $1M',
    '$1M - $5M',
    '$5M - $30M',
    '$30M - $100M',
    '$100M - $1B',
    '$1B+'
  ];
  
  const tierDistribution = wealthTiers.map((tier, index) => ({
    tier: tierNames[index] || 'Unknown',
    count: tier.count,
    percentage: tier.count / (wealthDistribution[0]?.count || 1) * 100
  }));
  
  // Get wealth composition averages
  const wealthComposition = await WealthProfile.aggregate([
    { $match: wealthMatch },
    {
      $group: {
        _id: null,
        realEstateAvg: { $avg: '$wealthComposition.realEstate.percentage' },
        securitiesAvg: { $avg: '$wealthComposition.securities.percentage' },
        privateEquityAvg: { $avg: '$wealthComposition.privateEquity.percentage' },
        cashAvg: { $avg: '$wealthComposition.cash.percentage' },
        otherAvg: { $avg: '$wealthComposition.other.percentage' }
      }
    }
  ]);
  
  return {
    overview: wealthDistribution[0] || {
      count: 0,
      avgNetWorth: 0,
      medianNetWorth: 0,
      minNetWorth: 0,
      maxNetWorth: 0,
      totalNetWorth: 0
    },
    tierDistribution,
    composition: wealthComposition[0] || {
      realEstateAvg: 0,
      securitiesAvg: 0,
      privateEquityAvg: 0,
      cashAvg: 0,
      otherAvg: 0
    }
  };
};

/**
 * Get wealth insights for a specific property
 * @param {string} propertyId - Property ID
 * @param {Object} company - Company object
 * @returns {Promise<Object>} Property wealth insights
 */
exports.getPropertyWealthInsights = async (propertyId, company) => {
  // Check if company has access to wealth data
  if (!company.dataAccessPreferences.allowWealthDataAccess) {
    throw new Error('Your company does not have access to wealth data');
  }

  // Get property
  const property = await Property.findById(propertyId)
    .populate('currentOwnership.ownerId');
  
  if (!property) {
    throw new Error(`Property not found with id of ${propertyId}`);
  }

  // Get owner IDs
  const ownerIds = property.currentOwnership
    .map(o => o.ownerId._id)
    .filter(id => id);
  
  if (ownerIds.length === 0) {
    throw new Error('No owners found for this property');
  }

  // Get wealth profiles
  const wealthProfiles = await WealthProfile.find({ owner: { $in: ownerIds } });
  
  // Calculate total owner net worth
  const totalNetWorth = wealthProfiles.reduce(
    (sum, profile) => sum + profile.estimatedNetWorth.value,
    0
  );
  
  // Calculate property value to owner net worth ratio
  const propertyValue = property.getCurrentValue() || 0;
  const valueToWorthRatio = propertyValue > 0 && totalNetWorth > 0
    ? (propertyValue / totalNetWorth) * 100
    : 0;
  
  // Get similar properties in the area
  const similarProperties = await Property.find({
    _id: { $ne: property._id },
    'address.city': property.address.city,
    'address.state': property.address.state,
    propertyType: property.propertyType,
    'details.squareFeet': {
      $gte: property.details.squareFeet * 0.8,
      $lte: property.details.squareFeet * 1.2
    }
  }).limit(5);
  
  // Get wealth profiles for similar property owners
  const similarOwnerIds = similarProperties
    .flatMap(p => p.currentOwnership?.map(o => o.ownerId) || [])
    .filter(id => id);
  
  const similarWealthProfiles = await WealthProfile.find({ owner: { $in: similarOwnerIds } });
  
  // Calculate average net worth of similar property owners
  const similarOwnersNetWorth = similarWealthProfiles.length > 0
    ? similarWealthProfiles.reduce((sum, profile) => sum + profile.estimatedNetWorth.value, 0) / similarWealthProfiles.length
    : 0;
  
  return {
    property: {
      id: property._id,
      address: property.formattedAddress,
      value: propertyValue
    },
    owners: property.currentOwnership.map(ownership => {
      const owner = ownership.ownerId;
      const wealthProfile = wealthProfiles.find(
        wp => wp.owner.toString() === owner._id.toString()
      );
      
      return {
        id: owner._id,
        name: owner.displayName,
        ownershipPercentage: ownership.ownershipPercentage,
        netWorth: wealthProfile ? wealthProfile.estimatedNetWorth.value : null,
        wealthTier: wealthProfile ? wealthProfile.getWealthTier() : null,
        confidenceScore: wealthProfile ? wealthProfile.metadata.overallConfidenceScore : null
      };
    }),
    insights: {
      totalOwnerNetWorth: totalNetWorth,
      propertyValueToNetWorthRatio: valueToWorthRatio,
      similarPropertiesCount: similarProperties.length,
      similarOwnersAvgNetWorth: similarOwnersNetWorth,
      netWorthComparison: totalNetWorth > 0 && similarOwnersNetWorth > 0
        ? (totalNetWorth / similarOwnersNetWorth) * 100 - 100
        : 0
    }
  };
};