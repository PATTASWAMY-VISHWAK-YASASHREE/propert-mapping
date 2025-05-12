/**
 * US Census API Integration
 * Provides area-level wealth and demographic data
 */

const axios = require('axios');
const config = require('../config/config');

/**
 * US Census API client
 */
class UsCensusApi {
  constructor() {
    this.apiKey = config.apiKeys.usCensus;
    this.baseUrl = 'https://api.census.gov/data';
  }

  /**
   * Get American Community Survey (ACS) data
   * @param {number} year - Year of data
   * @param {string} dataset - Dataset identifier (e.g., 'acs/acs5')
   * @param {Array} variables - Census variables to retrieve
   * @param {Object} location - Geographic location parameters
   * @returns {Promise<Object>} - Census data
   */
  async getAcsData(year, dataset, variables, location) {
    try {
      const url = `${this.baseUrl}/${year}/${dataset}`;
      const params = {
        get: variables.join(','),
        for: this._formatLocationFor(location),
        in: this._formatLocationIn(location),
        key: this.apiKey
      };

      // Remove undefined parameters
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await axios.get(url, { params });
      return this._formatCensusData(response.data, variables);
    } catch (error) {
      console.error('US Census API Error:', error.message);
      throw new Error('Failed to retrieve census data');
    }
  }

  /**
   * Get income data for a geographic area
   * @param {Object} location - Geographic location parameters
   * @param {number} year - Year of data (default: 2019)
   * @returns {Promise<Object>} - Income data
   */
  async getIncomeData(location, year = 2019) {
    const variables = [
      'NAME',
      'B19013_001E', // Median household income
      'B19001_001E', // Total households
      'B19001_002E', // Income less than $10,000
      'B19001_003E', // $10,000 to $14,999
      'B19001_004E', // $15,000 to $19,999
      'B19001_005E', // $20,000 to $24,999
      'B19001_006E', // $25,000 to $29,999
      'B19001_007E', // $30,000 to $34,999
      'B19001_008E', // $35,000 to $39,999
      'B19001_009E', // $40,000 to $44,999
      'B19001_010E', // $45,000 to $49,999
      'B19001_011E', // $50,000 to $59,999
      'B19001_012E', // $60,000 to $74,999
      'B19001_013E', // $75,000 to $99,999
      'B19001_014E', // $100,000 to $124,999
      'B19001_015E', // $125,000 to $149,999
      'B19001_016E', // $150,000 to $199,999
      'B19001_017E'  // $200,000 or more
    ];

    const data = await this.getAcsData(year, 'acs/acs5', variables, location);
    
    // Process the data to calculate wealth metrics
    if (data.success && data.results.length > 0) {
      const result = data.results[0];
      
      // Calculate percentage of households in each income bracket
      const totalHouseholds = parseInt(result.B19001_001E) || 0;
      
      if (totalHouseholds > 0) {
        const incomeBrackets = [
          { range: 'Less than $10,000', count: parseInt(result.B19001_002E) || 0 },
          { range: '$10,000 to $14,999', count: parseInt(result.B19001_003E) || 0 },
          { range: '$15,000 to $19,999', count: parseInt(result.B19001_004E) || 0 },
          { range: '$20,000 to $24,999', count: parseInt(result.B19001_005E) || 0 },
          { range: '$25,000 to $29,999', count: parseInt(result.B19001_006E) || 0 },
          { range: '$30,000 to $34,999', count: parseInt(result.B19001_007E) || 0 },
          { range: '$35,000 to $39,999', count: parseInt(result.B19001_008E) || 0 },
          { range: '$40,000 to $44,999', count: parseInt(result.B19001_009E) || 0 },
          { range: '$45,000 to $49,999', count: parseInt(result.B19001_010E) || 0 },
          { range: '$50,000 to $59,999', count: parseInt(result.B19001_011E) || 0 },
          { range: '$60,000 to $74,999', count: parseInt(result.B19001_012E) || 0 },
          { range: '$75,000 to $99,999', count: parseInt(result.B19001_013E) || 0 },
          { range: '$100,000 to $124,999', count: parseInt(result.B19001_014E) || 0 },
          { range: '$125,000 to $149,999', count: parseInt(result.B19001_015E) || 0 },
          { range: '$150,000 to $199,999', count: parseInt(result.B19001_016E) || 0 },
          { range: '$200,000 or more', count: parseInt(result.B19001_017E) || 0 }
        ];
        
        // Calculate percentages
        incomeBrackets.forEach(bracket => {
          bracket.percentage = (bracket.count / totalHouseholds) * 100;
        });
        
        // Calculate high-income percentage (households earning $100k+)
        const highIncomeCount = 
          parseInt(result.B19001_014E || 0) + 
          parseInt(result.B19001_015E || 0) + 
          parseInt(result.B19001_016E || 0) + 
          parseInt(result.B19001_017E || 0);
        
        const highIncomePercentage = (highIncomeCount / totalHouseholds) * 100;
        
        // Add calculated metrics to the result
        result.incomeBrackets = incomeBrackets;
        result.medianHouseholdIncome = parseInt(result.B19013_001E) || 0;
        result.totalHouseholds = totalHouseholds;
        result.highIncomeHouseholds = highIncomeCount;
        result.highIncomePercentage = highIncomePercentage;
        
        // Remove raw data fields
        variables.forEach(variable => {
          if (variable !== 'NAME') {
            delete result[variable];
          }
        });
      }
    }
    
    return data;
  }

