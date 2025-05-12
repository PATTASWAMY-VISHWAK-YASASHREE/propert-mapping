/**
 * Chat Reducer
 */

import {
  CHAT_LOADING,
  CHAT_ERROR,
  SET_CHAT_SERVER,
  SET_CURRENT_CHANNEL,
  SET_CHANNEL_MESSAGES,
  ADD_MESSAGE,
  UPDATE_MESSAGE,
  DELETE_MESSAGE,
  SET_USER_PRESENCE,
  SET_USER_TYPING
} from '../actions/chatActions';

const initialState = {
  server: null,
  channels: [],
  members: [],
  currentChannel: null,
  messages: [],
  typingUsers: {},
  loading: false,
  error: null
};

const chatReducer = (state = initialState, action) => {
  switch (action.type) {
    case CHAT_LOADING:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case CHAT_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case SET_CHAT_SERVER:
      return {
        ...state,
        server: action.payload.server,
        channels: action.payload.channels,
        members: action.payload.members,
        loading: false,
        error: null
      };
    
    case SET_CURRENT_CHANNEL:
      return {
        ...state,
        currentChannel: action.payload,
        messages: [],
        typingUsers: {}
      };
    
    case SET_CHANNEL_MESSAGES:
      return {
        ...state,
        messages: action.payload,
        loading: false
      };
    
    case ADD_MESSAGE:
      // Only add message if it's for the current channel
      if (state.currentChannel && action.payload.channel_id === state.currentChannel.id) {
        return {
          ...state,
          messages: [...state.messages, action.payload]
        };
      }
      return state;
    
    case UPDATE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map(message => 
          message.id === action.payload.id ? action.payload : message
        )
      };
    
    case DELETE_MESSAGE:
      return {
        ...state,
        messages: state.messages.filter(message => message.id !== action.payload)
      };
    
    case SET_USER_PRESENCE:
      return {
        ...state,
        members: state.members.map(member => 
          member.id === action.payload.user_id
            ? { ...member, status: action.payload.status, last_active: action.payload.last_active }
            : member
        )
      };
    
    case SET_USER_TYPING:
      if (state.currentChannel && action.payload.channelId === state.currentChannel.id) {
        const { userId, isTyping } = action.payload;
        const typingUsers = { ...state.typingUsers };
        
        if (isTyping) {
          typingUsers[userId] = true;
        } else {
          delete typingUsers[userId];
        }
        
        return {
          ...state,
          typingUsers
        };
      }
      return state;
    
    default:
      return state;
  }
};

export default chatReducer;