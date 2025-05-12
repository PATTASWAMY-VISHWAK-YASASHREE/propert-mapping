// Import types
import { SET_ALERT, REMOVE_ALERT } from './types';

// Generate a unique ID without uuid dependency
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Set Alert
export const setAlert = (msg, alertType, timeout = 5000) => dispatch => {
  const id = generateId();
  
  dispatch({
    type: SET_ALERT,
    payload: { msg, alertType, id }
  });

  setTimeout(() => dispatch({ type: REMOVE_ALERT, payload: id }), timeout);
};