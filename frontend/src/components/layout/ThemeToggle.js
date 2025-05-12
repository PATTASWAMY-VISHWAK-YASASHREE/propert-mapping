import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconButton, Tooltip } from '@material-ui/core';
import { Brightness4, Brightness7 } from '@material-ui/icons';
import { toggleTheme } from '../../store/actions/uiActions';

/**
 * Theme Toggle Component
 * Allows users to switch between light and dark themes
 */
const ThemeToggle = () => {
  const dispatch = useDispatch();
  const { darkMode } = useSelector(state => state.ui);

  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };

  return (
    <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <IconButton
        color="inherit"
        onClick={handleToggleTheme}
        aria-label="toggle theme"
      >
        {darkMode ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;