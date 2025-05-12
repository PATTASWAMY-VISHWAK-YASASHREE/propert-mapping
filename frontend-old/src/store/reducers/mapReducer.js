// Map Reducer
const initialState = {
  center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
  zoom: 12,
  properties: [],
  selectedProperty: null,
  loading: false,
  error: null,
  filters: {
    priceMin: null,
    priceMax: null,
    bedrooms: null,
    bathrooms: null,
    propertyType: null
  },
  savedViews: []
};

export default function mapReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case 'SET_MAP_CENTER':
      return {
        ...state,
        center: payload
      };
    case 'SET_MAP_ZOOM':
      return {
        ...state,
        zoom: payload
      };
    case 'SET_MAP_PROPERTIES':
      return {
        ...state,
        properties: payload,
        loading: false
      };
    case 'SELECT_PROPERTY':
      return {
        ...state,
        selectedProperty: payload
      };
    case 'SET_MAP_LOADING':
      return {
        ...state,
        loading: payload
      };
    case 'SET_MAP_ERROR':
      return {
        ...state,
        error: payload,
        loading: false
      };
    case 'SET_MAP_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...payload
        }
      };
    case 'CLEAR_MAP_FILTERS':
      return {
        ...state,
        filters: initialState.filters
      };
    case 'SET_SAVED_VIEWS':
      return {
        ...state,
        savedViews: payload
      };
    default:
      return state;
  }
}