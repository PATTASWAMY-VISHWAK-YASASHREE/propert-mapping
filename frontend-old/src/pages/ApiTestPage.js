import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useAlert } from '../contexts/AlertContext';
import apiService from '../services/api';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(4),
    marginTop: theme.spacing(4),
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  formControl: {
    marginBottom: theme.spacing(2),
  },
  responseContainer: {
    marginTop: theme.spacing(4),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
    maxHeight: 400,
    overflow: 'auto',
  },
  responseText: {
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
}));

const ApiTestPage = () => {
  const classes = useStyles();
  const { setAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('/health');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!endpoint) {
      setAlert('Please enter an endpoint', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      let result;
      
      switch (method) {
        case 'GET':
          result = await apiService.get(endpoint);
          break;
        case 'POST':
          result = await apiService.post(endpoint, requestBody ? JSON.parse(requestBody) : {});
          break;
        case 'PUT':
          result = await apiService.put(endpoint, requestBody ? JSON.parse(requestBody) : {});
          break;
        case 'DELETE':
          result = await apiService.delete(endpoint);
          break;
        default:
          result = await apiService.get(endpoint);
      }
      
      setResponse(result);
      setAlert('API request successful', 'success');
    } catch (error) {
      console.error('API test error:', error);
      setResponse(error);
      setAlert('API request failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestChatServer = async () => {
    setMethod('GET');
    setEndpoint('/chat/servers');
    
    // Submit the form after a short delay to allow state to update
    setTimeout(() => {
      document.getElementById('api-test-form').dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true })
      );
    }, 100);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        API Test Tool
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper className={classes.paper} elevation={3}>
            <Typography variant="h6" gutterBottom>
              Request
            </Typography>
            
            <form id="api-test-form" className={classes.form} onSubmit={handleSubmit}>
              <FormControl variant="outlined" className={classes.formControl}>
                <InputLabel>Method</InputLabel>
                <Select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  label="Method"
                >
                  <MenuItem value="GET">GET</MenuItem>
                  <MenuItem value="POST">POST</MenuItem>
                  <MenuItem value="PUT">PUT</MenuItem>
                  <MenuItem value="DELETE">DELETE</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                variant="outlined"
                fullWidth
                placeholder="e.g. /health"
                helperText="Enter the API endpoint path"
              />
              
              {(method === 'POST' || method === 'PUT') && (
                <TextField
                  label="Request Body (JSON)"
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={4}
                  placeholder='{"key": "value"}'
                />
              )}
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Send Request'}
              </Button>
            </form>
            
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                Quick Tests
              </Typography>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  setMethod('GET');
                  setEndpoint('/health');
                }}
                style={{ marginRight: 8, marginBottom: 8 }}
              >
                Health Check
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={handleTestChatServer}
                style={{ marginRight: 8, marginBottom: 8 }}
              >
                Chat Servers
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper className={classes.paper} elevation={3}>
            <Typography variant="h6" gutterBottom>
              Response
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : response ? (
              <div className={classes.responseContainer}>
                <pre className={classes.responseText}>
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            ) : (
              <Typography color="textSecondary">
                Send a request to see the response
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ApiTestPage;