  /**
   * Get housing data for a geographic area
   * @param {Object} location - Geographic location parameters
   * @param {number} year - Year of data (default: 2019)
   * @returns {Promise<Object>} - Housing data
   */
  async getHousingData(location, year = 2019) {
    const variables = [
      'NAME',
      'B25077_001E', // Median home value
      'B25003_001E', // Total housing units
      'B25003_002E', // Owner-occupied units
      'B25003_003E', // Renter-occupied units
      'B25004_001E', // Total vacant units
      'B25018_001E', // Median number of rooms
      'B25035_001E', // Median year structure built
      'B25064_001E'  // Median gross rent
    ];

    const data = await this.getAcsData(year, 'acs/acs5', variables, location);
    
    // Process the data to calculate housing metrics
    if (data.success && data.results.length > 0) {
      const result = data.results[0];
      
      const totalHousingUnits = parseInt(result.B25003_001E) || 0;
      const ownerOccupied = parseInt(result.B25003_002E) || 0;
      const renterOccupied = parseInt(result.B25003_003E) || 0;
      const vacantUnits = parseInt(result.B25004_001E) || 0;
      
      if (totalHousingUnits > 0) {
        // Calculate percentages
        const ownershipPercentage = (ownerOccupied / totalHousingUnits) * 100;
        const rentalPercentage = (renterOccupied / totalHousingUnits) * 100;
        const vacancyRate = (vacantUnits / (totalHousingUnits + vacantUnits)) * 100;
        
        // Add calculated metrics to the result
        result.medianHomeValue = parseInt(result.B25077_001E) || 0;
        result.medianGrossRent = parseInt(result.B25064_001E) || 0;
        result.medianRooms = parseFloat(result.B25018_001E) || 0;
        result.medianYearBuilt = parseInt(result.B25035_001E) || 0;
        result.totalHousingUnits = totalHousingUnits;
        result.ownerOccupied = ownerOccupied;
        result.renterOccupied = renterOccupied;
        result.vacantUnits = vacantUnits;
        result.ownershipPercentage = ownershipPercentage;
        result.rentalPercentage = rentalPercentage;
        result.vacancyRate = vacancyRate;
        
        // Remove raw data fields
        variables.forEach(variable => {
          if (variable !== 'NAME') {
            delete result[variable];
          }
        });
      }
    }
    
    return data;
  }

  /**
   * Format location for 'for' parameter
   * @param {Object} location - Location object
   * @returns {string} - Formatted location string
   * @private
   */
  _formatLocationFor(location) {
    if (location.blockGroup) {
      return `block group:${location.blockGroup}`;
    } else if (location.tract) {
      return `tract:${location.tract}`;
    } else if (location.zip) {
      return `zip code tabulation area:${location.zip}`;
    } else if (location.county) {
      return `county:${location.county}`;
    } else if (location.place) {
      return `place:${location.place}`;
    } else if (location.state) {
      return `state:${location.state}`;
    }
    return undefined;
  }

  /**
   * Format location for 'in' parameter
   * @param {Object} location - Location object
   * @returns {string} - Formatted location string
   * @private
   */
  _formatLocationIn(location) {
    if (location.blockGroup && location.tract && location.county && location.state) {
      return `state:${location.state} county:${location.county} tract:${location.tract}`;
    } else if (location.tract && location.county && location.state) {
      return `state:${location.state} county:${location.county}`;
    } else if (location.county && location.state) {
      return `state:${location.state}`;
    }
    return undefined;
  }

  /**
   * Format census API response
   * @param {Array} data - Raw census data
   * @param {Array} variables - Requested variables
   * @returns {Object} - Formatted data
   * @private
   */
  _formatCensusData(data, variables) {
    if (!data || data.length < 2) {
      return {
        success: false,
        results: [],
        error: 'No data returned from Census API'
      };
    }

    try {
      const headers = data[0];
      const results = [];

      // Process each row of data (skip header row)
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const result = {};

        // Map each value to its corresponding header
        headers.forEach((header, index) => {
          result[header] = row[index];
        });

        results.push(result);
      }

      return {
        success: true,
        results,
        count: results.length
      };
    } catch (error) {
      console.error('Error formatting census data:', error);
      return {
        success: false,
        results: [],
        error: 'Failed to format census data'
      };
    }
  }
}

module.exports = new UsCensusApi();