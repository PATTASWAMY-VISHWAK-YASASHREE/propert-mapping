import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { Paper, Typography, Button, Chip } from '@material-ui/core';
import WarningIcon from '@material-ui/icons/Warning';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    backgroundColor: theme.palette.warning.light,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  icon: {
    marginRight: theme.spacing(1),
    color: theme.palette.warning.dark,
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
    '& > *': {
      margin: theme.spacing(0.5),
    },
  },
  actions: {
    marginTop: theme.spacing(2),
  },
}));

/**
 * Component to display a notice about missing API keys
 * 
 * @param {Object} props - Component props
 * @param {string[]} props.missingApis - List of missing API feature names
 * @param {Function} props.onDismiss - Function to call when notice is dismissed
 * @returns {React.ReactElement} - The rendered component
 */
const MissingApiNotice = ({ missingApis, onDismiss }) => {
  const classes = useStyles();

  if (!missingApis || missingApis.length === 0) {
    return null;
  }

  return (
    <Paper className={classes.root} elevation={2}>
      <div className={classes.header}>
        <WarningIcon className={classes.icon} />
        <Typography variant="h6">Some features are disabled</Typography>
      </div>
      
      <Typography variant="body1">
        The following features are disabled due to missing API keys in your .env file:
      </Typography>
      
      <div className={classes.chipContainer}>
        {missingApis.map((api) => (
          <Chip key={api} label={api} color="warning" variant="outlined" />
        ))}
      </div>
      
      <Typography variant="body2">
        Your application will continue to function, but these features will be unavailable.
        To enable these features, add the required API keys to your .env file.
      </Typography>
      
      <div className={classes.actions}>
        <Button variant="outlined" color="primary" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </Paper>
  );
};

MissingApiNotice.propTypes = {
  missingApis: PropTypes.arrayOf(PropTypes.string).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export default MissingApiNotice;