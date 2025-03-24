import { useState, useMemo, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import StockCard from "../components/StockCard"
import CryptoCard from "../components/CryptoCard"
import Button from "../components/Button"
import FormInput from "../components/FormInput"
import { FaSync, FaSearch, FaChartLine, FaBitcoin, FaSort, FaSortUp, FaSortDown, FaPlus } from "react-icons/fa"
import { getStockQuote, getCryptoPrice } from "../utils/api"
import { debounce } from "lodash"
import { toast } from "react-toastify"

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

function Dashboard({ user, guestMode, stocks = [], cryptos = [], onDeleteStock, onDeleteCrypto }) {
  const isAuthenticated = !!user || guestMode;
  const [showStocks, setShowStocks] = useState(() => {
    const saved = localStorage.getItem("showStocks")
    return saved !== null ? JSON.parse(saved) : true
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState(() => {
    const saved = localStorage.getItem("sortBy")
    return saved || "name"
  })
  const [sortOrder, setSortOrder] = useState(() => {
    const saved = localStorage.getItem("sortOrder")
    return saved || "asc"
  })
  const [userStocks, setUserStocks] = useState(stocks)
  const [userCryptos, setUserCryptos] = useState(cryptos)
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState(null)
  const [dataCache, setDataCache] = useState({})

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem("showStocks", JSON.stringify(showStocks))
    localStorage.setItem("sortBy", sortBy)
    localStorage.setItem("sortOrder", sortOrder)
  }, [showStocks, sortBy, sortOrder])

  // Update data when stocks or cryptos change
  useEffect(() => {
    setUserStocks(stocks)
    setUserCryptos(cryptos)
  }, [stocks, cryptos])

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  // Get sorting icon
  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="text-gray-400 opacity-50" />
    return sortOrder === "asc" ? (
      <FaSortUp className="text-accent" />
    ) : (
      <FaSortDown className="text-accent" />
    )
  }

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    const filterData = (data) => {
      if (!data || !Array.isArray(data)) return [];
      return data.filter((item) =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.symbol?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    };

    const sortData = (data) => {
      if (!data || !Array.isArray(data)) return [];
      return [...data].sort((a, b) => {
        let valueA = a?.[sortBy];
        let valueB = b?.[sortBy];

        // Handle string comparison
        if (typeof valueA === "string") {
          valueA = valueA.toLowerCase();
          valueB = (typeof valueB === "string") ? valueB.toLowerCase() : valueB;
        }

        // Handle undefined or null values
        if (valueA === undefined || valueA === null) return 1;
        if (valueB === undefined || valueB === null) return -1;

        // Compare values
        if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
        if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    };

    return {
      stocks: sortData(filterData(userStocks || [])),
      cryptos: sortData(filterData(userCryptos || [])),
    };
  }, [userStocks, userCryptos, searchQuery, sortBy, sortOrder]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  // Update stock/crypto data
  const updateAllData = async () => {
    setIsUpdating(true)
    const now = Date.now()
    let updatedStocks = [...userStocks]
    let updatedCryptos = [...userCryptos]
    let updateCount = 0
    let errorCount = 0

    // Update stocks
    for (let i = 0; i < updatedStocks.length; i++) {
      const stock = updatedStocks[i]
      
      try {
        // Check cache first
        const cacheKey = `stock-${stock.symbol}`
        const cachedData = dataCache[cacheKey]
        
        if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
          updatedStocks[i] = { ...stock, ...cachedData.data }
          continue
        }
        
        const stockData = await getStockQuote(stock.symbol)
        updatedStocks[i] = { ...stock, ...stockData }
        
        // Update cache
        setDataCache(prev => ({
          ...prev,
          [cacheKey]: {
            data: stockData,
            timestamp: now
          }
        }))
        
        updateCount++
      } catch (error) {
        console.error(`Error updating ${stock.symbol}:`, error)
        errorCount++
      }
    }

    // Update cryptos
    for (let i = 0; i < updatedCryptos.length; i++) {
      const crypto = updatedCryptos[i]
      
      try {
        // Check cache first
        const cacheKey = `crypto-${crypto.id}`
        const cachedData = dataCache[cacheKey]
        
        if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
          updatedCryptos[i] = { ...crypto, ...cachedData.data }
          continue
        }
        
        const cryptoData = await getCryptoPrice(crypto.id)
        updatedCryptos[i] = { ...crypto, ...cryptoData }
        
        // Update cache
        setDataCache(prev => ({
          ...prev,
          [cacheKey]: {
            data: cryptoData,
            timestamp: now
          }
        }))
        
        updateCount++
      } catch (error) {
        console.error(`Error updating ${crypto.symbol}:`, error)
        errorCount++
      }
    }

    setUserStocks(updatedStocks)
    setUserCryptos(updatedCryptos)
    setIsUpdating(false)
    setLastUpdateTime(now)

    if (errorCount > 0) {
      toast.warning(`Updated ${updateCount} items with ${errorCount} errors`)
    } else if (updateCount > 0) {
      toast.success(`Successfully updated ${updateCount} items`)
    } else {
      toast.info("All data is already up to date")
    }
  }

  const debouncedSearch = useCallback(debounce(handleSearchChange, 300), [])

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 border-2 border-accent/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h1>
            {guestMode && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">
                Guest Mode - Changes won't be saved
              </p>
            )}
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {lastUpdateTime
                ? `Last updated: ${new Date(lastUpdateTime).toLocaleTimeString()}`
                : "Data has not been updated yet"}
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={updateAllData} 
              disabled={isUpdating}
              variant="secondary"
              icon={<FaSync className={`transition-transform ${isUpdating ? "animate-spin" : "hover:rotate-180"}`} />}
            >
              {isUpdating ? "Updating..." : "Update All"}
            </Button>
            <Link to="/add-stock">
              <Button 
                variant="primary" 
                animated
                icon={<FaPlus />}
              >
                Add Stock
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-xl shadow-xl border-2 border-accent/20">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Welcome to Stock Tracker</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Sign in to start managing your portfolio and track your investments in real-time.</p>
            <div className="space-y-4">
              <Link to="/login">
                <Button variant="primary" size="large" animated fullWidth>Log In</Button>
              </Link>
              <Button 
                variant="outline" 
                size="large" 
                animated 
                fullWidth
                onClick={() => {
                  if (window.enableGuestMode) window.enableGuestMode();
                }}
              >
                Continue as Guest
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowStocks(true)}
                variant={showStocks ? "primary" : "secondary"}
                icon={<FaChartLine />}
                animated
              >
                Stocks
              </Button>
              <Button
                onClick={() => setShowStocks(false)}
                variant={!showStocks ? "primary" : "secondary"}
                icon={<FaBitcoin />}
                animated
              >
                Crypto
              </Button>
            </div>
            <div className="w-full sm:w-64">
              <FormInput
                id="search"
                name="search"
                type="text"
                placeholder="Search by name or symbol..."
                onChange={debouncedSearch}
              />
            </div>
          </div>

          {/* No items message */}
          {showStocks && filteredAndSortedData.stocks.length === 0 && (
            <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No stocks in your portfolio</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Add your first stock to start tracking its performance.</p>
              <Link to="/add-stock">
                <Button variant="primary" icon={<FaPlus />} animated>
                  Add Your First Stock
                </Button>
              </Link>
            </div>
          )}

          {!showStocks && filteredAndSortedData.cryptos.length === 0 && (
            <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No cryptocurrencies in your portfolio</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Add your first cryptocurrency to start tracking its performance.</p>
              <Link to="/add-stock">
                <Button variant="primary" icon={<FaPlus />} animated>
                  Add Your First Cryptocurrency
                </Button>
              </Link>
            </div>
          )}

          {/* Stocks list */}
          {showStocks && filteredAndSortedData.stocks.length > 0 && (
            <div className="grid grid-cols-1 gap-6">
              {filteredAndSortedData.stocks.map((stock) => (
                <StockCard 
                  key={stock.id} 
                  stock={stock} 
                  onDelete={onDeleteStock}
                />
              ))}
            </div>
          )}

          {/* Cryptos list */}
          {!showStocks && filteredAndSortedData.cryptos.length > 0 && (
            <div className="grid grid-cols-1 gap-6">
              {filteredAndSortedData.cryptos.map((crypto) => (
                <CryptoCard 
                  key={crypto.id} 
                  crypto={crypto}
                  onDelete={onDeleteCrypto}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard
