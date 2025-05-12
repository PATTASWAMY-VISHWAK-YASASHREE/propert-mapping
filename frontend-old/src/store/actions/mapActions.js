import axios from 'axios';
import {
  FETCH_MAP_PROPERTIES_REQUEST,
  FETCH_MAP_PROPERTIES_SUCCESS,
  FETCH_MAP_PROPERTIES_FAIL,
  SET_MAP_BOUNDS,
  SET_MAP_CENTER,
  SET_MAP_ZOOM,
  SET_MAP_FILTERS,
  SAVE_MAP_VIEW_SUCCESS,
  FETCH_SAVED_MAP_VIEWS_SUCCESS,
  DELETE_MAP_VIEW_SUCCESS,
  CLEAR_MAP_ERRORS
} from './types';
import { setAlert } from './alertActions';

// Fetch properties for map
export const fetchMapProperties = (params) => async dispatch => {
  try {
    dispatch({ type: FETCH_MAP_PROPERTIES_REQUEST });

    // Build query string from params
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const res = await axios.get(`/api/map/properties?${queryParams.toString()}`);

    dispatch({
      type: FETCH_MAP_PROPERTIES_SUCCESS,
      payload: res.data.data
    });
  } catch (err) {
    dispatch({
      type: FETCH_MAP_PROPERTIES_FAIL,
      payload: err.response?.data?.error || 'Error loading map properties'
    });
  }
};

// Set map bounds
export const setMapBounds = (bounds) => dispatch => {
  dispatch({
    type: SET_MAP_BOUNDS,
    payload: bounds
  });
};

// Set map center
export const setMapCenter = (center) => dispatch => {
  dispatch({
    type: SET_MAP_CENTER,
    payload: center
  });
};

// Set map zoom
export const setMapZoom = (zoom) => dispatch => {
  dispatch({
    type: SET_MAP_ZOOM,
    payload: zoom
  });
};

// Set map filters
export const setMapFilters = (filters) => dispatch => {
  dispatch({
    type: SET_MAP_FILTERS,
    payload: filters
  });
};

// Save map view
export const saveMapView = (viewData) => async dispatch => {
  try {
    const res = await axios.post('/api/map/views', viewData);

    dispatch({
      type: SAVE_MAP_VIEW_SUCCESS,
      payload: res.data.data
    });

    dispatch(setAlert('Map view saved successfully', 'success'));
  } catch (err) {
    dispatch(setAlert(err.response?.data?.error || 'Error saving map view', 'danger'));
  }
};

// Fetch saved map views
export const fetchSavedMapViews = () => async dispatch => {
  try {
    const res = await axios.get('/api/map/views');

    dispatch({
      type: FETCH_SAVED_MAP_VIEWS_SUCCESS,
      payload: res.data.data
    });
  } catch (err) {
    dispatch(setAlert(err.response?.data?.error || 'Error fetching saved map views', 'danger'));
  }
};

// Delete saved map view
export const deleteMapView = (id) => async dispatch => {
  try {
    await axios.delete(`/api/map/views/${id}`);

    dispatch({
      type: DELETE_MAP_VIEW_SUCCESS,
      payload: id
    });

    dispatch(setAlert('Map view deleted successfully', 'success'));
  } catch (err) {
    dispatch(setAlert(err.response?.data?.error || 'Error deleting map view', 'danger'));
  }
};

// Clear map errors
export const clearMapErrors = () => dispatch => {
  dispatch({ type: CLEAR_MAP_ERRORS });
};