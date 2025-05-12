/**
 * Chat Actions
 */

import chatService from '../../services/chatService';

// Action Types
export const CHAT_LOADING = 'CHAT_LOADING';
export const CHAT_ERROR = 'CHAT_ERROR';
export const SET_CHAT_SERVER = 'SET_CHAT_SERVER';
export const SET_CURRENT_CHANNEL = 'SET_CURRENT_CHANNEL';
export const SET_CHANNEL_MESSAGES = 'SET_CHANNEL_MESSAGES';
export const ADD_MESSAGE = 'ADD_MESSAGE';
export const UPDATE_MESSAGE = 'UPDATE_MESSAGE';
export const DELETE_MESSAGE = 'DELETE_MESSAGE';
export const SET_USER_PRESENCE = 'SET_USER_PRESENCE';
export const SET_USER_TYPING = 'SET_USER_TYPING';

/**
 * Initialize chat
 * @returns {Function} - Thunk function
 */
export const initializeChat = () => async (dispatch) => {
  try {
    // Initialize WebSocket connection
    await chatService.initializeSocket();
    
    // Set up event listeners
    chatService.addEventListener('message:new', (message) => {
      dispatch({
        type: ADD_MESSAGE,
        payload: message
      });
    });
    
    chatService.addEventListener('user:presence', (data) => {
      dispatch({
        type: SET_USER_PRESENCE,
        payload: data
      });
    });
    
    chatService.addEventListener('user:typing', (data) => {
      dispatch({
        type: SET_USER_TYPING,
        payload: {
          channelId: data.channelId,
          userId: data.user.id,
          isTyping: true
        }
      });
    });
    
    chatService.addEventListener('user:stopped-typing', (data) => {
      dispatch({
        type: SET_USER_TYPING,
        payload: {
          channelId: data.channelId,
          userId: data.userId,
          isTyping: false
        }
      });
    });
    
    // Fetch chat server
    dispatch(fetchChatServer());
  } catch (error) {
    dispatch({
      type: CHAT_ERROR,
      payload: error.message
    });
  }
};

/**
 * Fetch chat server
 * @returns {Function} - Thunk function
 */
export const fetchChatServer = () => async (dispatch) => {
  dispatch({ type: CHAT_LOADING });
  
  try {
    const response = await chatService.getServer();
    
    if (response.success) {
      dispatch({
        type: SET_CHAT_SERVER,
        payload: response.data
      });
    } else {
      dispatch({
        type: CHAT_ERROR,
        payload: response.error || 'Failed to fetch chat server'
      });
    }
  } catch (error) {
    dispatch({
      type: CHAT_ERROR,
      payload: error.message
    });
  }
};

/**
 * Set current channel
 * @param {Object} channel - Channel object
 * @returns {Object} - Action object
 */
export const setCurrentChannel = (channel) => ({
  type: SET_CURRENT_CHANNEL,
  payload: channel
});

/**
 * Fetch channel messages
 * @param {string} channelId - Channel ID
 * @param {Object} options - Options
 * @returns {Function} - Thunk function
 */
export const fetchChannelMessages = (channelId, options = {}) => async (dispatch) => {
  dispatch({ type: CHAT_LOADING });
  
  try {
    const response = await chatService.getChannelMessages(channelId, options);
    
    if (response.success) {
      dispatch({
        type: SET_CHANNEL_MESSAGES,
        payload: response.data
      });
    } else {
      dispatch({
        type: CHAT_ERROR,
        payload: response.error || 'Failed to fetch messages'
      });
    }
  } catch (error) {
    dispatch({
      type: CHAT_ERROR,
      payload: error.message
    });
  }
};

/**
 * Send message
 * @param {string} channelId - Channel ID
 * @param {string} content - Message content
 * @returns {Function} - Thunk function
 */
export const sendMessage = (channelId, content) => async (dispatch) => {
  try {
    chatService.sendMessage(channelId, content);
  } catch (error) {
    dispatch({
      type: CHAT_ERROR,
      payload: error.message
    });
  }
};

/**
 * Edit message
 * @param {string} messageId - Message ID
 * @param {string} content - New content
 * @returns {Function} - Thunk function
 */
export const editMessage = (messageId, content) => async (dispatch) => {
  try {
    const response = await chatService.editMessage(messageId, content);
    
    if (response.success) {
      dispatch({
        type: UPDATE_MESSAGE,
        payload: response.data
      });
    } else {
      dispatch({
        type: CHAT_ERROR,
        payload: response.error || 'Failed to edit message'
      });
    }
  } catch (error) {
    dispatch({
      type: CHAT_ERROR,
      payload: error.message
    });
  }
};

/**
 * Delete message
 * @param {string} messageId - Message ID
 * @returns {Function} - Thunk function
 */
export const deleteMessage = (messageId) => async (dispatch) => {
  try {
    const response = await chatService.deleteMessage(messageId);
    
    if (response.success) {
      dispatch({
        type: DELETE_MESSAGE,
        payload: messageId
      });
    } else {
      dispatch({
        type: CHAT_ERROR,
        payload: response.error || 'Failed to delete message'
      });
    }
  } catch (error) {
    dispatch({
      type: CHAT_ERROR,
      payload: error.message
    });
  }
};

/**
 * Update user presence
 * @param {string} status - Status ('online', 'away', 'busy', 'offline')
 * @returns {Function} - Thunk function
 */
export const updatePresence = (status) => async (dispatch) => {
  try {
    chatService.updatePresence(status);
  } catch (error) {
    dispatch({
      type: CHAT_ERROR,
      payload: error.message
    });
  }
};