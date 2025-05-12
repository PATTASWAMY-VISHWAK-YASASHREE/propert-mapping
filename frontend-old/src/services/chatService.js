/**
 * Chat Service
 * Handles API requests and WebSocket communication for the chat system
 */

import apiService from './api';
import io from 'socket.io-client';

// Chat API URL - Use the dedicated chat server
const CHAT_API_URL = process.env.REACT_APP_CHAT_API_URL || 'http://localhost:5001/api';
const CHAT_SERVER_URL = CHAT_API_URL.replace('/api', '');

// Socket.io instance
let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Event listeners
const listeners = {
  'message:new': [],
  'message:updated': [],
  'message:deleted': [],
  'dm:new': [],
  'user:presence': [],
  'user:typing': [],
  'user:stopped-typing': [],
  'channel:user_joined': [],
  'channel:user_left': [],
  'connection': [],
  'disconnect': [],
  'reconnect': [],
  'reconnect_attempt': [],
  'reconnect_error': [],
  'reconnect_failed': [],
  'error': []
};

/**
 * Initialize WebSocket connection
 * @returns {Promise<void>}
 */
const initializeSocket = async () => {
  if (socket) {
    return;
  }
  
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  console.log('Connecting to chat server at:', CHAT_SERVER_URL);
  
  // Create socket connection to the dedicated chat server
  socket = io(CHAT_SERVER_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling']
  });
  
  // Set up connection event listeners
  socket.on('connect', () => {
    console.log('Connected to chat server');
    reconnectAttempts = 0;
    notifyListeners('connection');
    
    // Start ping interval to keep connection alive
    startPingInterval();
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Disconnected from chat server:', reason);
    notifyListeners('disconnect', { reason });
    
    // Stop ping interval
    stopPingInterval();
  });
  
  socket.on('reconnect', (attemptNumber) => {
    console.log(`Reconnected to chat server after ${attemptNumber} attempts`);
    notifyListeners('reconnect', { attemptNumber });
    
    // Restart ping interval
    startPingInterval();
  });
  
  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`Attempting to reconnect to chat server: attempt ${attemptNumber}`);
    notifyListeners('reconnect_attempt', { attemptNumber });
  });
  
  socket.on('reconnect_error', (error) => {
    console.error('Error reconnecting to chat server:', error);
    notifyListeners('reconnect_error', { error });
  });
  
  socket.on('reconnect_failed', () => {
    console.error('Failed to reconnect to chat server after maximum attempts');
    notifyListeners('reconnect_failed');
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    notifyListeners('error', error);
  });
  
  // Set up chat event listeners
  socket.on('message:new', (message) => {
    notifyListeners('message:new', message);
  });
  
  socket.on('message:updated', (message) => {
    notifyListeners('message:updated', message);
  });
  
  socket.on('message:deleted', (data) => {
    notifyListeners('message:deleted', data);
  });
  
  socket.on('dm:new', (message) => {
    notifyListeners('dm:new', message);
  });
  
  socket.on('user:presence', (data) => {
    notifyListeners('user:presence', data);
  });
  
  socket.on('user:typing', (data) => {
    notifyListeners('user:typing', data);
  });
  
  socket.on('user:stopped-typing', (data) => {
    notifyListeners('user:stopped-typing', data);
  });
  
  socket.on('channel:user_joined', (data) => {
    notifyListeners('channel:user_joined', data);
  });
  
  socket.on('channel:user_left', (data) => {
    notifyListeners('channel:user_left', data);
  });
  
  socket.on('pong', () => {
    // Received pong from server
    console.log('Received pong from server');
  });
  
  // Set initial presence
  socket.emit('presence:update', { status: 'online' });
  
  // Return a promise that resolves when connected
  return new Promise((resolve, reject) => {
    if (socket.connected) {
      resolve();
    } else {
      socket.once('connect', () => resolve());
      socket.once('connect_error', (error) => reject(error));
      
      // Set a timeout in case connection takes too long
      setTimeout(() => {
        if (!socket.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    }
  });
};

// Ping interval to keep connection alive
let pingInterval = null;

/**
 * Start ping interval
 */
const startPingInterval = () => {
  stopPingInterval();
  pingInterval = setInterval(() => {
    if (socket && socket.connected) {
      socket.emit('ping');
    }
  }, 30000); // 30 seconds
};

/**
 * Stop ping interval
 */
const stopPingInterval = () => {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
};

/**
 * Disconnect WebSocket
 */
const disconnectSocket = () => {
  if (socket) {
    stopPingInterval();
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
};

/**
 * Check if socket is connected
 * @returns {boolean} - True if connected
 */
const isConnected = () => {
  return socket && socket.connected;
};

/**
 * Reconnect socket if disconnected
 * @returns {Promise<boolean>} - True if reconnected successfully
 */
const reconnectIfNeeded = async () => {
  if (!socket || !socket.connected) {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      try {
        await initializeSocket();
        return true;
      } catch (error) {
        console.error('Reconnection failed:', error);
        return false;
      }
    } else {
      console.error('Maximum reconnection attempts reached');
      return false;
    }
  }
  return true;
};

/**
 * Add event listener
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 * @returns {Function} - Function to remove the listener
 */
const addEventListener = (event, callback) => {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  
  listeners[event].push(callback);
  
  return () => {
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  };
};

/**
 * Notify all listeners of an event
 * @param {string} event - Event name
 * @param {*} data - Event data
 */
const notifyListeners = (event, data) => {
  if (listeners[event]) {
    listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`Error in ${event} listener:`, err);
      }
    });
  }
};

