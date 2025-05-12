import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>PropertyMapper</h3>
            <p>
              A comprehensive platform for property mapping and owner wealth analysis.
            </p>
          </div>
          
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li>
                <Link to="/map">Property Map</Link>
              </li>
              <li>
                <Link to="/reports">Reports</Link>
              </li>
              <li>
                <Link to="/help">Help Center</Link>
              </li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Legal</h3>
            <ul className="footer-links">
              <li>
                <Link to="/terms">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/data-usage">Data Usage</Link>
              </li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Contact</h3>
            <ul className="footer-links">
              <li>
                <a href="mailto:support@propertymapper.com">
                  <i className="fa fa-envelope"></i> support@propertymapper.com
                </a>
              </li>
              <li>
                <a href="tel:+18005551234">
                  <i className="fa fa-phone"></i> (800) 555-1234
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} PropertyMapper. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;