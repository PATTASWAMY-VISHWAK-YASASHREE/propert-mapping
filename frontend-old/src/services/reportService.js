/**
 * Report Service
 * Handles report-related API requests
 */

import api from './api';

/**
 * Create report
 * @param {Object} reportData - Report data
 * @returns {Promise<Object>} Created report
 */
export const createReport = async (reportData) => {
  try {
    const response = await api.post('/reports', reportData);
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to create report';
  }
};

/**
 * Get reports
 * @returns {Promise<Array>} Reports
 */
export const getReports = async () => {
  try {
    const response = await api.get('/reports');
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch reports';
  }
};

/**
 * Get report by ID
 * @param {string} id - Report ID
 * @param {boolean} regenerate - Whether to regenerate the report
 * @returns {Promise<Object>} Report data
 */
export const getReport = async (id, regenerate = false) => {
  try {
    const response = await api.get(`/reports/${id}`, {
      params: { regenerate }
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch report';
  }
};

/**
 * Delete report
 * @param {string} id - Report ID
 * @returns {Promise<Object>} Response data
 */
export const deleteReport = async (id) => {
  try {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to delete report';
  }
};

/**
 * Schedule report
 * @param {string} id - Report ID
 * @param {Object} scheduleData - Schedule data
 * @param {string} scheduleData.frequency - Schedule frequency (daily, weekly, monthly)
 * @param {number} scheduleData.dayOfWeek - Day of week for weekly schedule (0-6)
 * @param {number} scheduleData.dayOfMonth - Day of month for monthly schedule (1-31)
 * @param {string} scheduleData.time - Time of day (HH:MM)
 * @returns {Promise<Object>} Updated report schedule
 */
export const scheduleReport = async (id, scheduleData) => {
  try {
    const response = await api.post(`/reports/${id}/schedule`, scheduleData);
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to schedule report';
  }
};

/**
 * Cancel report schedule
 * @param {string} id - Report ID
 * @returns {Promise<Object>} Response data
 */
export const cancelSchedule = async (id) => {
  try {
    const response = await api.delete(`/reports/${id}/schedule`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to cancel report schedule';
  }
};

/**
 * Export report
 * @param {string} id - Report ID
 * @param {string} format - Export format (csv, json, pdf)
 * @returns {Promise<Object>} Export data
 */
export const exportReport = async (id, format) => {
  try {
    const response = await api.get(`/reports/${id}/export`, {
      params: { format },
      responseType: format === 'pdf' ? 'arraybuffer' : 'json'
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to export report';
  }
};

/**
 * Get export history
 * @returns {Promise<Array>} Export history
 */
export const getExportHistory = async () => {
  try {
    const response = await api.get('/reports/exports');
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch export history';
  }
};