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
import { Info, Trash2, TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 2000 // 2 seconds

function CryptoCard({ crypto, onDelete }) {
  const [cryptoData, setCryptoData] = useState(null)
  const [error, setError] = useState(null)
  const [timeframe, setTimeframe] = useState("m30")
  const [latestPrice, setLatestPrice] = useState(null)
  const [priceChange, setPriceChange] = useState(null)
  const [additionalInfo, setAdditionalInfo] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [retryDelay, setRetryDelay] = useState(INITIAL_RETRY_DELAY)

  const fetchCryptoData = async (attempt = 0) => {
    setIsLoading(true)
    try {
      const [historyResponse, infoResponse] = await Promise.all([
        fetch(`https://api.coincap.io/v2/assets/${crypto.id}/history?interval=${timeframe}`),
        fetch(`https://api.coincap.io/v2/assets/${crypto.id}`),
      ])

      if (!historyResponse.ok || !infoResponse.ok) {
        if (historyResponse.status === 429 || infoResponse.status === 429) {
          if (attempt < MAX_RETRIES) {
            console.log(`Rate limited (429). Retrying in ${retryDelay/1000}s... (Attempt ${attempt + 1}/${MAX_RETRIES})`)
            
            setError(`Rate limit reached. Retrying in ${retryDelay/1000}s... (${attempt + 1}/${MAX_RETRIES})`)
            
            setRetryCount(attempt + 1)
            const nextDelay = retryDelay * 2
            setRetryDelay(nextDelay)
            
            setTimeout(() => {
              fetchCryptoData(attempt + 1)
            }, retryDelay)
            return
          } else {
            throw new Error("API rate limit exceeded. Please try again later.")
          }
        }
        throw new Error(`HTTP error! status: ${historyResponse.status || infoResponse.status}`)
      }

      const [historyData, infoData] = await Promise.all([historyResponse.json(), infoResponse.json()])

      if (!historyData.data || historyData.data.length === 0) {
        throw new Error("No data available for this cryptocurrency")
      }

      setRetryCount(0)
      setRetryDelay(INITIAL_RETRY_DELAY)

      const prices = historyData.data
      const dataPoints = timeframe === "m30" ? 48 : timeframe === "h2" ? 84 : timeframe === "h12" ? 60 : 30
      const step = Math.max(1, Math.floor(prices.length / dataPoints))
      const processedPrices = prices.filter((_, index) => index % step === 0).slice(-dataPoints)

      setCryptoData({
        labels: processedPrices.map((entry) => new Date(entry.time).toLocaleDateString()),
        datasets: [
          {
            label: "Price (USD)",
            data: processedPrices.map((entry) => Number.parseFloat(entry.priceUsd)),
            borderColor: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.2)",
            tension: 0.1,
            fill: true,
          },
        ],
      })

      const latestPrice = Number.parseFloat(infoData.data.priceUsd)
      setLatestPrice(latestPrice)
      setPriceChange(latestPrice - Number.parseFloat(processedPrices[0].priceUsd))

      setAdditionalInfo({
        marketCap: Number.parseFloat(infoData.data.marketCapUsd),
        supply: Number.parseFloat(infoData.data.supply),
        maxSupply: infoData.data.maxSupply ? Number.parseFloat(infoData.data.maxSupply) : null,
        volume: Number.parseFloat(infoData.data.volumeUsd24Hr),
        vwap24Hr: infoData.data.vwap24Hr ? Number.parseFloat(infoData.data.vwap24Hr) : null,
        changePercent24Hr: Number.parseFloat(infoData.data.changePercent24Hr),
      })

      setError(null)
    } catch (err) {
      console.error("Error fetching crypto data:", err)
      setError(err.message)
      setCryptoData(null)
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
    fetchCryptoData()
  }, [crypto.id, timeframe])

  const toggleDetails = () => {
    setShowDetails(!showDetails)
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

  const formatSupply = (num) => {
    if (num === "N/A") return "N/A";
    if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(2)}B`;
    } else if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `${(num / 1_000).toFixed(2)}K`;
    }
    return num.toFixed(2);
  }

  if (error) {
    return (
      <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200">
        <td colSpan="4" className="p-4">
          <div className="bg-error/10 border-2 border-error p-6 rounded-lg shadow-md">
            <div className="flex flex-col items-center justify-center">
              <div className="text-error mb-4 font-medium">{error}</div>
              {error.includes("rate limit") && (
                <div className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  The CoinCap API has a limit on the number of requests per minute.
                </div>
              )}
              <button 
                onClick={() => {
                  setRetryCount(0);
                  setRetryDelay(INITIAL_RETRY_DELAY);
                  fetchCryptoData();
                }}
                className="bg-primary hover:bg-accent text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                {isLoading ? "Retrying..." : "Try Again"}
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr 
        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors duration-200 cursor-pointer"
        onClick={toggleDetails}
      >
        <td className="p-4">
          <div className="font-medium text-gray-900 dark:text-white">{crypto.name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{crypto.symbol.toUpperCase()}</div>
        </td>
        <td className="p-4">
          <div className="font-semibold text-gray-900 dark:text-white">
            ${latestPrice ? latestPrice.toFixed(2) : "N/A"}
          </div>
        </td>
        <td className="p-4">
          {priceChange !== null ? (
            <div className={`flex items-center font-medium ${priceChange >= 0 ? "text-success" : "text-error"}`}>
              {priceChange >= 0 ? (
                <TrendingUp className="mr-1" size={16} />
              ) : (
                <TrendingDown className="mr-1" size={16} />
              )}
              {priceChange >= 0 ? "+" : ""}${Math.abs(priceChange).toFixed(2)} (
              {((priceChange / (latestPrice - priceChange)) * 100).toFixed(2)}%)
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">N/A</div>
          )}
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(crypto.id);
              }}
              className="p-2 text-gray-500 hover:text-error hover:bg-error/10 rounded-full transition-colors duration-200"
              aria-label="Delete cryptocurrency"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDetails();
              }}
              className="p-2 text-gray-500 hover:text-accent hover:bg-accent/10 rounded-full transition-colors duration-200"
              aria-label={showDetails ? "Hide details" : "Show details"}
            >
              {showDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </td>
      </tr>

      {showDetails && (
        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <td colSpan="4" className="p-6">
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                </div>
              ) : (
                <>
                  {/* Chart Section */}
                  <div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <button
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          timeframe === "m30"
                            ? "bg-accent text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                        onClick={() => setTimeframe("m30")}
                      >
                        24H
                      </button>
                      <button
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          timeframe === "h2"
                            ? "bg-accent text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                        onClick={() => setTimeframe("h2")}
                      >
                        7D
                      </button>
                      <button
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          timeframe === "h12"
                            ? "bg-accent text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                        onClick={() => setTimeframe("h12")}
                      >
                        30D
                      </button>
                      <div className="ml-auto">
                        <button
                          onClick={() => fetchCryptoData()}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-accent hover:bg-accent/10 rounded-full transition-colors duration-200"
                          aria-label="Refresh data"
                        >
                          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                        </button>
                      </div>
                    </div>
                    <div className="w-full h-48 md:h-64">
                      {cryptoData ? (
                        <Line options={chartOptions} data={cryptoData} />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500 dark:text-gray-400">No chart data available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-750 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Market Cap</div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {additionalInfo ? formatLargeNumber(additionalInfo.marketCap) : "N/A"}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-750 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Supply</div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {additionalInfo ? formatSupply(additionalInfo.supply) : "N/A"}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-750 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Max Supply</div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {additionalInfo && additionalInfo.maxSupply
                          ? formatSupply(additionalInfo.maxSupply)
                          : "Unlimited"}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-750 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Volume (24h)</div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {additionalInfo ? formatLargeNumber(additionalInfo.volume) : "N/A"}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-750 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">VWAP (24h)</div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {additionalInfo && additionalInfo.vwap24Hr
                          ? `$${additionalInfo.vwap24Hr.toFixed(2)}`
                          : "N/A"}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-750 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Change (24h)</div>
                      <div className={`font-semibold ${
                        additionalInfo && additionalInfo.changePercent24Hr >= 0
                          ? "text-success"
                          : "text-error"
                      }`}>
                        {additionalInfo
                          ? `${additionalInfo.changePercent24Hr >= 0 ? "+" : ""}${additionalInfo.changePercent24Hr.toFixed(2)}%`
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default CryptoCard

