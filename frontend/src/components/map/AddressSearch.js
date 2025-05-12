import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  TextField,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  Popper,
  Grow,
  ClickAwayListener
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Search as SearchIcon } from '@material-ui/icons';
import { debounce } from 'lodash';
import geocodingService from '../../services/geocodingService';
import { setMapCenter, setSelectedLocation } from '../../store/actions/mapActions';

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
    zIndex: 1000,
    width: '100%',
    maxWidth: 500,
    margin: '0 auto',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0.5, 1),
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },
  searchIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  searchInput: {
    flex: 1,
    '& .MuiInputBase-root': {
      width: '100%',
    },
    '& .MuiInputBase-input': {
      padding: theme.spacing(1, 1, 1, 0),
    },
  },
  suggestionsList: {
    width: '100%',
    maxHeight: 300,
    overflow: 'auto',
    marginTop: theme.spacing(1),
  },
  noResults: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));

/**
 * Address Search Component
 * Provides address search functionality with autocomplete
 */
const AddressSearch = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Debounced function to fetch address suggestions
  const fetchSuggestions = debounce(async (input) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await geocodingService.getAddressSuggestions(input);
      setSuggestions(response.results || []);
      setOpen(response.results && response.results.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    fetchSuggestions(query);
    
    return () => {
      fetchSuggestions.cancel();
    };
  }, [query]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setAnchorEl(e.currentTarget);
  };

  const handleSuggestionClick = async (suggestion) => {
    setQuery(suggestion.formattedAddress);
    setOpen(false);

    try {
      // Get detailed information about the selected location
      const response = await geocodingService.geocodeAddress(suggestion.formattedAddress);
      
      if (response.success && response.results.length > 0) {
        const location = response.results[0];
        
        // Update map center
        dispatch(setMapCenter({
          lat: location.location.lat,
          lng: location.location.lng
        }));
        
        // Set selected location
        dispatch(setSelectedLocation(location));
      }
    } catch (error) {
      console.error('Error geocoding selected address:', error);
    }
  };

  const handleClickAway = () => {
    setOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query) return;
    
    try {
      setLoading(true);
      const response = await geocodingService.geocodeAddress(query);
      
      if (response.success && response.results.length > 0) {
        const location = response.results[0];
        
        // Update map center
        dispatch(setMapCenter({
          lat: location.location.lat,
          lng: location.location.lng
        }));
        
        // Set selected location
        dispatch(setSelectedLocation(location));
        
        setOpen(false);
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.root}>
      <form onSubmit={handleSubmit}>
        <div className={classes.searchContainer}>
          <SearchIcon className={classes.searchIcon} />
          <TextField
            className={classes.searchInput}
            placeholder="Search for an address"
            value={query}
            onChange={handleInputChange}
            variant="standard"
            fullWidth
            InputProps={{
              disableUnderline: true,
              endAdornment: loading && <CircularProgress size={20} />,
            }}
          />
        </div>
      </form>
      
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        transition
        style={{ width: anchorEl ? anchorEl.clientWidth : null, zIndex: 1500 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper>
              <ClickAwayListener onClickAway={handleClickAway}>
                <List className={classes.suggestionsList}>
                  {suggestions.length > 0 ? (
                    suggestions.map((suggestion, index) => (
                      <ListItem
                        button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <ListItemText primary={suggestion.formattedAddress} />
                      </ListItem>
                    ))
                  ) : (
                    <div className={classes.noResults}>
                      {query.length >= 3 && !loading ? 'No results found' : ''}
                    </div>
                  )}
                </List>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  );
};

export default AddressSearch;