/**
 * Join a channel
 * @param {string} channelId - Channel ID
 */
const joinChannel = async (channelId) => {
  if (!await reconnectIfNeeded()) {
    throw new Error('Socket not connected');
  }
  
  socket.emit('channel:join', channelId);
};

/**
 * Leave a channel
 * @param {string} channelId - Channel ID
 */
const leaveChannel = (channelId) => {
  if (socket && socket.connected) {
    socket.emit('channel:leave', channelId);
  }
};

/**
 * Send a message to a channel
 * @param {string} channelId - Channel ID
 * @param {string} content - Message content
 * @param {string} parentId - Parent message ID (for replies)
 * @returns {Promise<Object>} - Sent message
 */
const sendMessage = async (channelId, content, parentId = null) => {
  if (!await reconnectIfNeeded()) {
    throw new Error('Socket not connected');
  }
  
  // Use the REST API for sending messages to ensure delivery
  return chatApiService.post(`/chat/channels/${channelId}/messages`, { 
    content, 
    parent_id: parentId 
  });
};

/**
 * Edit a message
 * @param {string} messageId - Message ID
 * @param {string} content - New content
 * @returns {Promise<Object>} - Updated message
 */
const editMessage = async (messageId, content) => {
  if (!await reconnectIfNeeded()) {
    throw new Error('Socket not connected');
  }
  
  // Use the REST API for editing messages
  return chatApiService.put(`/chat/messages/${messageId}`, { content });
};

/**
 * Delete a message
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} - Response
 */
const deleteMessage = async (messageId) => {
  if (!await reconnectIfNeeded()) {
    throw new Error('Socket not connected');
  }
  
  // Use the REST API for deleting messages
  return chatApiService.delete(`/chat/messages/${messageId}`);
};

/**
 * Update typing status
 * @param {string} channelId - Channel ID
 * @param {boolean} isTyping - Whether user is typing
 */
const updateTypingStatus = async (channelId, isTyping) => {
  if (!await reconnectIfNeeded()) {
    return; // Silently fail
  }
  
  if (isTyping) {
    socket.emit('typing:start', { channelId });
  } else {
    socket.emit('typing:stop', { channelId });
  }
};

/**
 * Update presence status
 * @param {string} status - Status ('online', 'away', 'busy', 'offline')
 */
const updatePresence = async (status) => {
  if (!await reconnectIfNeeded()) {
    return; // Silently fail
  }
  
  socket.emit('presence:update', { status });
};

/**
 * Create axios instance for chat API
 */
const chatApiService = {
  get: (url, params = {}) => {
    return apiService.get(`${CHAT_API_URL}${url}`, params);
  },
  post: (url, data = {}) => {
    return apiService.post(`${CHAT_API_URL}${url}`, data);
  },
  put: (url, data = {}) => {
    return apiService.put(`${CHAT_API_URL}${url}`, data);
  },
  delete: (url) => {
    return apiService.delete(`${CHAT_API_URL}${url}`);
  }
};

/**
 * Chat Service
 */
const chatService = {
  /**
   * Get user's chat server
   * @returns {Promise<Object>} - Server data
   */
  async getServer() {
    return chatApiService.get('/chat/servers');
  },
  
  /**
   * Get messages for a channel
   * @param {string} channelId - Channel ID
   * @param {Object} options - Options
   * @param {number} options.limit - Maximum number of messages
   * @param {string} options.before - Message ID to fetch messages before
   * @returns {Promise<Object>} - Messages
   */
  async getChannelMessages(channelId, options = {}) {
    const queryParams = [];
    
    if (options.limit) {
      queryParams.push(`limit=${options.limit}`);
    }
    
    if (options.before) {
      queryParams.push(`before=${options.before}`);
    }
    
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    
    return chatApiService.get(`/chat/channels/${channelId}/messages${queryString}`);
  },
  
  /**
   * Check if WebSocket is connected
   * @returns {boolean} - True if connected
   */
  isConnected,
  
  // WebSocket methods
  initializeSocket,
  disconnectSocket,
  reconnectIfNeeded,
  addEventListener,
  joinChannel,
  leaveChannel,
  sendMessage,
  editMessage,
  deleteMessage,
  updateTypingStatus,
  updatePresence
};

export default chatService;