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

const RegisterPage = ({ onRegisterSuccess }) => {
  const classes = useStyles();
  const history = useHistory();
  const { setAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      setAlert('Please fill in all fields', 'error');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setAlert('Passwords do not match', 'error');
      return;
    }
    
    if (formData.password.length < 6) {
      setAlert('Password must be at least 6 characters', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = formData;
      
      const response = await authService.register(userData);
      
      if (response.success) {
        setAlert('Registration successful', 'success');
        if (onRegisterSuccess) onRegisterSuccess();
        history.push('/');
      } else {
        setAlert(response.error || 'Registration failed', 'error');
      }
    } catch (error) {
      setAlert(error.error || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Paper className={classes.paper} elevation={3}>
        <Typography variant="h5" align="center" gutterBottom>
          Register
        </Typography>
        
        <form className={classes.form} onSubmit={handleSubmit}>
          <TextField
            label="First Name"
            name="first_name"
            variant="outlined"
            fullWidth
            value={formData.first_name}
            onChange={handleChange}
            required
          />
          
          <TextField
            label="Last Name"
            name="last_name"
            variant="outlined"
            fullWidth
            value={formData.last_name}
            onChange={handleChange}
            required
          />
          
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
            helperText="Password must be at least 6 characters"
          />
          
          <TextField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            variant="outlined"
            fullWidth
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
            helperText={
              formData.password !== formData.confirmPassword && formData.confirmPassword !== ''
                ? 'Passwords do not match'
                : ''
            }
          />
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            className={classes.submitButton}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Register'}
          </Button>
        </form>
        
        <Box mt={2} textAlign="center">
          <Typography variant="body2">
            Already have an account? <Button color="primary" onClick={() => history.push('/login')}>Login</Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;