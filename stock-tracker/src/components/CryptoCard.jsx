import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Info, Trash2 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function CryptoCard({ crypto, onDelete }) {
  const [cryptoData, setCryptoData] = useState(null);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState(30); // Default timeframe in days
  const [latestPrice, setLatestPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState(null);
  const [showInfo, setShowInfo] = useState({
    currentPrice: false,
    priceChange: false,
    volume: false,
    marketCap: false,
  });

  useEffect(() => {
    async function fetchCryptoData() {
      try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${crypto.id}/market_chart?vs_currency=usd&days=${timeframe}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (!data.prices || data.prices.length === 0) {
          throw new Error('No data available for this cryptocurrency');
        }

        const chartData = data.prices;
        setCryptoData({
          labels: chartData.map(entry => new Date(entry[0]).toLocaleDateString()),
          datasets: [
            {
              label: 'Price (USD)',
              data: chartData.map(entry => entry[1]),
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              tension: 0.1,
              fill: true,
            },
          ],
        });

        const latestData = chartData[chartData.length - 1];
        setLatestPrice(latestData[1]);
        setPriceChange(latestData[1] - chartData[0][1]);

        // Fetch additional info
        const infoResponse = await fetch(`https://api.coingecko.com/api/v3/coins/${crypto.id}`);
        if (!infoResponse.ok) {
          throw new Error(`HTTP error! status: ${infoResponse.status}`);
        }
        const infoData = await infoResponse.json();
        setAdditionalInfo({
          volume: infoData.market_data.total_volume.usd,
          marketCap: infoData.market_data.market_cap.usd,
        });

        setError(null);
      } catch (err) {
        console.error('Error fetching crypto data:', err);
        setError(err.message);
        setCryptoData(null);
        setLatestPrice(null);
        setPriceChange(null);
        setAdditionalInfo(null);
      }
    }

    fetchCryptoData();
  }, [crypto.id, timeframe]);

  const infoExplanations = {
    currentPrice: "The most recent price of the cryptocurrency in USD.",
    priceChange: "The change in price over the selected time period.",
    volume: "The total trading volume in the last 24 hours.",
    marketCap: "The total market value of the cryptocurrency's circulating supply.",
  };

  const toggleInfo = (key) => {
    setShowInfo(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (error) {
    return <div className="bg-error text-white p-6 rounded-lg shadow-lg">Error: {error}</div>;
  }

  if (!cryptoData) {
    return <div className="bg-secondary text-text-primary p-6 rounded-lg shadow-lg">Loading...</div>;
  }

  return (
    <div className="bg-secondary border border-gray-700 rounded-lg overflow-hidden shadow-lg transition duration-300 ease-in-out hover:shadow-2xl h-full flex flex-col">
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-bold text-text-primary">{crypto.name} ({crypto.symbol.toUpperCase()})</h3>
          <button
            onClick={() => onDelete(crypto.id)}
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
                  <p className="text-text-secondary">Volume: ${additionalInfo.volume.toLocaleString()}</p>
                  <button className="ml-2 text-text-secondary hover:text-text-primary transition duration-300" onClick={() => toggleInfo('volume')}>
                    <Info size={16} />
                  </button>
                </div>
                {showInfo.volume && <p className="text-sm text-text-secondary">{infoExplanations.volume}</p>}
                <div className="flex items-center">
                  <p className="text-text-secondary">
                    Market Cap: ${additionalInfo.marketCap.toLocaleString()}
                  </p>
                  <button className="ml-2 text-text-secondary hover:text-text-primary transition duration-300" onClick={() => toggleInfo('marketCap')}>
                    <Info size={16} />
                  </button>
                </div>
                {showInfo.marketCap && <p className="text-sm text-text-secondary">{infoExplanations.marketCap}</p>}
              </div>
            )}
          </div>
          <div className="h-64 flex-grow">
            <Line 
              data={cryptoData}
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
            onClick={() => setTimeframe(parseInt(tf))}
            className={`px-4 py-2 rounded-lg ${
              timeframe === parseInt(tf) 
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

export default CryptoCard;

