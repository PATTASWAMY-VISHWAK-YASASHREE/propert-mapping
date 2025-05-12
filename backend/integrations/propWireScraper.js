/**
 * PropWire Scraper Service
 * 
 * This service scrapes property data from PropWire's search page
 * since they don't provide a public API.
 */

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape property data from PropWire search results
 * @param {Object} filters - Search filters to apply
 * @param {number} page - Page number to fetch (default: 1)
 * @returns {Promise<Array>} - Array of property objects
 */
async function searchProperties(filters = {}, page = 1) {
  try {
    // Convert filters object to URL query string
    const filterParam = encodeURIComponent(JSON.stringify(filters));
    const url = `https://propwire.com/search?filters=${filterParam}&page=${page}`;
    
    // Fetch the HTML content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://propwire.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      }
    });
    
    // Parse the HTML using cheerio
    const $ = cheerio.load(response.data);
    const properties = [];
    
    // Extract property data from the search results
    // Note: The actual selectors will need to be adjusted based on PropWire's HTML structure
    $('.property-card').each((index, element) => {
      const property = {
        id: $(element).attr('data-id') || `prop-${index}`,
        address: $(element).find('.property-address').text().trim(),
        price: $(element).find('.property-price').text().trim(),
        bedrooms: parseInt($(element).find('.property-beds').text().trim()) || null,
        bathrooms: parseFloat($(element).find('.property-baths').text().trim()) || null,
        sqft: parseInt($(element).find('.property-sqft').text().trim().replace(/[^0-9]/g, '')) || null,
        propertyType: $(element).find('.property-type').text().trim(),
        imageUrl: $(element).find('.property-image img').attr('src') || null,
        detailUrl: $(element).find('.property-link').attr('href') || null,
      };
      
      properties.push(property);
    });
    
    // Extract pagination information
    const totalResults = parseInt($('.total-results').text().trim().replace(/[^0-9]/g, '')) || 0;
    const totalPages = parseInt($('.total-pages').text().trim().replace(/[^0-9]/g, '')) || 1;
    
    return {
      properties,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults
      }
    };
  } catch (error) {
    console.error('Error scraping PropWire:', error.message);
    throw new Error(`Failed to scrape PropWire: ${error.message}`);
  }
}

/**
 * Get detailed information about a specific property
 * @param {string} propertyUrl - URL of the property detail page
 * @returns {Promise<Object>} - Detailed property object
 */
async function getPropertyDetails(propertyUrl) {
  try {
    const response = await axios.get(propertyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract detailed property information
    // Note: The actual selectors will need to be adjusted based on PropWire's HTML structure
    const propertyDetails = {
      id: $('.property-id').text().trim() || propertyUrl.split('/').pop(),
      address: $('.property-address').text().trim(),
      price: $('.property-price').text().trim(),
      description: $('.property-description').text().trim(),
      features: [],
      images: [],
      location: {
        latitude: parseFloat($('[data-lat]').attr('data-lat')) || null,
        longitude: parseFloat($('[data-lng]').attr('data-lng')) || null,
      }
    };
    
    // Extract features
    $('.property-features li').each((i, el) => {
      propertyDetails.features.push($(el).text().trim());
    });
    
    // Extract images
    $('.property-images img').each((i, el) => {
      propertyDetails.images.push($(el).attr('src'));
    });
    
    return propertyDetails;
  } catch (error) {
    console.error('Error fetching property details:', error.message);
    throw new Error(`Failed to fetch property details: ${error.message}`);
  }
}

module.exports = {
  searchProperties,
  getPropertyDetails
};