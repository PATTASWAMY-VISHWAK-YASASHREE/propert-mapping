// Report actions 
export const getReports = () => (dispatch) => {
  // Placeholder for API call 
  return dispatch({ 
    type: 'GET_REPORTS', 
    payload: [] 
  }); 
}; 

export const generateReport = (data) => (dispatch) => {
  // Placeholder for API call 
  return dispatch({ 
    type: 'GENERATE_REPORT', 
    payload: { data } 
  }); 
};

export const createReport = (reportData) => (dispatch) => {
  // Placeholder for API call
  return dispatch({
    type: 'CREATE_REPORT',
    payload: reportData
  });
};