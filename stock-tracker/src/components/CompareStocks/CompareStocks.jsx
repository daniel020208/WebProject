import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './CompareStocks.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_KEY = import.meta.env.VITE_FINANCIAL_MODELING_PREP_API_KEY;

function CompareStocks({ stocks }) {
  const [compareData, setCompareData] = useState(null);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('30');
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [comparisonMetric, setComparisonMetric] = useState('price');
  const [stockStats, setStockStats] = useState({});

  useEffect(() => {
    async function fetchCompareData() {
      if (selectedStocks.length === 0) return;

      try {
        const promises = selectedStocks.map(symbol =>
          fetch(`https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=${timeframe}&apikey=${API_KEY}`)
            .then(response => response.json())
        );

        const quotePromises = selectedStocks.map(symbol =>
          fetch(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${API_KEY}`)
            .then(response => response.json())
        );

        const [results, quoteResults] = await Promise.all([Promise.all(promises), Promise.all(quotePromises)]);

        const chartData = {
          labels: results[0].historical.map(entry => entry.date).reverse(),
          datasets: results.map((result, index) => {
            const data = result.historical.map(entry => {
              switch (comparisonMetric) {
                case 'price':
                  return entry.close;
                case 'percentChange':
                  return ((entry.close - result.historical[result.historical.length - 1].close) / result.historical[result.historical.length - 1].close) * 100;
                case 'volume':
                  return entry.volume;
                default:
                  return entry.close;
              }
            }).reverse();

            return {
              label: selectedStocks[index],
              data: data,
              borderColor: `hsl(${index * 137.5}, 70%, 50%)`,
              backgroundColor: `hsla(${index * 137.5}, 70%, 50%, 0.2)`,
              tension: 0.1,
              fill: false
            };
          })
        };

        setCompareData(chartData);

        const newStockStats = {};
        quoteResults.forEach((quoteData, index) => {
          const quote = quoteData[0];
          newStockStats[selectedStocks[index]] = {
            price: quote.price,
            change: quote.change,
            percentChange: quote.changesPercentage,
            volume: quote.volume,
            marketCap: quote.marketCap,
            pe: quote.pe
          };
        });
        setStockStats(newStockStats);

        setError(null);
      } catch (err) {
        console.error('Error fetching compare data:', err);
        setError(err.message);
        setCompareData(null);
      }
    }

    fetchCompareData();
  }, [selectedStocks, timeframe, comparisonMetric]);

  const handleStockSelect = (symbol) => {
    setSelectedStocks(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      } else if (prev.length < 3) {
        return [...prev, symbol];
      } else {
        return prev;
      }
    });
  };

  const handleComparisonMetricChange = (metric) => {
    setComparisonMetric(metric);
  };

  if (error) {
    return <div className="compare-stocks error">Error: {error}</div>;
  }

  return (
    <div className="compare-stocks">
      <h2>Compare Stocks</h2>
      <div className="stock-selector">
        {stocks.map(stock => (
          <button
            key={stock.symbol}
            onClick={() => handleStockSelect(stock.symbol)}
            className={selectedStocks.includes(stock.symbol) ? 'selected' : ''}
          >
            {stock.symbol}
          </button>
        ))}
      </div>
      <div className="comparison-options">
        <h3>Comparison Options:</h3>
        <div className="option-buttons">
          <button
            onClick={() => handleComparisonMetricChange('price')}
            className={comparisonMetric === 'price' ? 'active' : ''}
          >
            Price
          </button>
          <button
            onClick={() => handleComparisonMetricChange('percentChange')}
            className={comparisonMetric === 'percentChange' ? 'active' : ''}
          >
            Percent Change
          </button>
          <button
            onClick={() => handleComparisonMetricChange('volume')}
            className={comparisonMetric === 'volume' ? 'active' : ''}
          >
            Volume
          </button>
        </div>
      </div>
      {compareData && (
        <>
          <div className="chart-container">
            <Line
              data={compareData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: `Stock ${comparisonMetric === 'percentChange' ? 'Percent Change' : comparisonMetric.charAt(0).toUpperCase() + comparisonMetric.slice(1)} Comparison`,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: comparisonMetric === 'percentChange',
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                      color: '#A0AEC0',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      color: '#A0AEC0',
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
          <div className="stock-stats">
            <h3>Stock Statistics</h3>
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Price</th>
                  <th>Change</th>
                  <th>% Change</th>
                  <th>Volume</th>
                  <th>Market Cap</th>
                  <th>P/E Ratio</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stockStats).map(([symbol, stats]) => (
                  <tr key={symbol}>
                    <td>{symbol}</td>
                    <td>${stats.price.toFixed(2)}</td>
                    <td className={stats.change >= 0 ? 'positive' : 'negative'}>
                      ${Math.abs(stats.change).toFixed(2)}
                    </td>
                    <td className={stats.percentChange >= 0 ? 'positive' : 'negative'}>
                      {stats.percentChange.toFixed(2)}%
                    </td>
                    <td>{stats.volume.toLocaleString()}</td>
                    <td>${(stats.marketCap / 1e9).toFixed(2)}B</td>
                    <td>{stats.pe ? stats.pe.toFixed(2) : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default CompareStocks;

