import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearErrors } from '../store/actions/authActions';
import Spinner from '../components/layout/Spinner';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, error, loading, mfaRequired } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    mfaToken: ''
  });

  const { email, password, mfaToken } = formData;

  useEffect(() => {
    // Redirect if authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
    }

    // Clear errors on component unmount
    return () => {
      dispatch(clearErrors());
    };
  }, [isAuthenticated, navigate, dispatch]);

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = e => {
    e.preventDefault();
    dispatch(login(email, password, mfaToken));
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Sign In</h2>
          <p>Access your PropertyMapper account</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              required
            />
          </div>

          {mfaRequired && (
            <div className="form-group">
              <label htmlFor="mfaToken">Authentication Code</label>
              <input
                type="text"
                id="mfaToken"
                name="mfaToken"
                value={mfaToken}
                onChange={onChange}
                placeholder="Enter 6-digit code"
                required
              />
              <small>Enter the code from your authenticator app</small>
            </div>
          )}

          <div className="form-group">
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <Spinner /> : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register">Register your company</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;