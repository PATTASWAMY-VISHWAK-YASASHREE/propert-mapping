import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Box
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useAlert } from '../contexts/AlertContext';
import authService from '../services/authService';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(4),
    maxWidth: 400,
    margin: '0 auto',
    marginTop: theme.spacing(8),
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  submitButton: {
    marginTop: theme.spacing(2),
  },
}));

const LoginPage = ({ onLoginSuccess }) => {
  const classes = useStyles();
  const history = useHistory();
  const { setAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setAlert('Please fill in all fields', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await authService.login(formData);
      
      if (response.success) {
        setAlert('Login successful', 'success');
        if (onLoginSuccess) onLoginSuccess();
        history.push('/');
      } else {
        setAlert(response.error || 'Login failed', 'error');
      }
    } catch (error) {
      setAlert(error.error || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Paper className={classes.paper} elevation={3}>
        <Typography variant="h5" align="center" gutterBottom>
          Login
        </Typography>
        
        <form className={classes.form} onSubmit={handleSubmit}>
          <TextField
            label="Email"
            name="email"
            type="email"
            variant="outlined"
            fullWidth
            value={formData.email}
            onChange={handleChange}
            required
          />
          
          <TextField
            label="Password"
            name="password"
            type="password"
            variant="outlined"
            fullWidth
            value={formData.password}
            onChange={handleChange}
            required
          />
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            className={classes.submitButton}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </form>
        
        <Box mt={2} textAlign="center">
          <Typography variant="body2">
            Don't have an account? <Button color="primary" onClick={() => history.push('/register')}>Register</Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;