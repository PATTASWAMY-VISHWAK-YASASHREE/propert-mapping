import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import store from './store';
import { lightTheme } from './theme'; // Import lightTheme instead of default theme
import { AlertProvider } from './contexts/AlertContext';
import { API_FEATURES, isFeatureEnabled } from './config';

// Components
import Header from './components/layout/Header';
import Alert from './components/layout/Alert';
import FeatureGuard from './components/FeatureGuard';
import RegridMap from './components/map/regridmap';

// Pages
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PropertyMap from './pages/PropertyMap';
import PropertyDetail from './pages/PropertyDetail';
import WealthAnalysis from './pages/WealthAnalysis';
import ReportGenerator from './pages/ReportGenerator';
import ChatPage from './pages/ChatPage';
import ApiTestPage from './pages/ApiTestPage';

// Services
import historyService from './services/historyService';

function App() {
  // State to track disabled features
  const [disabledFeatures, setDisabledFeatures] = useState([]);

  // Check which features are disabled on app load
  useEffect(() => {
    const disabled = Object.keys(API_FEATURES).filter(
      feature => !isFeatureEnabled(feature)
    );
    
    setDisabledFeatures(disabled);
    
    if (disabled.length > 0) {
      console.warn('The following features are disabled due to missing API keys:', disabled);
    }
  }, []);

  // Track page views for authenticated users
  useEffect(() => {
    const trackPageView = () => {
      try {
        const url = window.location.pathname + window.location.search;
        const title = document.title;
        historyService.savePage(url, title);
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };

    // Track initial page load
    trackPageView();

    // Track navigation changes
    const handleRouteChange = () => {
      trackPageView();
    };

    // Listen for history changes
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <AlertProvider>
          <Router>
            <Header disabledFeatures={disabledFeatures} />
            <Alert />
            <Switch>
              <Route exact path="/" component={Dashboard} />
              <Route exact path="/login" component={LoginPage} />
              <Route exact path="/register" component={RegisterPage} />
              <Route exact path="/map" render={() => (
                <FeatureGuard 
                  feature="maps" 
                  fallback={<div style={{padding: '20px'}}>Maps feature is disabled due to missing API key.</div>}
                >
                  <PropertyMap />
                </FeatureGuard>
              )} />
              <Route exact path="/property/:id" component={PropertyDetail} />
              <Route exact path="/wealth/:id" component={WealthAnalysis} />
              <Route exact path="/reports" component={ReportGenerator} />
              <Route exact path="/chat" render={() => (
                <FeatureGuard 
                  feature="chat" 
                  fallback={<div style={{padding: '20px'}}>Chat feature is disabled due to missing API key.</div>}
                >
                  <ChatPage />
                </FeatureGuard>
              )} />
              <Route exact path="/api-test" component={ApiTestPage} />
              <Route exact path="/regrid-map" component={RegridMap} />
            </Switch>
          </Router>
        </AlertProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;