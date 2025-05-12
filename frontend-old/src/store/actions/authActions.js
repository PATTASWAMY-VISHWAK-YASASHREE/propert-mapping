// Auth actions
import axios from 'axios';

// Load User
export const loadUser = () => async (dispatch) => {
  try {
    const res = await axios.get('/api/auth');

    dispatch({
      type: 'USER_LOADED',
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: 'AUTH_ERROR'
    });
  }
};

// Register User
export const register = ({ name, email, password }) => async (dispatch) => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const body = JSON.stringify({ name, email, password });

  try {
    const res = await axios.post('/api/users', body, config);

    dispatch({
      type: 'REGISTER_SUCCESS',
      payload: res.data
    });

    dispatch(loadUser());
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach(error => dispatch(setAlert(error.msg, 'danger')));
    }

    dispatch({
      type: 'REGISTER_FAIL'
    });
  }
};

// Login User
export const login = (email, password) => async (dispatch) => {
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const body = JSON.stringify({ email, password });

  try {
    const res = await axios.post('/api/auth', body, config);

    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: res.data
    });

    dispatch(loadUser());
  } catch (err) {
    const errors = err.response?.data?.errors;

    if (errors) {
      errors.forEach(error => dispatch(setAlert(error.msg, 'danger')));
    }

    dispatch({
      type: 'LOGIN_FAIL'
    });
  }
};

// Logout
export const logout = () => (dispatch) => {
  dispatch({ type: 'LOGOUT' });
};

// Set Alert
export const setAlert = (msg, alertType, timeout = 5000) => dispatch => {
  const id = Math.random().toString(36).substr(2, 9);
  dispatch({
    type: 'SET_ALERT',
    payload: { msg, alertType, id }
  });

  setTimeout(() => dispatch({ type: 'REMOVE_ALERT', payload: id }), timeout);
};