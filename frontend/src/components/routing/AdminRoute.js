import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Spinner from '../layout/Spinner';

const AdminRoute = ({ component: Component }) => {
  const { isAuthenticated, loading, user } = useSelector(state => state.auth);

  if (loading) {
    return <Spinner />;
  }

  if (isAuthenticated && user && user.role === 'admin') {
    return <Component />;
  }

  return <Navigate to="/dashboard" />;
};

export default AdminRoute;