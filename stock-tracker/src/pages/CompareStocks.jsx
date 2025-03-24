import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getStockHistory } from '../utils/api';
import { toast } from 'react-toastify';
import { Info, RefreshCw } from 'lucide-react';
import { ChartIcon } from '../components/icons/ChartIcon';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Cache duration in milliseconds (15 minutes)
const CACHE_DURATION = 15 * 60 * 1000;

function CompareStocks({ stocks, cryptos, user, guestMode }) {
  const isAuthenticated = !!user || guestMode;
  const [compareData, setCompareData] = useState(null);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState(() => {
    const saved = localStorage.getItem('compareTimeframe');
    return saved || '30';
  });
  const [selectedStocks, setSelectedStocks] = useState(() => {
    const saved = localStorage.getItem('compareSelectedStocks');
    return saved ? JSON.parse(saved) : [];
  });
  const [comparisonMetric, setComparisonMetric] = useState(() => {
    const saved = localStorage.getItem('compareMetric');
    return saved || 'price';
  });
  const [stockStats, setStockStats] = useState({});
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dataCache, setDataCache] = useState({});

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('compareTimeframe', timeframe);
    localStorage.setItem('compareSelectedStocks', JSON.stringify(selectedStocks));
    localStorage.setItem('compareMetric', comparisonMetric);
  }, [timeframe, selectedStocks, comparisonMetric]);

  // Cache check function
  const shouldUpdateCache = useCallback((symbol, tf) => {
    const cacheKey = `${symbol}-${tf}`;
    const cached = dataCache[cacheKey];
    return !cached || Date.now() - cached.timestamp > CACHE_DURATION;
  }, [dataCache]);

  // Fetch data with retry logic and caching
  const fetchCompareData = useCallback(async (retryCount = 3) => {
    if (selectedStocks.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        selectedStocks.map(async (symbol) => {
          const cacheKey = `${symbol}-${timeframe}`;
          
          if (!shouldUpdateCache(symbol, timeframe)) {
            return dataCache[cacheKey].data;
          }

          let attempts = 0;
          while (attempts < retryCount) {
            try {
              const result = await getStockHistory(symbol, timeframe);
              setDataCache((prev) => ({
                ...prev,
                [cacheKey]: { data: result, timestamp: Date.now() },
              }));
              return result;
            } catch (error) {
              attempts++;
              if (attempts === retryCount) {
                toast.error(`Failed to fetch data for ${symbol} after ${retryCount} attempts`);
                throw error;
              }
              await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
            }
          }
        })
      );

      const chartData = {
        labels: results[0].historical.map((entry) => {
          const date = new Date(entry.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }).reverse(),
        datasets: results.map((result, index) => {
          const data = result.historical.map((entry) => {
            switch (comparisonMetric) {
              case 'price':
                return entry.close;
              case 'percentChange':
                return (
                  ((entry.close - result.historical[result.historical.length - 1].close) /
                    result.historical[result.historical.length - 1].close) *
                  100
                );
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
            fill: false,
          };
        }),
      };

      setCompareData(chartData);

      // Update stock stats
      const newStockStats = {};
      results.forEach((result, index) => {
        const latestData = result.historical[0];
        const previousData = result.historical[1];
        newStockStats[selectedStocks[index]] = {
          price: latestData.close,
          change: latestData.close - previousData.close,
          percentChange: ((latestData.close - previousData.close) / previousData.close) * 100,
          volume: latestData.volume,
          marketCap: latestData.close * latestData.volume,
        };
      });
      setStockStats(newStockStats);
      setError(null);
      toast.success('Comparison data updated successfully');
    } catch (err) {
      console.error('Error fetching compare data:', err);
      setError('Failed to fetch comparison data. Please try again later.');
      toast.error('Failed to fetch comparison data');
      setCompareData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStocks, timeframe, comparisonMetric, dataCache, shouldUpdateCache]);

  useEffect(() => {
    fetchCompareData();
  }, [fetchCompareData]);

  const handleStockSelect = useCallback((symbol) => {
    setSelectedStocks((prev) => {
      if (prev.includes(symbol)) {
        return prev.filter((s) => s !== symbol);
      } else if (prev.length < 3) {
        return [...prev, symbol];
      } else {
        toast.warning('You can only compare up to 3 stocks at a time');
        return prev;
      }
    });
  }, []);

  const handleComparisonMetricChange = useCallback((metric) => {
    setComparisonMetric(metric);
  }, []);

  // Memoize the chart options
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgb(224, 224, 224)',
        },
      },
      title: {
        display: true,
        text: `Stock ${
          comparisonMetric === 'percentChange'
            ? 'Percent Change'
            : comparisonMetric.charAt(0).toUpperCase() + comparisonMetric.slice(1)
        } Comparison`,
        color: 'rgb(224, 224, 224)',
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
  }), [comparisonMetric]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 border-2 border-accent/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Compare Stocks</h1>
            {guestMode && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">
                Guest Mode - Changes won't be saved
              </p>
            )}
            <p className="text-gray-500 dark:text-gray-400 text-sm">Compare performance of multiple stocks over time</p>
          </div>
          <Button
            variant="outline"
            size="small"
            onClick={() => setShowHowToUse(!showHowToUse)}
            icon={<Info size={16} />}
          >
            How to Use
          </Button>
        </div>

        {!isAuthenticated ? (
          <div className="text-center p-10 bg-gray-50 dark:bg-gray-750 rounded-xl border-2 border-accent/10">
            <div className="max-w-md mx-auto">
              <ChartIcon className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Compare Your Portfolio
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Log in or continue as guest to compare the performance of different stocks and track market trends over time.
              </p>
              <div className="space-y-4">
                <Link to="/login">
                  <Button variant="primary" size="large" animated fullWidth>
                    Log In
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="large"
                  animated
                  fullWidth
                  onClick={() => {
                    if (window.enableGuestMode) window.enableGuestMode();
                    toast.success("Guest mode enabled. You can now compare stocks without logging in.");
                  }}
                >
                  Continue as Guest
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-secondary p-6 rounded-lg shadow-lg">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">Compare Stocks</h2>
                  <p className="text-text-secondary mt-1">Analyze and compare up to 3 stocks side by side</p>
                </div>
                <Button
                  onClick={() => setShowHowToUse(!showHowToUse)}
                  className="flex items-center gap-2 bg-primary hover:bg-opacity-80 text-text-primary px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  <Info size={18} />
                  {showHowToUse ? 'Hide Guide' : 'How to Use'}
                </Button>
              </div>

              {showHowToUse && (
                <div className="bg-primary p-4 rounded-lg text-text-secondary space-y-3">
                  <h3 className="font-semibold text-text-primary">Quick Guide:</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Select up to 3 stocks from your portfolio below</li>
                    <li>Choose what to compare: Price, Percent Change, or Volume</li>
                    <li>Adjust the timeframe to see different periods</li>
                    <li>Hover over the chart to see detailed values</li>
                    <li>View the statistics table below for quick comparisons</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Stock Selection Section */}
            <div className="bg-secondary p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-text-primary">Select Stocks to Compare</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {stocks.map((stock) => (
                  <Button
                    key={stock.symbol}
                    onClick={() => handleStockSelect(stock.symbol)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                      selectedStocks.includes(stock.symbol)
                        ? 'bg-accent text-white shadow-lg'
                        : 'bg-primary text-text-primary hover:bg-accent hover:text-white'
                    }`}
                  >
                    <span className="font-medium">{stock.symbol}</span>
                    <span className="text-sm opacity-75">{stock.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Comparison Options Section */}
            <div className="bg-secondary p-6 rounded-lg shadow-lg">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Metric Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">Compare By</h3>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: 'price', label: 'Price' },
                      { value: 'percentChange', label: 'Percent Change' },
                      { value: 'volume', label: 'Volume' }
                    ].map(({ value, label }) => (
                      <Button
                        key={value}
                        onClick={() => handleComparisonMetricChange(value)}
                        className={`py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                          comparisonMetric === value
                            ? 'bg-accent text-white shadow-lg'
                            : 'bg-primary text-text-primary hover:bg-accent hover:text-white'
                        }`}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Timeframe Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-text-primary">Timeframe</h3>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: '7', label: '1W' },
                      { value: '30', label: '1M' },
                      { value: '90', label: '3M' },
                      { value: '365', label: '1Y' }
                    ].map(({ value, label }) => (
                      <Button
                        key={value}
                        onClick={() => setTimeframe(value)}
                        className={`py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                          timeframe === value
                            ? 'bg-accent text-white shadow-lg'
                            : 'bg-primary text-text-primary hover:bg-accent hover:text-white'
                        }`}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Chart and Stats Section */}
            {compareData && (
              <div className="space-y-6">
                {/* Chart */}
                <div className="bg-secondary p-6 rounded-lg shadow-lg">
                  <div className="h-[400px]">
                    <Line data={compareData} options={chartOptions} />
                  </div>
                </div>

                {/* Statistics Table */}
                <div className="bg-secondary p-6 rounded-lg shadow-lg overflow-x-auto">
                  <h3 className="text-lg font-semibold mb-4 text-text-primary">Statistics</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-primary rounded-lg">
                        <th className="p-3 text-left font-semibold text-text-primary rounded-l-lg">Symbol</th>
                        <th className="p-3 text-left font-semibold text-text-primary">Price</th>
                        <th className="p-3 text-left font-semibold text-text-primary">Change</th>
                        <th className="p-3 text-left font-semibold text-text-primary">% Change</th>
                        <th className="p-3 text-left font-semibold text-text-primary">Volume</th>
                        <th className="p-3 text-left font-semibold text-text-primary rounded-r-lg">Market Cap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stockStats).map(([symbol, stats]) => (
                        <tr key={symbol} className="border-b border-gray-700 hover:bg-primary transition-colors duration-200">
                          <td className="p-3 font-medium text-text-primary">{symbol}</td>
                          <td className="p-3">${stats.price.toFixed(2)}</td>
                          <td className={`p-3 ${stats.change >= 0 ? 'text-success' : 'text-error'}`}>
                            ${Math.abs(stats.change).toFixed(2)}
                          </td>
                          <td className={`p-3 ${stats.percentChange >= 0 ? 'text-success' : 'text-error'}`}>
                            {stats.percentChange.toFixed(2)}%
                          </td>
                          <td className="p-3">{stats.volume.toLocaleString()}</td>
                          <td className="p-3">${(stats.marketCap / 1e9).toFixed(2)}B</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center p-12 bg-secondary rounded-lg shadow-lg">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-accent" />
                  <span className="text-text-secondary">Loading comparison data...</span>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && selectedStocks.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 bg-secondary rounded-lg shadow-lg">
                <ChartIcon className="w-16 h-16 text-text-secondary mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">Select Stocks to Compare</h3>
                <p className="text-text-secondary text-center">
                  Choose up to 3 stocks from your portfolio above to start comparing their performance.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CompareStocks;
