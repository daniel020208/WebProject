import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './StockCard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_KEY = import.meta.env.VITE_FINANCIAL_MODELING_PREP_API_KEY;

function StockCard({ symbol, name }) {
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('30');
  const [latestPrice, setLatestPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        if (!API_KEY) {
          throw new Error('API key is undefined. Please check your environment variables.');
        }

        const response = await fetch(`https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=${timeframe}&apikey=${API_KEY}`);
        const data = await response.json();
        
        if (!data.historical || data.historical.length === 0) {
          throw new Error('No data available for this stock');
        }

        const chartData = data.historical.reverse();

        setStockData({
          labels: chartData.map(entry => entry.date),
          datasets: [
            {
              label: 'Closing Price',
              data: chartData.map(entry => entry.close),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.1,
              fill: true
            }
          ]
        });

        setLatestPrice(chartData[chartData.length - 1].close);
        setPriceChange(chartData[chartData.length - 1].close - chartData[0].close);
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError(err.message);
      }
    };

    fetchStockData();
  }, [symbol, timeframe]);

  if (error) {
    return <div className="stock-card error">Error: {error}</div>;
  }

  if (!stockData) {
    return <div className="stock-card loading">Loading...</div>;
  }

  return (
    <div className="stock-card">
      <div className="stock-info">
        <h3>{name} ({symbol})</h3>
        <div className="stock-price">
          <span className="current-price">${latestPrice.toFixed(2)}</span>
          <span className={`price-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
            {priceChange >= 0 ? '+' : '-'}${Math.abs(priceChange).toFixed(2)} ({((priceChange / (latestPrice - priceChange)) * 100).toFixed(2)}%)
          </span>
        </div>
        <div className="additional-info">
          <p>Volume: 1,234,567</p>
          <p>Market Cap: $123.45B</p>
          <p>P/E Ratio: 20.5</p>
        </div>
      </div>
      <div className="chart-container">
        <Line 
          data={stockData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              title: {
                display: false,
              },
            },
            scales: {
              y: {
                beginAtZero: false,
                grid: {
                  color: 'rgba(0, 0, 0, 0.05)',
                },
                ticks: {
                  color: '#6B7280',
                },
              },
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  color: '#6B7280',
                },
              },
            },
          }}
        />
      </div>
      <div className="timeframe-selector">
        <button onClick={() => setTimeframe('7')} className={timeframe === '7' ? 'active' : ''}>1W</button>
        <button onClick={() => setTimeframe('30')} className={timeframe === '30' ? 'active' : ''}>1M</button>
        <button onClick={() => setTimeframe('90')} className={timeframe === '90' ? 'active' : ''}>3M</button>
        <button onClick={() => setTimeframe('365')} className={timeframe === '365' ? 'active' : ''}>1Y</button>
      </div>
    </div>
  );
}

export default StockCard;

