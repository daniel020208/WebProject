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

function CryptoCard({ crypto, onDelete }) {
  const [cryptoData, setCryptoData] = useState(null)
  const [error, setError] = useState(null)
  const [timeframe, setTimeframe] = useState("m30")
  const [latestPrice, setLatestPrice] = useState(null)
  const [priceChange, setPriceChange] = useState(null)
  const [additionalInfo, setAdditionalInfo] = useState(null)
  const [showInfo, setShowInfo] = useState({
    currentPrice: false,
    priceChange: false,
    marketCap: false,
    supply: false,
    maxSupply: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchCryptoData = async () => {
    setIsLoading(true)
    try {
      const [historyResponse, infoResponse] = await Promise.all([
        fetch(`https://api.coincap.io/v2/assets/${crypto.id}/history?interval=${timeframe}`),
        fetch(`https://api.coincap.io/v2/assets/${crypto.id}`),
      ])

      if (!historyResponse.ok || !infoResponse.ok) {
        throw new Error(`HTTP error! status: ${historyResponse.status || infoResponse.status}`)
      }

      const [historyData, infoData] = await Promise.all([historyResponse.json(), infoResponse.json()])

      if (!historyData.data || historyData.data.length === 0) {
        throw new Error("No data available for this cryptocurrency")
      }

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
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCryptoData()
  }, [crypto.id, timeframe])

  const infoExplanations = {
    currentPrice: "The most recent price of the cryptocurrency in USD.",
    priceChange: "The change in price over the selected time period.",
    marketCap: "The total market value of the cryptocurrency's circulating supply.",
    supply: "The amount of coins that are circulating in the market.",
    maxSupply: "The maximum number of coins that will ever exist in the lifetime of the cryptocurrency.",
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
            {crypto.name} ({crypto.symbol.toUpperCase()})
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => onDelete(crypto.id)}
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
                    Market Cap: ${additionalInfo.marketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                    Supply: {additionalInfo.supply.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
                    {crypto.symbol.toUpperCase()}
                  </p>
                  <button
                    className="ml-2 text-text-secondary hover:text-text-primary transition duration-300"
                    onClick={() => toggleInfo("supply")}
                  >
                    <Info size={16} />
                  </button>
                </div>
                {showInfo.supply && <p className="text-sm text-text-secondary">{infoExplanations.supply}</p>}
                {additionalInfo.maxSupply && (
                  <div className="flex items-center">
                    <p className="text-text-secondary">
                      Max Supply: {additionalInfo.maxSupply.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
                      {crypto.symbol.toUpperCase()}
                    </p>
                    <button
                      className="ml-2 text-text-secondary hover:text-text-primary transition duration-300"
                      onClick={() => toggleInfo("maxSupply")}
                    >
                      <Info size={16} />
                    </button>
                  </div>
                )}
                {showInfo.maxSupply && additionalInfo.maxSupply && (
                  <p className="text-sm text-text-secondary">{infoExplanations.maxSupply}</p>
                )}
              </div>
            )}
            
          </div>
          <div className="h-48 lg:h-full min-h-[200px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw size={40} className="animate-spin text-accent" />
              </div>
            ) : cryptoData ? (
              <Line data={cryptoData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-text-secondary">No data available</div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-primary p-4 flex justify-center space-x-2">
        {[
          { label: "1D", value: "m30" },
          { label: "1W", value: "h2" },
          { label: "1M", value: "h12" },
          { label: "1Y", value: "d1" },
        ].map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setTimeframe(value)}
            className={`px-3 py-1 rounded-lg text-sm ${
              timeframe === value
                ? "bg-accent text-white"
                : "bg-secondary text-text-primary hover:bg-accent hover:text-white"
            } transition duration-300 ease-in-out transform hover:scale-105`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CryptoCard

