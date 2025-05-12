// Property Reducer
const initialState = {
  properties: [],
  property: null,
  loading: false,
  error: null
};

export default function propertyReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case 'GET_PROPERTIES':
      return {
        ...state,
        properties: payload,
        loading: false
      };
    case 'GET_PROPERTY':
    case 'FETCH_PROPERTY':
      return {
        ...state,
        property: payload,
        loading: false
      };
    case 'PROPERTY_ERROR':
      return {
        ...state,
        error: payload,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: true
      };
    case 'BOOKMARK_PROPERTY':
      return {
        ...state,
        properties: state.properties.map(property => 
          property._id === payload.id 
            ? { ...property, isBookmarked: true } 
            : property
        ),
        property: state.property?._id === payload.id 
          ? { ...state.property, isBookmarked: true } 
          : state.property
      };
    case 'REMOVE_BOOKMARK':
      return {
        ...state,
        properties: state.properties.map(property => 
          property._id === payload.id 
            ? { ...property, isBookmarked: false } 
            : property
        ),
        property: state.property?._id === payload.id 
          ? { ...state.property, isBookmarked: false } 
          : state.property
      };
    default:
      return state;
  }
}