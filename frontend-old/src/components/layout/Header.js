import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom'; // Change useHistory to useHistory
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/actions/authActions';
import './Header.css';

const Header = () => {
  const history = useHistory(); // Use useHistory instead of useHistory
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    history.push('/login'); // Use push instead of navigate
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const authLinks = (
    <nav className="main-nav">
      <ul className={`nav-links ${menuOpen ? 'show' : ''}`}>
        <li>
          <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
        </li>
        <li>
          <Link to="/map" onClick={() => setMenuOpen(false)}>Property Map</Link>
        </li>
        <li>
          <Link to="/reports" onClick={() => setMenuOpen(false)}>Reports</Link>
        </li>
        {user && user.role === 'admin' && (
          <li>
            <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>
          </li>
        )}
      </ul>
      
      <div className="user-menu-container">
        <button className="user-menu-button" onClick={toggleUserMenu}>
          <div className="user-avatar">
            {user && user.firstName ? user.firstName.charAt(0) : 'U'}
          </div>
          <span className="user-name">{user && user.firstName ? `${user.firstName} ${user.lastName}` : 'User'}</span>
          <i className={`fa fa-chevron-${userMenuOpen ? 'up' : 'down'}`}></i>
        </button>
        
        {userMenuOpen && (
          <div className="user-dropdown">
            <Link to="/profile" onClick={() => setUserMenuOpen(false)}>
              <i className="fa fa-user"></i> Profile
            </Link>
            <Link to="/security" onClick={() => setUserMenuOpen(false)}>
              <i className="fa fa-lock"></i> Security
            </Link>
            <Link to="/notifications" onClick={() => setUserMenuOpen(false)}>
              <i className="fa fa-bell"></i> Notifications
            </Link>
            <div className="dropdown-divider"></div>
            <button onClick={handleLogout}>
              <i className="fa fa-sign-out"></i> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );

  const guestLinks = (
    <nav className="main-nav">
      <ul className={`nav-links ${menuOpen ? 'show' : ''}`}>
        <li>
          <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
        </li>
        <li>
          <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary">Register</Link>
        </li>
      </ul>
    </nav>
  );

  return (
    <header className="main-header">
      <div className="container">
        <div className="logo">
          <Link to="/">
            <h1>PropertyMapper</h1>
          </Link>
        </div>
        
        <button className="mobile-menu-toggle" onClick={toggleMenu}>
          <i className={`fa fa-${menuOpen ? 'times' : 'bars'}`}></i>
        </button>
        
        {isAuthenticated ? authLinks : guestLinks}
      </div>
    </header>
  );
};

export default Header;
