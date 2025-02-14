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
import { Info, Trash2, TrendingUp, TrendingDown, RefreshCw, ExternalLink } from "lucide-react"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const API_KEY = import.meta.env.VITE_FINANCIAL_MODELING_PREP_API_KEY

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

  const fetchStockData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/historical-price-full/${stock.symbol}?timeseries=${timeframe}&apikey=${API_KEY}`,
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.historical || data.historical.length === 0) {
        throw new Error("No data available for this stock")
      }

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
      setIsLoading(false)
    }
  }

  useEffect(() => {
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

  if (error) {
    return <div className="bg-error text-white p-6 rounded-lg shadow-lg">Error: {error}</div>
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

  return (
    <div className="bg-secondary border border-gray-700 rounded-lg overflow-hidden shadow-lg transition duration-300 ease-in-out hover:shadow-2xl h-full flex flex-col">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-bold text-text-primary">
            {stock.name} ({stock.symbol})
          </h3>
          <div className="flex space-x-2">
            
            <button
              onClick={() => onDelete(stock.id)}
              className="bg-error hover:bg-red-700 text-white font-bold p-2 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-3xl font-bold text-text-primary">
                ${latestPrice ? latestPrice.toFixed(2) : "N/A"}
              </span>
              <button
                className="ml-2 text-text-secondary hover:text-text-primary transition duration-300"
                onClick={() => toggleInfo("currentPrice")}
              >
                <Info size={16} />
              </button>
            </div>
            {showInfo.currentPrice && <p className="text-sm text-text-secondary">{infoExplanations.currentPrice}</p>}
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
                  className="ml-2 text-text-secondary hover:text-text-primary transition duration-300"
                  onClick={() => toggleInfo("priceChange")}
                >
                  <Info size={16} />
                </button>
              </div>
            )}
            {showInfo.priceChange && <p className="text-sm text-text-secondary">{infoExplanations.priceChange}</p>}
            {additionalInfo && (
              <div className="space-y-2">
                <div className="flex items-center">
                  <p className="text-text-secondary">
                    Market Cap:{" "}
                    {typeof additionalInfo.marketCap === "number"
                      ? `$${(additionalInfo.marketCap / 1e9).toFixed(2)}B`
                      : "N/A"}
                  </p>
                  <button
                    className="ml-2 text-text-secondary hover:text-text-primary transition duration-300"
                    onClick={() => toggleInfo("marketCap")}
                  >
                    <Info size={16} />
                  </button>
                </div>
                {showInfo.marketCap && <p className="text-sm text-text-secondary">{infoExplanations.marketCap}</p>}
                <div className="flex items-center">
                  <p className="text-text-secondary">
                    P/E Ratio: {typeof additionalInfo.pe === "number" ? additionalInfo.pe.toFixed(2) : "N/A"}
                  </p>
                  <button
                    className="ml-2 text-text-secondary hover:text-text-primary transition duration-300"
                    onClick={() => toggleInfo("peRatio")}
                  >
                    <Info size={16} />
                  </button>
                </div>
                {showInfo.peRatio && <p className="text-sm text-text-secondary">{infoExplanations.peRatio}</p>}
              </div>
            )}
           
          </div>
          <div className="h-48 lg:h-full min-h-[200px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw size={40} className="animate-spin text-accent" />
              </div>
            ) : stockData ? (
              <Line data={stockData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-text-secondary">No data available</div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-primary p-4 flex justify-center space-x-2">
        {["7", "30", "90", "365"].map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1 rounded-lg text-sm ${
              timeframe === tf
                ? "bg-accent text-white"
                : "bg-secondary text-text-primary hover:bg-accent hover:text-white"
            } transition duration-300 ease-in-out transform hover:scale-105`}
          >
            {tf === "7" ? "1W" : tf === "30" ? "1M" : tf === "90" ? "3M" : "1Y"}
          </button>
        ))}
      </div>
    </div>
  )
}

export default StockCard

