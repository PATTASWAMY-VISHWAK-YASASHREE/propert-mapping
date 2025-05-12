import React from 'react';
import { useSelector } from 'react-redux';
import './Alert.css';

const Alert = () => {
  const alerts = useSelector(state => state.alert);

  if (alerts !== null && alerts.length > 0) {
    return (
      <div className="alert-container">
        {alerts.map(alert => (
          <div key={alert.id} className={`alert alert-${alert.alertType}`}>
            <i className={`fa ${getAlertIcon(alert.alertType)}`}></i>
            <span>{alert.msg}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

// Helper function to get appropriate icon for alert type
const getAlertIcon = (alertType) => {
  switch (alertType) {
    case 'success':
      return 'fa-check-circle';
    case 'danger':
      return 'fa-exclamation-circle';
    case 'warning':
      return 'fa-exclamation-triangle';
    case 'info':
      return 'fa-info-circle';
    default:
      return 'fa-bell';
  }
};

export default Alert;