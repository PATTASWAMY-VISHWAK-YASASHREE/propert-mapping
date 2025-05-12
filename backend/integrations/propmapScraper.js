/**
 * propmapScraper.js - Scrapes mapping data from Propmap.io
 */
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape mapping service data from Propmap public site.
 * You can customize the selectors as needed.
 */
async function fetchMappingData() {
  const url = 'https://propmap.io/en/';
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    // Replace selectors below with actual elements containing mapping data
    const mappingData = [];

    // Example: Extract all main features/sections
    $('div.kl-rich-text').each((i, el) => {
      const sectionText = $(el).text().trim();
      if (sectionText) mappingData.push(sectionText);
    });

    // Add more specific parsing as needed to capture detailed mapping data

    return mappingData;
  } catch (error) {
    console.error('Propmap scraper error:', error.message);
    throw new Error('Failed to fetch mapping data from Propmap');
  }
}

module.exports = {
  fetchMappingData,
};