// User actions 
export const getUsers = () => (dispatch) => {
  // Placeholder for API call 
  return dispatch({ 
    type: 'GET_USERS', 
    payload: [] 
  }); 
}; 

export const getUserProfile = () => (dispatch) => {
  // Placeholder for API call 
  return dispatch({ 
    type: 'GET_USER_PROFILE', 
    payload: {} 
  }); 
};