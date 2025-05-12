// Wealth Reducer
const initialState = {
  wealthProfile: null,
  propertyInsights: null,
  loading: false,
  error: null
};

export default function wealthReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case 'FETCH_WEALTH_PROFILE_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'FETCH_WEALTH_PROFILE_SUCCESS':
      return {
        ...state,
        wealthProfile: payload,
        loading: false,
        error: null
      };
    case 'FETCH_WEALTH_PROFILE_FAILURE':
      return {
        ...state,
        loading: false,
        error: payload
      };
    case 'FETCH_PROPERTY_INSIGHTS_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'FETCH_PROPERTY_INSIGHTS_SUCCESS':
      return {
        ...state,
        propertyInsights: payload,
        loading: false,
        error: null
      };
    case 'FETCH_PROPERTY_INSIGHTS_FAILURE':
      return {
        ...state,
        loading: false,
        error: payload
      };
    case 'CLEAR_WEALTH_PROFILE':
      return {
        ...state,
        wealthProfile: null,
        propertyInsights: null,
        loading: false,
        error: null
      };
    default:
      return state;
  }
}