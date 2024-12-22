import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Info, Trash2 } from 'lucide-react';

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
          volume: latestData.volume || 'N/A',
          marketCap: latestData.marketCap && !isNaN(latestData.marketCap) ? latestData.marketCap : 'N/A',
          pe: latestData.pe && !isNaN(latestData.pe) ? latestData.pe : 'N/A'
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
    return <div className="bg-error text-white p-6 rounded-lg shadow-lg">Error: {error}</div>;
  }

  if (!stockData) {
    return <div className="bg-secondary text-text-primary p-6 rounded-lg shadow-lg">Loading...</div>;
  }

  return (
    <div className="bg-secondary border border-gray-700 rounded-lg overflow-hidden shadow-lg transition duration-300 ease-in-out hover:shadow-2xl h-full flex flex-col">
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-bold text-text-primary">{stock.name} ({stock.symbol})</h3>
          <button 
            onClick={() => onDelete(stock.id)} 
            className="bg-error hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            <Trash2 size={20} />
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-4xl font-bold text-text-primary">${latestPrice.toFixed(2)}</span>
              <button className="ml-2 text-text-secondary hover:text-text-primary transition duration-300" onClick={() => toggleInfo('currentPrice')}>
                <Info size={20} />
              </button>
            </div>
            {showInfo.currentPrice && <p className="text-sm text-text-secondary">{infoExplanations.currentPrice}</p>}
            <div className="flex items-center">
              <span className={`text-2xl font-semibold ${priceChange >= 0 ? 'text-success' : 'text-error'}`}>
                {priceChange >= 0 ? '+' : '-'}${Math.abs(priceChange).toFixed(2)} ({((priceChange / (latestPrice - priceChange)) * 100).toFixed(2)}%)
              </span>
              <button className="ml-2 text-text-secondary hover:text-text-primary transition duration-300" onClick={() => toggleInfo('priceChange')}>
                <Info size={20} />
              </button>
            </div>
            {showInfo.priceChange && <p className="text-sm text-text-secondary">{infoExplanations.priceChange}</p>}
            {additionalInfo && (
              <div className="space-y-3">
                <div className="flex items-center">
                  <p className="text-text-secondary">Volume: {additionalInfo.volume.toLocaleString()}</p>
                  <button className="ml-2 text-text-secondary hover:text-text-primary transition duration-300" onClick={() => toggleInfo('volume')}>
                    <Info size={16} />
                  </button>
                </div>
                {showInfo.volume && <p className="text-sm text-text-secondary">{infoExplanations.volume}</p>}
                <div className="flex items-center">
                  <p className="text-text-secondary">
                    Market Cap: {typeof additionalInfo.marketCap === 'number' 
                      ? `$${(additionalInfo.marketCap / 1e9).toFixed(2)}B` 
                      : 'N/A'}
                  </p>
                  <button className="ml-2 text-text-secondary hover:text-text-primary transition duration-300" onClick={() => toggleInfo('marketCap')}>
                    <Info size={16} />
                  </button>
                </div>
                {showInfo.marketCap && <p className="text-sm text-text-secondary">{infoExplanations.marketCap}</p>}
                <div className="flex items-center">
                  <p className="text-text-secondary">
                    P/E Ratio: {typeof additionalInfo.pe === 'number' ? additionalInfo.pe.toFixed(2) : 'N/A'}
                  </p>
                  <button className="ml-2 text-text-secondary hover:text-text-primary transition duration-300" onClick={() => toggleInfo('peRatio')}>
                    <Info size={16} />
                  </button>
                </div>
                {showInfo.peRatio && <p className="text-sm text-text-secondary">{infoExplanations.peRatio}</p>}
              </div>
            )}
          </div>
          <div className="h-64 flex-grow">
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
        </div>
      </div>
      <div className="bg-primary p-4 flex justify-center space-x-4">
        {['7', '30', '90', '365'].map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 rounded-lg ${
              timeframe === tf 
                ? 'bg-accent text-white' 
                : 'bg-secondary text-text-primary hover:bg-accent hover:text-white'
            } transition duration-300 ease-in-out transform hover:scale-105`}
          >
            {tf === '7' ? '1W' : tf === '30' ? '1M' : tf === '90' ? '3M' : '1Y'}
          </button>
        ))}
      </div>
    </div>
  );
}

export default StockCard;

