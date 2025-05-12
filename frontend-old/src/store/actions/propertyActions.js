// Property actions 
export const getProperties = () => (dispatch) => {
  // Placeholder for API call 
  return dispatch({ 
    type: 'GET_PROPERTIES', 
    payload: [] 
  }); 
}; 

export const getProperty = (id) => (dispatch) => {
  // Placeholder for API call 
  return dispatch({ 
    type: 'GET_PROPERTY', 
    payload: { id } 
  }); 
};

export const fetchProperty = (id) => (dispatch) => {
  // Placeholder for API call
  return dispatch({
    type: 'FETCH_PROPERTY',
    payload: { id }
  });
};

export const bookmarkProperty = (id) => (dispatch) => {
  // Placeholder for API call
  return dispatch({
    type: 'BOOKMARK_PROPERTY',
    payload: { id }
  });
};

export const removeBookmark = (id) => (dispatch) => {
  // Placeholder for API call
  return dispatch({
    type: 'REMOVE_BOOKMARK',
    payload: { id }
  });
};