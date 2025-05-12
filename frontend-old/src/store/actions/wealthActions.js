// Wealth actions
import axios from 'axios';

// Fetch owner wealth profile
export const fetchOwnerWealthProfile = (ownerId) => async (dispatch) => {
  try {
    dispatch({ type: 'FETCH_WEALTH_PROFILE_REQUEST' });

    // Placeholder for API call
    // In a real app, you would make an API call like:
    // const res = await axios.get(`/api/wealth/owners/${ownerId}`);
    
    // For now, we'll simulate a successful response with mock data
    const mockData = {
      owner: {
        id: ownerId,
        displayName: 'Sample Owner',
        type: 'individual',
        individual: {
          occupation: 'Business Executive',
          maritalStatus: 'married'
        }
      },
      estimatedNetWorth: {
        value: 5000000,
        confidenceScore: 85
      },
      wealthTier: 'High Net Worth',
      primaryWealthSource: 'Business Ownership',
      wealthComposition: {
        realEstate: {
          value: 2500000,
          percentage: 50,
          properties: [
            { propertyId: '123', estimatedValue: 1500000, ownershipPercentage: 100 },
            { propertyId: '456', estimatedValue: 1000000, ownershipPercentage: 100 }
          ]
        },
        securities: {
          value: 1500000,
          percentage: 30,
          significantHoldings: [
            { name: 'Tech Corp', ticker: 'TECH', value: 750000, percentage: 50 },
            { name: 'Finance Inc', ticker: 'FIN', value: 750000, percentage: 50 }
          ]
        },
        cash: {
          value: 500000,
          percentage: 10
        },
        other: {
          value: 500000,
          percentage: 10
        }
      },
      income: {
        estimatedAnnualIncome: 450000,
        sources: [
          { type: 'Employment', amount: 300000, percentage: 66.7 },
          { type: 'Investments', amount: 150000, percentage: 33.3 }
        ]
      },
      properties: [
        { id: '123', address: '123 Main St', value: 1500000 },
        { id: '456', address: '456 Oak Ave', value: 1000000 }
      ],
      dataSources: [
        { name: 'Public Records', lastUpdated: '2023-01-15', confidenceScore: 90 },
        { name: 'Financial Disclosures', lastUpdated: '2023-02-20', confidenceScore: 85 },
        { name: 'Property Records', lastUpdated: '2023-03-10', confidenceScore: 95 }
      ],
      metadata: {
        lastUpdated: '2023-03-15',
        overallConfidenceScore: 85
      }
    };

    // Simulate API delay
    setTimeout(() => {
      dispatch({
        type: 'FETCH_WEALTH_PROFILE_SUCCESS',
        payload: mockData
      });
    }, 500);
  } catch (err) {
    dispatch({
      type: 'FETCH_WEALTH_PROFILE_FAILURE',
      payload: err.response?.data?.message || 'Failed to fetch wealth profile'
    });
  }
};

// Get property wealth insights
export const getPropertyWealthInsights = (propertyId) => async (dispatch) => {
  try {
    dispatch({ type: 'FETCH_PROPERTY_INSIGHTS_REQUEST' });

    // Placeholder for API call
    // In a real app, you would make an API call like:
    // const res = await axios.get(`/api/wealth/properties/${propertyId}/insights`);
    
    // For now, we'll simulate a successful response with mock data
    const mockData = {
      propertyId,
      insights: {
        totalOwnerNetWorth: 7500000,
        propertyValueToNetWorthRatio: 20.0,
        netWorthComparison: 35.5
      },
      owners: [
        {
          id: '123abc',
          name: 'John Smith',
          ownershipPercentage: 75,
          netWorth: 5000000,
          wealthTier: 'High Net Worth',
          confidenceScore: 85
        },
        {
          id: '456def',
          name: 'Jane Smith',
          ownershipPercentage: 25,
          netWorth: 2500000,
          wealthTier: 'Affluent',
          confidenceScore: 80
        }
      ]
    };

    // Simulate API delay
    setTimeout(() => {
      dispatch({
        type: 'FETCH_PROPERTY_INSIGHTS_SUCCESS',
        payload: mockData
      });
    }, 500);
  } catch (err) {
    dispatch({
      type: 'FETCH_PROPERTY_INSIGHTS_FAILURE',
      payload: err.response?.data?.message || 'Failed to fetch property wealth insights'
    });
  }
};

// Clear wealth profile
export const clearWealthProfile = () => (dispatch) => {
  dispatch({ type: 'CLEAR_WEALTH_PROFILE' });
};