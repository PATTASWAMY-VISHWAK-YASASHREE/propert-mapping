import {
  TOGGLE_THEME,
  SET_LOADING,
  SET_ALERT,
  REMOVE_ALERT,
  TOGGLE_SIDEBAR,
  SET_MODAL
} from '../types';

/**
 * Toggle between light and dark theme
 */
export const toggleTheme = () => (dispatch) => {
  // Save preference to localStorage
  const currentTheme = localStorage.getItem('darkMode') === 'true';
  localStorage.setItem('darkMode', (!currentTheme).toString());
  
  dispatch({
    type: TOGGLE_THEME
  });
};

/**
 * Set loading state
 * @param {boolean} isLoading - Loading state
 */
export const setLoading = (isLoading) => ({
  type: SET_LOADING,
  payload: isLoading
});

/**
 * Set alert message
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, error, warning, info)
 * @param {number} timeout - Time in ms before alert disappears
 */
export const setAlert = (message, type = 'info', timeout = 5000) => (dispatch) => {
  const id = Math.random().toString(36).substring(7);
  
  dispatch({
    type: SET_ALERT,
    payload: {
      id,
      message,
      type
    }
  });

  setTimeout(() => {
    dispatch({
      type: REMOVE_ALERT,
      payload: id
    });
  }, timeout);
};

/**
 * Remove specific alert
 * @param {string} id - Alert ID
 */
export const removeAlert = (id) => ({
  type: REMOVE_ALERT,
  payload: id
});

/**
 * Toggle sidebar visibility
 */
export const toggleSidebar = () => ({
  type: TOGGLE_SIDEBAR
});

/**
 * Set modal state
 * @param {string} modalId - Modal identifier
 * @param {boolean} isOpen - Modal open state
 * @param {object} data - Modal data
 */
export const setModal = (modalId, isOpen, data = null) => ({
  type: SET_MODAL,
  payload: {
    modalId,
    isOpen,
    data
  }
});