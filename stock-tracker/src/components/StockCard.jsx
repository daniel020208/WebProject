import { useState, useEffect } from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Info, Trash2, TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { FMP_API_KEY, FMP_BASE_URL } from "../config/apiKeys"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 2000 // 2 seconds

function StockCard({ stock, onDelete }) {
  const [stockData, setStockData] = useState(null)
  const [error, setError] = useState(null)
  const [timeframe, setTimeframe] = useState("30")
  const [latestPrice, setLatestPrice] = useState(null)
  const [priceChange, setPriceChange] = useState(null)
  const [additionalInfo, setAdditionalInfo] = useState(null)
  const [showInfo, setShowInfo] = useState({
    currentPrice: false,
    priceChange: false,
    marketCap: false,
    peRatio: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [retryDelay, setRetryDelay] = useState(INITIAL_RETRY_DELAY)

  const fetchStockData = async (attempt = 0) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `${FMP_BASE_URL}/historical-price-full/${stock.symbol}?timeseries=${timeframe}&apikey=${FMP_API_KEY}`,
      )

      if (!response.ok) {
        if (response.status === 429) {
          if (attempt < MAX_RETRIES) {
            console.log(`Rate limited (429). Retrying in ${retryDelay/1000}s... (Attempt ${attempt + 1}/${MAX_RETRIES})`)
            
            setError(`Rate limit reached. Retrying in ${retryDelay/1000}s... (${attempt + 1}/${MAX_RETRIES})`)
            
            setRetryCount(attempt + 1)
            const nextDelay = retryDelay * 2
            setRetryDelay(nextDelay)
            
            setTimeout(() => {
              fetchStockData(attempt + 1)
            }, retryDelay)
            return
          } else {
            throw new Error("API rate limit exceeded. Please try again later.")
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.historical || data.historical.length === 0) {
        throw new Error("No data available for this stock")
      }

      setRetryCount(0)
      setRetryDelay(INITIAL_RETRY_DELAY)

      const chartData = data.historical.reverse()
      const latestData = chartData[chartData.length - 1]

      setStockData({
        labels: chartData.map((entry) => entry.date),
        datasets: [
          {
            label: "Closing Price",
            data: chartData.map((entry) => entry.close),
            borderColor: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.2)",
            tension: 0.1,
            fill: true,
          },
        ],
      })

      setLatestPrice(latestData.close)
      setPriceChange(latestData.close - chartData[0].close)
      setAdditionalInfo({
        marketCap: latestData.marketCap && !isNaN(latestData.marketCap) ? latestData.marketCap : "N/A",
        pe: latestData.pe && !isNaN(latestData.pe) ? latestData.pe : "N/A",
        volume: latestData.volume && !isNaN(latestData.volume) ? latestData.volume : "N/A",
        open: latestData.open && !isNaN(latestData.open) ? latestData.open : "N/A",
        high: latestData.high && !isNaN(latestData.high) ? latestData.high : "N/A",
        low: latestData.low && !isNaN(latestData.low) ? latestData.low : "N/A",
      })
      setError(null)
    } catch (err) {
      console.error("Error fetching stock data:", err)
      setError(err.message)
      setStockData(null)
      setLatestPrice(null)
      setPriceChange(null)
      setAdditionalInfo(null)
    } finally {
      if (retryCount === 0 || retryCount === MAX_RETRIES) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    setRetryCount(0)
    setRetryDelay(INITIAL_RETRY_DELAY)
    fetchStockData()
  }, [stock.symbol, timeframe])

  const infoExplanations = {
    currentPrice: "The most recent price at which the stock was traded.",
    priceChange: "The change in price over the selected time period.",
    marketCap: "The total value of a company's outstanding shares of stock.",
    peRatio: "The ratio of a company's share price to its earnings per share.",
  }

  const toggleInfo = (key) => {
    setShowInfo((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "rgb(160, 160, 160)",
          maxTicksLimit: 5,
        },
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgb(160, 160, 160)",
          callback: (value) => `$${value.toFixed(2)}`,
        },
      },
    },
  }

  const formatLargeNumber = (num) => {
    if (num === "N/A") return "N/A";
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(2)}B`;
    } else if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  }

  if (error) {
    return (
      <div>
        <div className="bg-error/10 border-2 border-error p-6 rounded-lg shadow-md">
          <div className="flex flex-col items-center justify-center">
            <div className="text-error mb-4 font-medium">{error}</div>
            {error.includes("rate limit") && (
              <div className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                The Financial Modeling Prep API has a limit on the number of requests per minute in the free tier.
              </div>
            )}
            <button 
              onClick={() => {
                setRetryCount(0);
                setRetryDelay(INITIAL_RETRY_DELAY);
                fetchStockData();
              }}
              className="bg-primary hover:bg-accent text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              {isLoading ? "Retrying..." : "Try Again"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-xl transition duration-300 ease-in-out hover:shadow-2xl border-2 border-accent/20">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {stock.name} <span className="text-accent">({stock.symbol})</span>
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => onDelete(stock.id)}
                className="p-2 rounded-lg text-gray-400 hover:text-error hover:bg-error/10 transition-colors duration-200"
                aria-label="Delete stock"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${latestPrice ? latestPrice.toFixed(2) : "N/A"}
                </span>
                <button
                  className="ml-2 text-gray-400 hover:text-accent transition duration-300"
                  onClick={() => toggleInfo("currentPrice")}
                >
                  <Info size={16} />
                </button>
              </div>
              {showInfo.currentPrice && (
                <p className="text-sm text-gray-600 dark:text-gray-300 animate-fadeIn bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">{infoExplanations.currentPrice}</p>
              )}
              {priceChange !== null && (
                <div className="flex items-center">
                  <span className={`text-xl font-semibold ${priceChange >= 0 ? "text-success" : "text-error"}`}>
                    {priceChange >= 0 ? (
                      <TrendingUp className="inline mr-2" size={16} />
                    ) : (
                      <TrendingDown className="inline mr-2" size={16} />
                    )}
                    {priceChange >= 0 ? "+" : "-"}${Math.abs(priceChange).toFixed(2)} (
                    {((priceChange / (latestPrice - priceChange)) * 100).toFixed(2)}%)
                  </span>
                  <button
                    className="ml-2 text-gray-400 hover:text-accent transition duration-300"
                    onClick={() => toggleInfo("priceChange")}
                  >
                    <Info size={16} />
                  </button>
                </div>
              )}
              {showInfo.priceChange && (
                <p className="text-sm text-gray-600 dark:text-gray-300 animate-fadeIn bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">{infoExplanations.priceChange}</p>
              )}
              
              <div className="grid grid-cols-2 gap-4 mt-4 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                {additionalInfo?.marketCap !== "N/A" && (
                  <div>
                    <div className="flex items-center">
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Market Cap</p>
                      <button
                        className="ml-2 text-gray-400 hover:text-accent transition duration-300"
                        onClick={() => toggleInfo("marketCap")}
                      >
                        <Info size={14} />
                      </button>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {additionalInfo?.marketCap ? formatLargeNumber(additionalInfo.marketCap) : "N/A"}
                    </p>
                    {showInfo.marketCap && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 animate-fadeIn bg-gray-200 dark:bg-gray-600 p-1 rounded-lg">{infoExplanations.marketCap}</p>
                    )}
                  </div>
                )}
                
                {additionalInfo?.pe !== "N/A" && (
                  <div>
                    <div className="flex items-center">
                      <p className="text-gray-500 dark:text-gray-400 text-sm">P/E Ratio</p>
                      <button
                        className="ml-2 text-gray-400 hover:text-accent transition duration-300"
                        onClick={() => toggleInfo("peRatio")}
                      >
                        <Info size={14} />
                      </button>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {additionalInfo?.pe !== "N/A" ? additionalInfo?.pe?.toFixed(2) : "N/A"}
                    </p>
                    {showInfo.peRatio && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 animate-fadeIn bg-gray-200 dark:bg-gray-600 p-1 rounded-lg">{infoExplanations.peRatio}</p>
                    )}
                  </div>
                )}
                
                {additionalInfo?.volume !== "N/A" && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Volume</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {additionalInfo?.volume ? Intl.NumberFormat().format(additionalInfo.volume) : "N/A"}
                    </p>
                  </div>
                )}
                
                {additionalInfo?.open !== "N/A" && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Open</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {additionalInfo?.open ? `$${additionalInfo.open.toFixed(2)}` : "N/A"}
                    </p>
                  </div>
                )}
                
                {additionalInfo?.high !== "N/A" && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">High</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {additionalInfo?.high ? `$${additionalInfo.high.toFixed(2)}` : "N/A"}
                    </p>
                  </div>
                )}
                
                {additionalInfo?.low !== "N/A" && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Low</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {additionalInfo?.low ? `$${additionalInfo.low.toFixed(2)}` : "N/A"}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="flex mb-3 space-x-2">
                {["7", "14", "30", "90"].map((days) => (
                  <button
                    key={days}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      timeframe === days
                        ? "bg-accent text-white shadow-md"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    } transition-all duration-200`}
                    onClick={() => setTimeframe(days)}
                  >
                    {days}d
                  </button>
                ))}
              </div>
              <div className="h-64 w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-2">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <RefreshCw size={30} className="animate-spin text-accent" />
                  </div>
                ) : stockData ? (
                  <Line data={stockData} options={chartOptions} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-gray-500 dark:text-gray-400">No chart data available</div>
                  </div>
                )}
              </div>
              <div className="mt-4 text-center">
                <button
                  onClick={fetchStockData}
                  className="bg-primary hover:bg-accent text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 mx-auto transition-all duration-300"
                >
                  <RefreshCw size={16} className={`transition-transform ${isLoading ? "animate-spin" : "group-hover:rotate-180"}`} />
                  {isLoading ? "Updating..." : "Refresh Data"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockCard;

