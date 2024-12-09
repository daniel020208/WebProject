import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { InfoIcon as InfoCircle } from 'lucide-react';
import './StockCard.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_KEY = import.meta.env.VITE_FINANCIAL_MODELING_PREP_API_KEY;

function StockCard({ stock, onDelete }) {
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('30');
  const [latestPrice, setLatestPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    async function fetchStockData() {
      try {
        console.log(`Fetching data for ${stock.symbol} with timeframe ${timeframe}`);
        const response = await fetch(`https://financialmodelingprep.com/api/v3/historical-price-full/${stock.symbol}?timeseries=${timeframe}&apikey=${API_KEY}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response:', data);

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
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              tension: 0.1,
              fill: true
            }
          ]
        });

        setLatestPrice(chartData[chartData.length - 1].close);
        setPriceChange(chartData[chartData.length - 1].close - chartData[0].close);
        setError(null);

        // 1Fetch additional stock information
        const infoResponse = await fetch(`https://financialmodelingprep.com/api/v3/quote/${stock.symbol}?apikey=${API_KEY}`);
        const infoData = await infoResponse.json();
        if (infoData.length > 0) {
          setAdditionalInfo(infoData[0]);
        }
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
    volume: "The total number of shares traded during the most recent trading day.",
    marketCap: "The total value of a company's outstanding shares of stock.",
    peRatio: "The ratio of a company's share price to its earnings per share.",
    currentPrice: "The most recent price at which the stock was traded.",
    priceChange: "The change in price over the selected time period."
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
          <span className={`price-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
            {priceChange >= 0 ? '+' : '-'}${Math.abs(priceChange).toFixed(2)} ({((priceChange / (latestPrice - priceChange)) * 100).toFixed(2)}%)
          </span>
          <button className="info-button" onClick={() => setShowInfo(!showInfo)}>
            <InfoCircle size={16} />
          </button>
        </div>
        {showInfo && (
          <div className="info-popup">
            <p><strong>Current Price:</strong> {infoExplanations.currentPrice}</p>
            <p><strong>Price Change:</strong> {infoExplanations.priceChange}</p>
          </div>
        )}
        {additionalInfo && (
          <div className="additional-info">
            <p>
              Volume: {additionalInfo.volume.toLocaleString()}
              <button className="info-button" onClick={() => setShowInfo(!showInfo)}>
                <InfoCircle size={16} />
              </button>
            </p>
            {showInfo && <div className="info-popup">{infoExplanations.volume}</div>}
            <p>
              Market Cap: ${(additionalInfo.marketCap / 1e9).toFixed(2)}B
              <button className="info-button" onClick={() => setShowInfo(!showInfo)}>
                <InfoCircle size={16} />
              </button>
            </p>
            {showInfo && <div className="info-popup">{infoExplanations.marketCap}</div>}
            <p>
              P/E Ratio: {additionalInfo.pe ? additionalInfo.pe.toFixed(2) : 'N/A'}
              <button className="info-button" onClick={() => setShowInfo(!showInfo)}>
                <InfoCircle size={16} />
              </button>
            </p>
            {showInfo && <div className="info-popup">{infoExplanations.peRatio}</div>}
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

export default StockCard;

