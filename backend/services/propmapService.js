/**
 * propmapService.js - Business logic for Propmap maps
 */
const propmapScraper = require('../integrations/propmapScraper');

/**
 * Get mapping data, with optional caching or transformation.
 */
async function getMappingData() {
  // In production, consider adding cache logic here
  return await propmapScraper.fetchMappingData();
}

module.exports = {
  getMappingData,
};