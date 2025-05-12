/**
 * ReportAll API Integration
 * Provides report generation and PDF creation services
 */

const axios = require('axios');
const config = require('../config/api-keys');

// Base URL for ReportAll API
const BASE_URL = 'https://api.reportall.com/v1';

/**
 * Generate PDF report
 * @param {Object} reportData - Report data
 * @param {string} reportData.title - Report title
 * @param {Array} reportData.data - Report data
 * @param {string} reportData.type - Report type
 * @returns {Promise<Buffer>} PDF buffer
 */
exports.generatePDF = async (reportData) => {
  try {
    const { title, data, type } = reportData;
    
    const response = await axios.post(`${BASE_URL}/reports/generate/pdf`, {
      title,
      data,
      type,
      options: {
        paperSize: 'letter',
        orientation: 'portrait',
        margins: {
          top: '1in',
          bottom: '1in',
          left: '1in',
          right: '1in'
        },
        header: {
          enabled: true,
          text: title,
          includeDate: true
        },
        footer: {
          enabled: true,
          includePageNumbers: true
        }
      }
    }, {
      headers: {
        'Authorization': `Bearer ${config.REPORTALL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });
    
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw new Error('Failed to generate PDF report');
  }
};

/**
 * Generate Excel report
 * @param {Object} reportData - Report data
 * @param {string} reportData.title - Report title
 * @param {Array} reportData.data - Report data
 * @param {string} reportData.type - Report type
 * @returns {Promise<Buffer>} Excel buffer
 */
exports.generateExcel = async (reportData) => {
  try {
    const { title, data, type } = reportData;
    
    const response = await axios.post(`${BASE_URL}/reports/generate/excel`, {
      title,
      data,
      type,
      options: {
        sheetName: title,
        includeHeader: true,
        formatDates: true,
        formatCurrency: true
      }
    }, {
      headers: {
        'Authorization': `Bearer ${config.REPORTALL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });
    
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error generating Excel report:', error);
    throw new Error('Failed to generate Excel report');
  }
};

/**
 * Generate chart image
 * @param {Object} chartData - Chart data
 * @param {string} chartData.type - Chart type (bar, line, pie, etc.)
 * @param {Object} chartData.data - Chart data
 * @param {Object} chartData.options - Chart options
 * @returns {Promise<Buffer>} Chart image buffer
 */
exports.generateChart = async (chartData) => {
  try {
    const { type, data, options } = chartData;
    
    const response = await axios.post(`${BASE_URL}/charts/generate`, {
      type,
      data,
      options,
      format: 'png',
      width: 800,
      height: 500
    }, {
      headers: {
        'Authorization': `Bearer ${config.REPORTALL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });
    
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error generating chart:', error);
    throw new Error('Failed to generate chart');
  }
};

/**
 * Generate data visualization
 * @param {Object} vizData - Visualization data
 * @param {string} vizData.type - Visualization type
 * @param {Object} vizData.data - Visualization data
 * @param {Object} vizData.options - Visualization options
 * @returns {Promise<Object>} Visualization result
 */
exports.generateVisualization = async (vizData) => {
  try {
    const { type, data, options } = vizData;
    
    const response = await axios.post(`${BASE_URL}/visualizations/generate`, {
      type,
      data,
      options
    }, {
      headers: {
        'Authorization': `Bearer ${config.REPORTALL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error generating visualization:', error);
    throw new Error('Failed to generate visualization');
  }
};

/**
 * Get account usage statistics
 * @returns {Promise<Object>} Usage statistics
 */
exports.getUsageStats = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/account/usage`, {
      headers: {
        'Authorization': `Bearer ${config.REPORTALL_API_KEY}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching usage statistics:', error);
    throw new Error('Failed to fetch usage statistics');
  }
};