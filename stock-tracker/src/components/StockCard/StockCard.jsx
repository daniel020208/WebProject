import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Info } from 'lucide-react';
import './StockCard.css';
import PropTypes from 'prop-types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_KEY = import.meta.env.VITE_FINANCIAL_MODELING_PREP_API_KEY;

function StockCard({ stock, onDelete }) {
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('30');
  const [latestPrice, setLatestPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState(null);
  const [showInfo, setShowInfo] = useState({
    currentPrice: false,
    priceChange: false,
    volume: false,
    marketCap: false,
    peRatio: false
  });

  useEffect(() => {
    async function fetchStockData() {
      try {
        const response = await fetch(`https://financialmodelingprep.com/api/v3/historical-price-full/${stock.symbol}?timeseries=${timeframe}&apikey=${API_KEY}`);
      
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.historical || data.historical.length === 0) {
          throw new Error('No data available for this stock');
        }

        const chartData = data.historical.reverse();
        const latestData = chartData[chartData.length - 1];

        setStockData({
          labels: chartData.map(entry => entry.date),
          datasets: [
            {
              label: 'Closing Price',
              data: chartData.map(entry => entry.close),
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              tension: 0.1,
              fill: true
            }
          ]
        });

        setLatestPrice(latestData.close);
        setPriceChange(latestData.close - chartData[0].close);
        setAdditionalInfo({
          volume: latestData.volume,
          marketCap: latestData.marketCap || 'N/A',
          pe: latestData.pe || 'N/A'
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError(err.message);
        setStockData(null);
        setLatestPrice(null);
        setPriceChange(null);
        setAdditionalInfo(null);
      }
    }

    fetchStockData();
  }, [stock.symbol, timeframe]);

  const infoExplanations = {
    currentPrice: "The most recent price at which the stock was traded.",
    priceChange: "The change in price over the selected time period.",
    volume: "The total number of shares traded during the most recent trading day.",
    marketCap: "The total value of a company's outstanding shares of stock.",
    peRatio: "The ratio of a company's share price to its earnings per share."
  };

  const toggleInfo = (key) => {
    setShowInfo(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (error) {
    return <div className="stock-card error">Error: {error}</div>;
  }

  if (!stockData) {
    return <div className="stock-card loading">Loading...</div>;
  }

  return (
    <div className="stock-card">
      <div className="stock-info">
        <h3>{stock.name} ({stock.symbol})</h3>
        <div className="stock-price">
          <span className="current-price">${latestPrice.toFixed(2)}</span>
          <button className="info-button" onClick={() => toggleInfo('currentPrice')}>
            <Info size={16} />
          </button>
        </div>
        {showInfo.currentPrice && <div className="info-text">{infoExplanations.currentPrice}</div>}
        <div className="price-change">
          <span className={priceChange >= 0 ? 'positive' : 'negative'}>
            {priceChange >= 0 ? '+' : '-'}${Math.abs(priceChange).toFixed(2)} ({((priceChange / (latestPrice - priceChange)) * 100).toFixed(2)}%)
          </span>
          <button className="info-button" onClick={() => toggleInfo('priceChange')}>
            <Info size={16} />
          </button>
        </div>
        {showInfo.priceChange && <div className="info-text">{infoExplanations.priceChange}</div>}
        {additionalInfo && (
          <div className="additional-info">
            <p>
              Volume: {additionalInfo.volume.toLocaleString()}
              <button className="info-button" onClick={() => toggleInfo('volume')}>
                <Info size={16} />
              </button>
            </p>
            {showInfo.volume && <div className="info-text">{infoExplanations.volume}</div>}
            <p>
              Market Cap: ${(additionalInfo.marketCap / 1e9).toFixed(2)}B
              <button className="info-button" onClick={() => toggleInfo('marketCap')}>
                <Info size={16} />
              </button>
            </p>
            {showInfo.marketCap && <div className="info-text">{infoExplanations.marketCap}</div>}
            <p>
              P/E Ratio: {additionalInfo.pe ? additionalInfo.pe.toFixed(2) : 'N/A'}
              <button className="info-button" onClick={() => toggleInfo('peRatio')}>
                <Info size={16} />
              </button>
            </p>
            {showInfo.peRatio && <div className="info-text">{infoExplanations.peRatio}</div>}
          </div>
        )}
        <button onClick={() => onDelete(stock.id)} className="delete-button">Delete</button>
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
                  color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                  color: 'var(--text-color-muted)',
                },
              },
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  color: 'var(--text-color-muted)',
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

StockCard.propTypes = {
  stock: PropTypes.shape({
    id: PropTypes.string.isRequired,
    symbol: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default StockCard;

