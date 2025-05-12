import { combineReducers } from 'redux';
import chatReducer from './chatReducer';
import authReducer from './authReducer';
import alertReducer from './alertReducer';
import uiReducer from './uiReducer';
import mapReducer from './mapReducer';
import wealthReducer from './wealthReducer';
import propertyReducer from './propertyReducer';

export default combineReducers({
  chat: chatReducer,
  auth: authReducer,
  alert: alertReducer,
  ui: uiReducer,
  map: mapReducer,
  wealth: wealthReducer,
  property: propertyReducer
});