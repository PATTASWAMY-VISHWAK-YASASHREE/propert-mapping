/**
 * Fast People Search Scraper Integration
 * Based on https://github.com/mn3mnn/fastpeoplesearch.com-scraper
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');

/**
 * Fast People Search Scraper
 */
class FastPeopleSearchScraper {
  constructor() {
    this.baseUrl = 'https://www.fastpeoplesearch.com';
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  /**
   * Search for a person by name and location
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @param {string} state - State (optional)
   * @param {string} city - City (optional)
   * @returns {Promise<Object>} - Search results
   */
  async searchByName(firstName, lastName, state = '', city = '') {
    try {
      // Format the search URL
      let searchUrl = `${this.baseUrl}/name/${firstName}-${lastName}`;
      
      if (state && city) {
        searchUrl += `/${city}-${state}`;
      } else if (state) {
        searchUrl += `/${state}`;
      }

      // Make the request with a random session ID
      const sessionId = uuidv4();
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.fastpeoplesearch.com/',
          'Cookie': `session_id=${sessionId}`
        }
      });

      // Parse the HTML response
      return this._parseSearchResults(response.data);
    } catch (error) {
      console.error('Fast People Search Error:', error.message);
      return {
        success: false,
        error: 'Failed to search for person',
        results: []
      };
    }
  }

  /**
   * Search for a person by address
   * @param {string} street - Street address
   * @param {string} city - City
   * @param {string} state - State
   * @returns {Promise<Object>} - Search results
   */
  async searchByAddress(street, city, state) {
    try {
      // Format the search URL
      const formattedStreet = street.replace(/\s+/g, '-');
      const searchUrl = `${this.baseUrl}/address/${formattedStreet}-${city}-${state}`;

      // Make the request with a random session ID
      const sessionId = uuidv4();
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.fastpeoplesearch.com/',
          'Cookie': `session_id=${sessionId}`
        }
      });

      // Parse the HTML response
      return this._parseAddressResults(response.data);
    } catch (error) {
      console.error('Fast People Search Address Error:', error.message);
      return {
        success: false,
        error: 'Failed to search by address',
        results: []
      };
    }
  }

  /**
   * Search for a person by phone number
   * @param {string} phoneNumber - Phone number (format: 1234567890)
   * @returns {Promise<Object>} - Search results
   */
  async searchByPhone(phoneNumber) {
    try {
      // Format the phone number
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.length !== 10) {
        throw new Error('Phone number must be 10 digits');
      }

      // Format the search URL
      const searchUrl = `${this.baseUrl}/phone/${formattedPhone}`;

      // Make the request with a random session ID
      const sessionId = uuidv4();
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.fastpeoplesearch.com/',
          'Cookie': `session_id=${sessionId}`
        }
      });

      // Parse the HTML response
      return this._parsePhoneResults(response.data);
    } catch (error) {
      console.error('Fast People Search Phone Error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to search by phone',
        results: []
      };
    }
  }

  /**
   * Parse search results HTML
   * @param {string} html - HTML content
   * @returns {Object} - Parsed results
   * @private
   */
  _parseSearchResults(html) {
    try {
      const $ = cheerio.load(html);
      const results = [];

      // Find all person cards
      $('.card').each((index, element) => {
        const personCard = $(element);
        
        // Extract name
        const nameElement = personCard.find('.name');
        const name = nameElement.text().trim();
        const profileUrl = nameElement.attr('href');
        
        // Extract age
        const ageElement = personCard.find('.age');
        const age = ageElement.text().trim();
        
        // Extract locations
        const locations = [];
        personCard.find('.address').each((i, addr) => {
          locations.push($(addr).text().trim());
        });
        
        // Extract phone numbers
        const phoneNumbers = [];
        personCard.find('.phone').each((i, phone) => {
          phoneNumbers.push($(phone).text().trim());
        });
        
        // Extract relatives
        const relatives = [];
        personCard.find('.relative').each((i, rel) => {
          relatives.push($(rel).text().trim());
        });
        
        results.push({
          name,
          age,
          profileUrl,
          locations,
          phoneNumbers,
          relatives
        });
      });

      return {
        success: true,
        results,
        count: results.length
      };
    } catch (error) {
      console.error('Error parsing search results:', error);
      return {
        success: false,
        error: 'Failed to parse search results',
        results: []
      };
    }
  }

  /**
   * Parse address results HTML
   * @param {string} html - HTML content
   * @returns {Object} - Parsed results
   * @private
   */
  _parseAddressResults(html) {
    try {
      const $ = cheerio.load(html);
      const results = [];
      
      // Extract address information
      const addressInfo = $('.address-info');
      const address = addressInfo.find('h2').text().trim();
      
      // Find all resident cards
      $('.resident-card').each((index, element) => {
        const residentCard = $(element);
        
        // Extract name
        const nameElement = residentCard.find('.name');
        const name = nameElement.text().trim();
        const profileUrl = nameElement.attr('href');
        
        // Extract age
        const ageElement = residentCard.find('.age');
        const age = ageElement.text().trim();
        
        // Extract phone numbers
        const phoneNumbers = [];
        residentCard.find('.phone').each((i, phone) => {
          phoneNumbers.push($(phone).text().trim());
        });
        
        results.push({
          name,
          age,
          profileUrl,
          address,
          phoneNumbers
        });
      });

      return {
        success: true,
        address,
        residents: results,
        count: results.length
      };
    } catch (error) {
      console.error('Error parsing address results:', error);
      return {
        success: false,
        error: 'Failed to parse address results',
        results: []
      };
    }
  }

  /**
   * Parse phone results HTML
   * @param {string} html - HTML content
   * @returns {Object} - Parsed results
   * @private
   */
  _parsePhoneResults(html) {
    try {
      const $ = cheerio.load(html);
      const results = [];
      
      // Extract phone information
      const phoneInfo = $('.phone-info');
      const phoneNumber = phoneInfo.find('h2').text().trim();
      
      // Find all owner cards
      $('.owner-card').each((index, element) => {
        const ownerCard = $(element);
        
        // Extract name
        const nameElement = ownerCard.find('.name');
        const name = nameElement.text().trim();
        const profileUrl = nameElement.attr('href');
        
        // Extract age
        const ageElement = ownerCard.find('.age');
        const age = ageElement.text().trim();
        
        // Extract addresses
        const addresses = [];
        ownerCard.find('.address').each((i, addr) => {
          addresses.push($(addr).text().trim());
        });
        
        results.push({
          name,
          age,
          profileUrl,
          phoneNumber,
          addresses
        });
      });

      return {
        success: true,
        phoneNumber,
        owners: results,
        count: results.length
      };
    } catch (error) {
      console.error('Error parsing phone results:', error);
      return {
        success: false,
        error: 'Failed to parse phone results',
        results: []
      };
    }
  }
}

module.exports = new FastPeopleSearchScraper();