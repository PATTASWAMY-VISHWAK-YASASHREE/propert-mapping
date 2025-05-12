/**
 * History Service
 * Handles browsing history tracking and retrieval
 */

import apiService from './api';

/**
 * History Service
 */
const historyService = {
  /**
   * Save page visit to browsing history
   * @param {string} url - URL of the page
   * @param {string} title - Title of the page
   * @returns {Promise<Object>} - API response
   */
  async savePage(url, title) {
    try {
      // Only save if user is authenticated
      if (!localStorage.getItem('token')) {
        return { success: false };
      }
      
      return await apiService.post('/auth/history', {
        url,
        title,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save browsing history:', error);
      // Don't throw error as this is not critical functionality
      return { success: false };
    }
  },
  
  /**
   * Get browsing history
   * @param {number} limit - Maximum number of records to retrieve
   * @param {number} offset - Number of records to skip
   * @returns {Promise<Object>} - API response with browsing history
   */
  async getHistory(limit = 50, offset = 0) {
    try {
      return await apiService.get('/auth/history', { limit, offset });
    } catch (error) {
      console.error('Failed to get browsing history:', error);
      throw error;
    }
  },
  
  /**
   * Clear browsing history
   * @returns {Promise<Object>} - API response
   */
  async clearHistory() {
    try {
      return await apiService.delete('/auth/history');
    } catch (error) {
      console.error('Failed to clear browsing history:', error);
      throw error;
    }
  }
};

export default historyService;