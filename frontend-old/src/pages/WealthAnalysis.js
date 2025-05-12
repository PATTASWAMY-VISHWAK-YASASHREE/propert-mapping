import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOwnerWealthProfile } from '../store/actions/wealthActions';
import WealthProfile from '../components/wealth/WealthProfile';
import Spinner from '../components/layout/Spinner';
import './WealthAnalysis.css';

const WealthAnalysis = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { wealthProfile, loading, error } = useSelector(state => state.wealth);

  useEffect(() => {
    if (id) {
      dispatch(fetchOwnerWealthProfile(id));
    }
  }, [dispatch, id]);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="wealth-analysis-error">
        <h2>Error Loading Wealth Data</h2>
        <p>{error}</p>
        <Link to="/map" className="btn btn-primary">
          Return to Map
        </Link>
      </div>
    );
  }

  return (
    <div className="wealth-analysis-page">
      <div className="page-header">
        <h1>Wealth Analysis</h1>
        <p>Detailed wealth information and insights</p>
      </div>

      <div className="wealth-analysis-content">
        <WealthProfile />
      </div>
    </div>
  );
};

export default WealthAnalysis;