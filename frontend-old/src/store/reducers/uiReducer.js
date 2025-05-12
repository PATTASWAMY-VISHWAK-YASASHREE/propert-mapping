// UI Reducer
const initialState = {
  loading: false,
  darkMode: localStorage.getItem('darkMode') === 'true',
  sidebarOpen: false
};

export default function uiReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: payload
      };
    case 'TOGGLE_DARK_MODE':
      localStorage.setItem('darkMode', !state.darkMode);
      return {
        ...state,
        darkMode: !state.darkMode
      };
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };
    case 'SET_SIDEBAR':
      return {
        ...state,
        sidebarOpen: payload
      };
    default:
      return state;
  }
}