import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import Button from '../components/Button';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_KEY = import.meta.env.VITE_FINANCIAL_MODELING_PREP_API_KEY;

function CompareStocks({ stocks }) {
  const [compareData, setCompareData] = useState(null);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('30');
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [comparisonMetric, setComparisonMetric] = useState('price');
  const [stockStats, setStockStats] = useState({});
  const [showHowToUse, setShowHowToUse] = useState(false);

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
          labels: results[0].historical.map(entry => {
            const date = new Date(entry.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }).reverse(),
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
    return <div className="p-6 bg-error text-white rounded-lg">Error: {error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-secondary rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-text-primary">Compare Stocks</h2>
      <div className="mb-6 bg-primary p-4 rounded-lg">
        <Button 
          onClick={() => setShowHowToUse(!showHowToUse)} 
          className="bg-accent hover:bg-accent-dark text-white font-bold py-2 px-4 rounded-md mb-2"
        >
          {showHowToUse ? 'Hide' : 'Show'} How to Use
        </Button>
        {showHowToUse && (
          <div className="mt-2 text-text-secondary">
            <h3 className="font-bold mb-2">How to use:</h3>
            <ul className="list-disc list-inside">
              <li>Select up to 3 stocks from the list below to compare.</li>
              <li>Choose a comparison metric: Price, Percent Change, or Volume.</li>
              <li>Select a timeframe to view the data.</li>
              <li>The chart and statistics table will update automatically.</li>
            </ul>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {stocks.map(stock => (
          <Button
            key={stock.symbol}
            onClick={() => handleStockSelect(stock.symbol)}
            className={`py-2 px-4 rounded-md ${
              selectedStocks.includes(stock.symbol)
                ? 'bg-accent text-white'
                : 'bg-primary text-text-primary hover:bg-accent hover:text-white'
            }`}
          >
            {stock.symbol}
          </Button>
        ))}
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-text-primary">Comparison Options:</h3>
        <div className="flex gap-2">
          {['price', 'percentChange', 'volume'].map((metric) => (
            <Button
              key={metric}
              onClick={() => handleComparisonMetricChange(metric)}
              className={`py-2 px-4 rounded-md ${
                comparisonMetric === metric
                  ? 'bg-accent text-white'
                  : 'bg-primary text-text-primary hover:bg-accent hover:text-white'
              }`}
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      {compareData && (
        <>
          <div className="mb-6 bg-primary p-4 rounded-lg">
            <Line
              data={compareData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      color: 'rgb(224, 224, 224)'
                    }
                  },
                  title: {
                    display: true,
                    text: `Stock ${comparisonMetric === 'percentChange' ? 'Percent Change' : comparisonMetric.charAt(0).toUpperCase() + comparisonMetric.slice(1)} Comparison`,
                    color: 'rgb(224, 224, 224)'
                  },
                },
                scales: {
                  y: {
                    beginAtZero: comparisonMetric === 'percentChange',
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                      color: 'rgb(160, 160, 160)',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      color: 'rgb(160, 160, 160)',
                    },
                  },
                },
              }}
              height={300}
            />
          </div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 text-text-primary">Timeframe:</h3>
            <div className="flex gap-2">
              {['7', '30', '90', '365'].map((tf) => (
                <Button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`py-2 px-4 rounded-md ${
                    timeframe === tf
                      ? 'bg-accent text-white'
                      : 'bg-primary text-text-primary hover:bg-accent hover:text-white'
                  }`}
                >
                  {tf === '7' ? '1W' : tf === '30' ? '1M' : tf === '90' ? '3M' : '1Y'}
                </Button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary">
                  <th className="p-2 border-b border-gray-700">Symbol</th>
                  <th className="p-2 border-b border-gray-700">Price</th>
                  <th className="p-2 border-b border-gray-700">Change</th>
                  <th className="p-2 border-b border-gray-700">% Change</th>
                  <th className="p-2 border-b border-gray-700">Volume</th>
                  <th className="p-2 border-b border-gray-700">Market Cap</th>
                  <th className="p-2 border-b border-gray-700">P/E Ratio</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stockStats).map(([symbol, stats]) => (
                  <tr key={symbol} className="hover:bg-primary">
                    <td className="p-2 border-b border-gray-700">{symbol}</td>
                    <td className="p-2 border-b border-gray-700">${stats.price.toFixed(2)}</td>
                    <td className={`p-2 border-b border-gray-700 ${stats.change >= 0 ? 'text-success' : 'text-error'}`}>
                      ${Math.abs(stats.change).toFixed(2)}
                    </td>
                    <td className={`p-2 border-b border-gray-700 ${stats.percentChange >= 0 ? 'text-success' : 'text-error'}`}>
                      {stats.percentChange.toFixed(2)}%
                    </td>
                    <td className="p-2 border-b border-gray-700">{stats.volume.toLocaleString()}</td>
                    <td className="p-2 border-b border-gray-700">${(stats.marketCap / 1e9).toFixed(2)}B</td>
                    <td className="p-2 border-b border-gray-700">{stats.pe ? stats.pe.toFixed(2) : 'N/A'}</td>
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

