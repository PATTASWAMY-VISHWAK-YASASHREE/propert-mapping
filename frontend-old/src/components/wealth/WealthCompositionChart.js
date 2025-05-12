import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { formatCurrency } from '../../utils/formatting';
import './WealthCompositionChart.css';

const WealthCompositionChart = ({ composition }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  useEffect(() => {
    if (!composition) return;
    
    // Prepare data for chart
    const data = prepareChartData(composition);
    
    // Create or update chart
    if (chartInstance.current) {
      // Update existing chart
      chartInstance.current.data = data;
      chartInstance.current.update();
    } else if (chartRef.current) {
      // Create new chart
      chartInstance.current = new Chart(chartRef.current, {
        type: 'doughnut',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'right',
              labels: {
                boxWidth: 15,
                padding: 15,
                font: {
                  size: 12
                },
                generateLabels: (chart) => {
                  const data = chart.data;
                  if (data.labels.length && data.datasets.length) {
                    return data.labels.map((label, i) => {
                      const value = data.datasets[0].data[i];
                      const percentage = ((value / data.datasets[0]._meta.total) * 100).toFixed(1);
                      
                      return {
                        text: `${label} (${percentage}%)`,
                        fillStyle: data.datasets[0].backgroundColor[i],
                        hidden: isNaN(data.datasets[0].data[i]) || data.datasets[0].data[i] === 0,
                        index: i
                      };
                    });
                  }
                  return [];
                }
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw;
                  const total = context.dataset._meta.total;
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [composition]);
  
  // Prepare data for chart
  const prepareChartData = (composition) => {
    // Extract data from composition
    const labels = [];
    const values = [];
    const colors = [
      '#4CAF50', // Real Estate (Green)
      '#2196F3', // Securities (Blue)
      '#9C27B0', // Private Equity (Purple)
      '#FFC107', // Cash (Yellow)
      '#FF5722'  // Other (Orange)
    ];
    
    // Calculate total for percentage
    let total = 0;
    Object.values(composition).forEach(category => {
      if (category && typeof category.value === 'number') {
        total += category.value;
      }
    });
    
    // Add data for each category
    if (composition.realEstate && composition.realEstate.value) {
      labels.push('Real Estate');
      values.push(composition.realEstate.value);
    }
    
    if (composition.securities && composition.securities.value) {
      labels.push('Securities');
      values.push(composition.securities.value);
    }
    
    if (composition.privateEquity && composition.privateEquity.value) {
      labels.push('Private Equity');
      values.push(composition.privateEquity.value);
    }
    
    if (composition.cash && composition.cash.value) {
      labels.push('Cash');
      values.push(composition.cash.value);
    }
    
    if (composition.other && composition.other.value) {
      labels.push('Other Assets');
      values.push(composition.other.value);
    }
    
    // Add _meta property for custom legend
    const dataset = {
      data: values,
      backgroundColor: colors.slice(0, values.length),
      borderWidth: 0,
      _meta: { total }
    };
    
    return {
      labels,
      datasets: [dataset]
    };
  };
  
  // If no composition data, show placeholder
  if (!composition) {
    return (
      <div className="wealth-chart-placeholder">
        <p>No wealth composition data available</p>
      </div>
    );
  }
  
  return (
    <div className="wealth-composition-chart">
      <h3>Wealth Composition</h3>
      <div className="chart-wrapper">
        <canvas ref={chartRef}></canvas>
        
        {/* Center text showing total net worth */}
        <div className="chart-center-text">
          <div className="total-label">Total Net Worth</div>
          <div className="total-value">
            {formatCurrency(Object.values(composition).reduce(
              (sum, category) => sum + (category?.value || 0), 0
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WealthCompositionChart;