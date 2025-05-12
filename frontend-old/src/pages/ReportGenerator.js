import React from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createReport } from '../store/actions/reportActions';
import ReportGeneratorComponent from '../components/reports/ReportGenerator';
import Spinner from '../components/layout/Spinner';
import './ReportGenerator.css';

const ReportGenerator = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.reports);

  const handleCreateReport = (reportData) => {
    dispatch(createReport(reportData, (reportId) => {
      // Callback after successful report creation
      history.push(`/reports/${reportId}`);
    }));
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="report-generator-page">
      <div className="page-header">
        <h1>Generate Report</h1>
        <p>Create custom reports to analyze property and ownership data</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="report-generator-container">
        <ReportGeneratorComponent onSubmit={handleCreateReport} />
      </div>
    </div>
  );
};

export default ReportGenerator;
