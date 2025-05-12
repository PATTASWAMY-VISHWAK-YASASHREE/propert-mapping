/**
 * API Service
 * Handles all API requests to the backend
 */

// Base API URL - automatically detects if we're in development or production
const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 
    'http://localhost:5000/api' : 
    `${window.location.origin}/api`);

// Default headers for JSON requests
const jsonHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

/**
 * Handle API responses and errors consistently
 * @param {Response} response - Fetch API response
 * @returns {Promise<any>} - Parsed response data
 */
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();
  
  if (!response.ok) {
    // Handle API errors
    const error = (data && data.error) || response.statusText;
    return Promise.reject(error);
  }
  
  return data;
};

/**
 * Get auth token from local storage
 * @returns {string|null} - Auth token or null if not found
 */
const getToken = () => localStorage.getItem('token');

/**
 * Set auth token in local storage
 * @param {string} token - Auth token
 */
const setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

/**
 * Get auth headers with token if available
 * @returns {Object} - Headers object
 */
const getAuthHeaders = () => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * API Service
 */
const apiService = {
  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {boolean} auth - Whether to include auth token
   * @returns {Promise<any>} - Response data
   */
  async get(endpoint, auth = true) {
    const headers = {
      ...jsonHeaders,
      ...(auth ? getAuthHeaders() : {})
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, { headers });
    return handleResponse(response);
  },
  
  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {boolean} auth - Whether to include auth token
   * @returns {Promise<any>} - Response data
   */
  async post(endpoint, data, auth = true) {
    const headers = {
      ...jsonHeaders,
      ...(auth ? getAuthHeaders() : {})
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    return handleResponse(response);
  },
  
  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {boolean} auth - Whether to include auth token
   * @returns {Promise<any>} - Response data
   */
  async put(endpoint, data, auth = true) {
    const headers = {
      ...jsonHeaders,
      ...(auth ? getAuthHeaders() : {})
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    
    return handleResponse(response);
  },
  
  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {boolean} auth - Whether to include auth token
   * @returns {Promise<any>} - Response data
   */
  async delete(endpoint, auth = true) {
    const headers = {
      ...jsonHeaders,
      ...(auth ? getAuthHeaders() : {})
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers
    });
    
    return handleResponse(response);
  },
  
  /**
   * Authentication API
   */
  auth: {
    /**
     * Login user
     * @param {Object} credentials - User credentials
     * @returns {Promise<Object>} - Auth response with token
     */
    async login(credentials) {
      const data = await apiService.post('/auth/login', credentials, false);
      if (data.success && data.token) {
        setToken(data.token);
      }
      return data;
    },
    
    /**
     * Register user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} - Auth response with token
     */
    async register(userData) {
      const data = await apiService.post('/auth/register', userData, false);
      if (data.success && data.token) {
        setToken(data.token);
      }
      return data;
    },
    
    /**
     * Logout user
     * @returns {Promise<Object>} - Logout response
     */
    async logout() {
      const data = await apiService.get('/auth/logout');
      setToken(null);
      return data;
    },
    
    /**
     * Get current user
     * @returns {Promise<Object>} - User data
     */
    async getCurrentUser() {
      return apiService.get('/auth/me');
    }
  },
  
  /**
   * Users API
   */
  users: {
    /**
     * Get all users
     * @returns {Promise<Object>} - Users list
     */
    async getAll() {
      return apiService.get('/users');
    },
    
    /**
     * Get user by ID
     * @param {string} id - User ID
     * @returns {Promise<Object>} - User data
     */
    async getById(id) {
      return apiService.get(`/users/${id}`);
    },
    
    /**
     * Update user
     * @param {string} id - User ID
     * @param {Object} userData - User data to update
     * @returns {Promise<Object>} - Updated user
     */
    async update(id, userData) {
      return apiService.put(`/users/${id}`, userData);
    },
    
    /**
     * Delete user
     * @param {string} id - User ID
     * @returns {Promise<Object>} - Delete response
     */
    async delete(id) {
      return apiService.delete(`/users/${id}`);
    },
    
    /**
     * Invite user
     * @param {Object} inviteData - Invitation data
     * @returns {Promise<Object>} - Invitation response
     */
    async invite(inviteData) {
      return apiService.post('/users/invite', inviteData);
    }
  },
  
  /**
   * Properties API
   */
  properties: {
    /**
     * Get all properties
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Object>} - Properties list
     */
    async getAll(filters = {}) {
      // Convert filters to query string
      const queryString = Object.entries(filters)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      
      const endpoint = queryString ? `/properties?${queryString}` : '/properties';
      return apiService.get(endpoint);
    },
    
    /**
     * Get property by ID
     * @param {string} id - Property ID
     * @returns {Promise<Object>} - Property data
     */
    async getById(id) {
      return apiService.get(`/properties/${id}`);
    },
    
    /**
     * Create property
     * @param {Object} propertyData - Property data
     * @returns {Promise<Object>} - Created property
     */
    async create(propertyData) {
      return apiService.post('/properties', propertyData);
    },
    
    /**
     * Update property
     * @param {string} id - Property ID
     * @param {Object} propertyData - Property data to update
     * @returns {Promise<Object>} - Updated property
     */
    async update(id, propertyData) {
      return apiService.put(`/properties/${id}`, propertyData);
    },
    
    /**
     * Delete property
     * @param {string} id - Property ID
     * @returns {Promise<Object>} - Delete response
     */
    async delete(id) {
      return apiService.delete(`/properties/${id}`);
    }
  },
  
  /**
   * Map API
   */
  map: {
    /**
     * Geocode address
     * @param {string} address - Address to geocode
     * @returns {Promise<Object>} - Geocoding results
     */
    async geocode(address) {
      return apiService.post('/map/geocode', { address });
    },
    
    /**
     * Reverse geocode coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {Promise<Object>} - Reverse geocoding results
     */
    async reverseGeocode(lat, lng) {
      return apiService.get(`/map/reverse-geocode?lat=${lat}&lng=${lng}`);
    },
    
    /**
     * Get address suggestions
     * @param {string} query - Partial address query
     * @returns {Promise<Object>} - Address suggestions
     */
    async getSuggestions(query) {
      return apiService.get(`/map/suggestions?query=${encodeURIComponent(query)}`);
    },
    
    /**
     * Save map view
     * @param {Object} mapView - Map view data
     * @returns {Promise<Object>} - Saved map view
     */
    async saveView(mapView) {
      return apiService.post('/map/views', mapView);
    },
    
    /**
     * Get saved map views
     * @returns {Promise<Object>} - List of saved map views
     */
    async getSavedViews() {
      return apiService.get('/map/views');
    },
    
    /**
     * Delete saved map view
     * @param {string} id - Map view ID
     * @returns {Promise<Object>} - Delete response
     */
    async deleteView(id) {
      return apiService.delete(`/map/views/${id}`);
    }
  },
  
  /**
   * Reports API
   */
  reports: {
    /**
     * Create report
     * @param {Object} reportData - Report data
     * @returns {Promise<Object>} - Created report
     */
    async create(reportData) {
      return apiService.post('/reports', reportData);
    },
    
    /**
     * Get all reports
     * @returns {Promise<Object>} - Reports list
     */
    async getAll() {
      return apiService.get('/reports');
    },
    
    /**
     * Get report by ID
     * @param {string} id - Report ID
     * @param {boolean} regenerate - Whether to regenerate the report
     * @returns {Promise<Object>} - Report data
     */
    async getById(id, regenerate = false) {
      const endpoint = regenerate ? `/reports/${id}?regenerate=true` : `/reports/${id}`;
      return apiService.get(endpoint);
    },
    
    /**
     * Delete report
     * @param {string} id - Report ID
     * @returns {Promise<Object>} - Delete response
     */
    async delete(id) {
      return apiService.delete(`/reports/${id}`);
    },
    
    /**
     * Schedule report
     * @param {string} id - Report ID
     * @param {Object} scheduleData - Schedule data
     * @returns {Promise<Object>} - Schedule response
     */
    async schedule(id, scheduleData) {
      return apiService.post(`/reports/${id}/schedule`, scheduleData);
    },
    
    /**
     * Cancel report schedule
     * @param {string} id - Report ID
     * @returns {Promise<Object>} - Cancel response
     */
    async cancelSchedule(id) {
      return apiService.delete(`/reports/${id}/schedule`);
    },
    
    /**
     * Export report
     * @param {string} id - Report ID
     * @param {string} format - Export format (csv, json)
     * @returns {Promise<Object>} - Export response
     */
    async export(id, format) {
      return apiService.get(`/reports/${id}/export?format=${format}`);
    }
  }
};

export default apiService;