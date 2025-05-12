import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box, Card, CardContent, CardHeader, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useDispatch, useSelector } from 'react-redux';
import { Home as HomeIcon, Assessment as AssessmentIcon, LocationOn as LocationIcon } from '@material-ui/icons';

// Components
import PropertyList from '../components/property/PropertyList';
import WealthProfile from '../components/wealth/WealthProfile';
import MissingApiNotice from '../components/layout/MissingApiNotice';
import ChatWidget from '../components/chat/ChatWidget';

// Actions
import { getUsers } from '../store/actions/userActions';
import { getProperties } from '../store/actions/propertyActions';
import { getReports } from '../store/actions/reportActions';

// Config
import { API_FEATURES, isFeatureEnabled } from '../config';

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
    height: '100%',
  },
  welcomeBox: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    borderRadius: theme.shape.borderRadius,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeContent: {
    flex: 1,
  },
  statsContainer: {
    marginBottom: theme.spacing(3),
  },
  statCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  statHeader: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(1, 2),
  },
  statContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2),
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: theme.palette.primary.main,
  },
  statIcon: {
    fontSize: '3rem',
    color: theme.palette.grey[300],
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      marginRight: theme.spacing(1),
    },
  },
  mapPreview: {
    height: 200,
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(2),
    backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0)',
    backgroundSize: '40px 40px',
    backgroundPosition: '0 0, 20px 20px',
    position: 'relative',
    overflow: 'hidden',
  },
  mapMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: theme.palette.primary.main,
    borderRadius: '50%',
    border: '2px solid white',
    transform: 'translate(-50%, -50%)',
  },
  mapRoad: {
    position: 'absolute',
    backgroundColor: '#d3d3d3',
  },
  horizontalRoad: {
    height: 8,
    left: '10%',
    right: '10%',
  },
  verticalRoad: {
    width: 8,
    top: '10%',
    bottom: '10%',
  },
  activityFeed: {
    maxHeight: 400,
    overflowY: 'auto',
  },
  activityItem: {
    padding: theme.spacing(1, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  activityTime: {
    color: theme.palette.text.secondary,
    fontSize: '0.8rem',
  },
}));

const Dashboard = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [showApiNotice, setShowApiNotice] = useState(false);
  const [missingApis, setMissingApis] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Check for missing APIs
  useEffect(() => {
    const missing = Object.keys(API_FEATURES).filter(
      feature => !isFeatureEnabled(feature)
    );
    
    if (missing.length > 0) {
      setMissingApis(missing);
      setShowApiNotice(true);
    }
  }, []);

  // Load data
  useEffect(() => {
    dispatch(getUsers());
    dispatch(getProperties());
    dispatch(getReports());
    
    // Generate mock recent activity
    const mockActivity = [
      { id: 1, type: 'property_view', message: 'You viewed property at 123 Main St', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
      { id: 2, type: 'report_generated', message: 'Generated wealth report for Johnson Family', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: 3, type: 'property_added', message: 'New property added at 456 Oak Ave', timestamp: new Date(Date.now() - 5 * 3600000).toISOString() },
      { id: 4, type: 'search_performed', message: 'Searched for properties in San Francisco', timestamp: new Date(Date.now() - 1 * 86400000).toISOString() },
      { id: 5, type: 'user_login', message: 'Logged in from new device', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
    ];
    
    setRecentActivity(mockActivity);
  }, [dispatch]);

  // Format timestamp for activity feed
  const formatActivityTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <Container maxWidth="lg" className={classes.container}>
      {showApiNotice && (
        <MissingApiNotice 
          missingApis={missingApis} 
          onDismiss={() => setShowApiNotice(false)} 
        />
      )}
      
      <Box className={classes.welcomeBox}>
        <div className={classes.welcomeContent}>
          <Typography variant="h4" gutterBottom>
            Welcome to Property Mapper
          </Typography>
          <Typography variant="body1">
            Your dashboard shows an overview of your properties, wealth analysis, and recent activities.
          </Typography>
        </div>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} className={classes.statsContainer}>
        <Grid item xs={12} sm={4}>
          <Card className={classes.statCard}>
            <CardHeader 
              title="Properties" 
              className={classes.statHeader}
              titleTypographyProps={{ variant: 'subtitle1' }}
            />
            <CardContent className={classes.statContent}>
              <Typography variant="h3" className={classes.statValue}>
                24
              </Typography>
              <HomeIcon className={classes.statIcon} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card className={classes.statCard}>
            <CardHeader 
              title="Total Value" 
              className={classes.statHeader}
              titleTypographyProps={{ variant: 'subtitle1' }}
            />
            <CardContent className={classes.statContent}>
              <Typography variant="h3" className={classes.statValue}>
                $12.4M
              </Typography>
              <AssessmentIcon className={classes.statIcon} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card className={classes.statCard}>
            <CardHeader 
              title="Locations" 
              className={classes.statHeader}
              titleTypographyProps={{ variant: 'subtitle1' }}
            />
            <CardContent className={classes.statContent}>
              <Typography variant="h3" className={classes.statValue}>
                8
              </Typography>
              <LocationIcon className={classes.statIcon} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        {/* Property List */}
        <Grid item xs={12} md={8}>
          <Paper className={classes.paper}>
            <Typography variant="h6" className={classes.sectionTitle}>
              <HomeIcon fontSize="small" />
              Recent Properties
            </Typography>
            <PropertyList limit={5} />
          </Paper>
        </Grid>
        
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3} direction="column">
            {/* Map Preview */}
            <Grid item>
              <Paper className={classes.paper}>
                <Typography variant="h6" className={classes.sectionTitle}>
                  <LocationIcon fontSize="small" />
                  Property Map
                </Typography>
                <div className={classes.mapPreview}>
                  {/* Decorative roads */}
                  <div className={`${classes.mapRoad} ${classes.horizontalRoad}`} style={{ top: '30%' }} />
                  <div className={`${classes.mapRoad} ${classes.horizontalRoad}`} style={{ top: '70%' }} />
                  <div className={`${classes.mapRoad} ${classes.verticalRoad}`} style={{ left: '40%' }} />
                  <div className={`${classes.mapRoad} ${classes.verticalRoad}`} style={{ left: '70%' }} />
                  
                  {/* Sample property markers */}
                  <div className={classes.mapMarker} style={{ top: '30%', left: '40%' }} />
                  <div className={classes.mapMarker} style={{ top: '45%', left: '70%' }} />
                  <div className={classes.mapMarker} style={{ top: '70%', left: '25%' }} />
                </div>
                <Typography variant="body2" align="center">
                  View the interactive property map for more details
                </Typography>
              </Paper>
            </Grid>
            
            {/* Recent Activity */}
            <Grid item>
              <Paper className={classes.paper}>
                <Typography variant="h6" className={classes.sectionTitle}>
                  Recent Activity
                </Typography>
                <div className={classes.activityFeed}>
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className={classes.activityItem}>
                      <Typography variant="body2">
                        {activity.message}
                      </Typography>
                      <Typography variant="caption" className={classes.activityTime}>
                        {formatActivityTime(activity.timestamp)}
                      </Typography>
                    </div>
                  ))}
                </div>
              </Paper>
            </Grid>
            
            {/* Wealth Profile */}
            <Grid item>
              <Paper className={classes.paper}>
                <Typography variant="h6" className={classes.sectionTitle}>
                  <AssessmentIcon fontSize="small" />
                  Wealth Overview
                </Typography>
                <WealthProfile />
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      
      {/* Chat Widget */}
      <ChatWidget />
    </Container>
  );
};

export default Dashboard;