import React, { useState, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import FormInput from "../components/FormInput"
import Button from "../components/Button"
import { 
  FaSearch, FaSpinner, FaPlus, FaBitcoin, FaChartLine, FaExchangeAlt, 
  FaGlobe, FaIndustry, FaSitemap, FaInfoCircle, FaQuestionCircle,
  FaChartBar
} from "react-icons/fa"
import { searchSecurities, getCryptoPrice, getStockQuote, searchBySymbol, getApiStats } from "../utils/api"
import { debounce } from "lodash"
import { toast } from "react-toastify"

// Minimum characters required before triggering a search
const MIN_SEARCH_CHARS = 3
// Increased debounce wait time to reduce API calls
const DEBOUNCE_WAIT_MS = 1000

// Default API usage stats
const defaultApiUsage = {
  total: 0,
  search: 0,
  symbol: 0,
  alphaVantage: {
    dailyRequests: 0,
    dailyLimit: 100
  }
}

function AddStock({ onAddStock, onAddCrypto, user, guestMode, enableGuestMode }) {
  const isAuthenticated = !!user || guestMode;
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedType, setSelectedType] = useState("stocks")
  const [searchMode, setSearchMode] = useState("name") // "name" or "symbol"
  const [selectedStock, setSelectedStock] = useState(null)
  const [stockDetails, setStockDetails] = useState(null)
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem("recentSearches")
    return saved ? JSON.parse(saved) : []
  })
  const [showExchangeInfo, setShowExchangeInfo] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [searchCache, setSearchCache] = useState(new Map())
  const [apiUsage, setApiUsage] = useState(() => {
    const stats = getApiStats() || defaultApiUsage;
    // Ensure the alphaVantage property exists
    if (!stats.alphaVantage) {
      stats.alphaVantage = { dailyRequests: 0, dailyLimit: 100 };
    }
    return stats;
  })
  const [showApiStats, setShowApiStats] = useState(false)

  // Function to check and update search cache
  const checkSearchCache = (term) => {
    // Skip cache for very short terms
    if (term.length < MIN_SEARCH_CHARS) return null
    
    const cacheKey = term.toLowerCase().trim()
    const cachedResult = searchCache.get(cacheKey)
    
    if (cachedResult) {
      console.log(`Using cached results for "${term}"`)
      return cachedResult
    }
    
    return null
  }
  
  // Function to update the search cache
  const updateSearchCache = (term, results) => {
    const cacheKey = term.toLowerCase().trim()
    // Clone the map to trigger a state update
    const updatedCache = new Map(searchCache)
    updatedCache.set(cacheKey, results)
    
    // Limit cache size
    if (updatedCache.size > 50) {
      const oldestKey = Array.from(updatedCache.keys())[0]
      updatedCache.delete(oldestKey)
    }
    
    setSearchCache(updatedCache)
  }

  // Debounced search function with longer delay
  const debouncedSearch = useCallback(
    debounce(async (term) => {
      if (!term.trim() || term.length < MIN_SEARCH_CHARS) {
        setSearchResults([])
        setIsLoading(false)
        return
      }

      // Check local component cache first
      const cachedResults = checkSearchCache(term)
      if (cachedResults) {
        setSearchResults(cachedResults)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError("")

      try {
        setRetryCount(0)
        const results = await searchSecurities(term)
        setSearchResults(results.slice(0, 10))
        // Update local component cache
        updateSearchCache(term, results.slice(0, 10))
      } catch (err) {
        console.error("Search error:", err)
        setError(err.message || "Failed to search. Please try again.")
        if (!err.message.includes("rate limit")) {
          toast.error("Search failed. Please try again.")
        }
      } finally {
        setIsLoading(false)
      }
    }, DEBOUNCE_WAIT_MS),
    [searchCache]
  )

  // Effect to listen for API retry events in the console
  useEffect(() => {
    const originalConsoleLog = console.log
    console.log = function(...args) {
      if (typeof args[0] === 'string' && args[0].includes('Rate limited (429). Retrying')) {
        const attemptMatch = args[0].match(/Attempt (\d+)\/(\d+)/)
        if (attemptMatch && attemptMatch[1]) {
          setRetryCount(parseInt(attemptMatch[1]))
        }
      }
      originalConsoleLog.apply(console, args)
    }
    
    return () => {
      console.log = originalConsoleLog
    }
  }, [])

  // Update API usage stats periodically
  useEffect(() => {
    const updateStats = () => {
      setApiUsage(getApiStats())
    }
    
    // Update immediately and then every 10 seconds
    updateStats()
    const interval = setInterval(updateStats, 10000)
    
    return () => clearInterval(interval)
  }, [])

  // Update ApiStatsInfo component to show rate limit status
  const ApiStatsInfo = () => {
    const isRateLimited = apiUsage.rateLimitReached;
    const resetTime = apiUsage.rateLimitResetTime;
    
    return (
      <div className="p-4 bg-secondary rounded-xl border border-accent/10 text-sm mb-6 animate-fadeIn">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <FaChartBar className="text-accent" />
            API Usage Statistics
          </h3>
          <button
            onClick={() => setShowApiStats(false)}
            className="text-text-secondary hover:text-text-primary"
          >
            ×
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-text-secondary">
            You're using the free tier of Financial Modeling Prep API which has a limit of ~250-500 requests per day.
          </p>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="p-2 bg-primary rounded-lg">
              <p className="text-text-secondary text-xs">Total Requests</p>
              <p className="text-text-primary font-semibold">{apiUsage.total}</p>
            </div>
            <div className="p-2 bg-primary rounded-lg">
              <p className="text-text-secondary text-xs">Search Requests</p>
              <p className="text-text-primary font-semibold">{apiUsage.search}</p>
            </div>
            <div className="p-2 bg-primary rounded-lg">
              <p className="text-text-secondary text-xs">Symbol Requests</p>
              <p className="text-text-primary font-semibold">{apiUsage.symbol}</p>
            </div>
          </div>
          
          {isRateLimited && resetTime && (
            <div className="mt-3 p-3 bg-error/10 border border-error/30 rounded-lg text-error">
              <p className="font-medium">API Rate Limit Reached</p>
              <p className="text-xs mt-1">
                The API rate limit has been reached. API access will resume at approximately:
                <br />
                <span className="font-medium">{new Date(resetTime).toLocaleTimeString()}</span>
              </p>
            </div>
          )}
          
          <div className={`mt-2 text-xs py-1 px-2 rounded-md inline-block ${
            apiUsage.total > 450 ? "bg-error/20 text-error" :
            apiUsage.total > 350 ? "bg-warning/20 text-warning" :
            "bg-success/20 text-success"
          }`}>
            {apiUsage.total > 450 ? "Critical API usage - rate limiting imminent" :
             apiUsage.total > 350 ? "High API usage - be cautious" :
             "Normal API usage - no concerns"}
          </div>
        </div>
      </div>
    );
  };

  // Update the RateLimitInfo component
  const RateLimitInfo = () => {
    const isRateLimited = apiUsage.rateLimitReached;
    const resetTime = apiUsage.rateLimitResetTime;
    
    return (
      <div className="mb-6 p-4 bg-accent/5 rounded-xl border border-accent/10 animate-fadeIn">
        <div className="flex items-start gap-3">
          <FaInfoCircle className="mt-1 text-accent" />
          <div>
            <p className="text-text-primary font-medium">API Rate Limiting</p>
            <p className="text-text-secondary text-sm mt-1">
              {isRateLimited ? (
                <>
                  The API rate limit has been reached. Searches will be unavailable until approximately:
                  <br />
                  <span className="font-medium text-error">{resetTime ? new Date(resetTime).toLocaleTimeString() : "Unknown"}</span>
                </>
              ) : retryCount > 0 ? (
                <span className="text-accent font-medium">
                  Retrying automatically (attempt {retryCount}/3)...
                </span>
              ) : (
                "This app uses the Financial Modeling Prep API free tier, which has a limit on requests. If you encounter rate limit errors, please wait before trying again."
              )}
            </p>
            <button 
              onClick={() => setShowApiStats(true)}
              className="text-accent text-xs hover:underline mt-2 flex items-center gap-1"
            >
              <FaChartBar />
              View API usage statistics
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Add a check for API rate limit in the button display section
  const isApiRateLimited = apiUsage.rateLimitReached;
  
  // Update handleSearchChange to check for rate limits
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setSelectedStock(null)
    setStockDetails(null)
    
    if (isApiRateLimited) {
      setError("API rate limit reached. Please try again later.");
      return;
    }
    
    if (searchMode === "name") {
      // Only show loading state if we have minimum required characters
      if (value.trim().length >= MIN_SEARCH_CHARS) {
        // Check cache first before showing loading state
        const cachedResults = checkSearchCache(value)
        if (cachedResults) {
          setSearchResults(cachedResults)
          return
        }
        
        setIsLoading(true)
        debouncedSearch(value)
      } else {
        // Clear results if search is too short
        setSearchResults([])
        if (value.trim().length > 0 && value.trim().length < MIN_SEARCH_CHARS) {
          setError(`Please enter at least ${MIN_SEARCH_CHARS} characters to search`)
        } else {
          setError("")
        }
      }
    }
  }

  const handleSymbolSearch = async () => {
    if (!searchTerm.trim()) return
    
    // Prevent search if API rate limit is reached
    if (isApiRateLimited) {
      setError("API rate limit reached. Please try again later.");
      return;
    }
    
    // Prevent duplicate API calls if already searching
    if (isLoading) return
    
    // Convert to uppercase for consistency
    const symbolToSearch = searchTerm.toUpperCase().trim()
    
    // Check if the symbol has already been searched recently
    const isRecentSearch = recentSearches.includes(symbolToSearch)
    
    // Cache previously searched stocks to reduce API calls
    if (selectedStock && selectedStock.symbol === symbolToSearch) {
      return // Don't search again if already selected
    }

    setIsLoading(true)
    setError("")
    setRetryCount(0)

    try {
      const stockData = await searchBySymbol(symbolToSearch)
      setSelectedStock({
        symbol: stockData.symbol,
        name: stockData.name,
        exchange: stockData.exchange
      })
      setStockDetails(stockData)
      
      // Add to recent searches if not already there
      if (!isRecentSearch) {
        addToRecentSearches(stockData.symbol)
      }
    } catch (err) {
      console.error("Symbol search error:", err)
      setError(err.message || "Stock symbol not found. Please try a different symbol.")
      if (err.message.includes("rate limit") || err.message.includes("limit reached")) {
        // Don't show toast for rate limit errors - the error message is enough
      } else {
        toast.error("Stock symbol not found")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleStockSelect = async (stock) => {
    setSelectedStock(stock)
    setIsLoading(true)
    
    try {
      const stockData = await searchBySymbol(stock.symbol)
      setStockDetails(stockData)
    } catch (err) {
      console.error("Stock details error:", err)
      setError(`Failed to fetch details for ${stock.symbol}`)
      toast.error(`Failed to fetch details for ${stock.symbol}`)
    } finally {
      setIsLoading(false)
    }
  }

  const addToRecentSearches = (symbol) => {
    setRecentSearches((prev) => {
      const updated = [symbol, ...prev.filter((s) => s !== symbol)].slice(0, 5)
      localStorage.setItem("recentSearches", JSON.stringify(updated))
      return updated
    })
  }

  const handleAdd = async (item) => {
    setIsLoading(true)
    setError("")

    try {
      if (selectedType === "stocks") {
        const stockData = stockDetails || await getStockQuote(item.symbol)
        await onAddStock({
          id: item.symbol,
          symbol: item.symbol,
          name: item.name,
          price: stockData.price,
          change: stockData.change,
          volume: stockData.volume,
          marketCap: stockData.marketCap,
          pe: stockData.pe
        })
        addToRecentSearches(item.symbol)
        toast.success(`Added ${item.symbol} to your portfolio`)
      } else {
        const cryptoId = item.symbol.toLowerCase()
        const cryptoData = await getCryptoPrice(cryptoId)
        await onAddCrypto({ 
          ...item, 
          ...cryptoData,
          id: cryptoId
        })
        addToRecentSearches(item.symbol)
        toast.success(`Added ${item.symbol} to your portfolio`)
      }
      setSearchTerm("")
      setSearchResults([])
      setSelectedStock(null)
      setStockDetails(null)
    } catch (err) {
      console.error("Add error:", err)
      setError(`Failed to add ${item.symbol}. Please try again.`)
      toast.error(`Failed to add ${item.symbol}`)
    } finally {
      setIsLoading(false)
    }
  }

  const formatMarketCap = (marketCap) => {
    if (!marketCap) return "N/A"
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`
    return `$${marketCap.toLocaleString()}`
  }

  const renderExchangeInfo = () => (
    <div className="bg-primary rounded-lg p-6 mb-6 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <FaInfoCircle className="text-accent" />
          Trading Options
        </h3>
        <button
          onClick={() => setShowExchangeInfo(false)}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          ×
        </button>
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-secondary p-4 rounded-lg hover:shadow-md transition-shadow duration-200">
            <h4 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
              <FaChartLine className="text-accent" />
              US Markets
            </h4>
            <p className="text-sm text-text-secondary">
              Trade stocks from NYSE, NASDAQ, and AMEX exchanges directly through our platform.
            </p>
          </div>
          <div className="bg-secondary p-4 rounded-lg hover:shadow-md transition-shadow duration-200">
            <h4 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
              <FaGlobe className="text-accent" />
              Global Markets
            </h4>
            <p className="text-sm text-text-secondary">
              For international stocks, we recommend using Yahoo Finance or your preferred broker's platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  // render the page layout with form and search results using the high-contrast style
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-black mb-1">
              {selectedType === "stocks" ? "Add Stock" : "Add Cryptocurrency"}
            </h1>
            {guestMode && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">
                Guest Mode - Changes won't be saved
              </p>
            )}
            <p className="text-black text-sm">
              {selectedType === "stocks" 
                ? "Search for stocks by name or symbol" 
                : "Search for cryptocurrencies by name or symbol"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setSelectedType("stocks")}
              variant={selectedType === "stocks" ? "primary" : "secondary"}
              icon={<FaChartLine />}
              animated
            >
              Stocks
            </Button>
            <Button
              onClick={() => setSelectedType("cryptos")}
              variant={selectedType === "cryptos" ? "primary" : "secondary"}
              icon={<FaBitcoin />}
              animated
            >
              Crypto
            </Button>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="text-center p-8 bg-gray-50 dark:bg-gray-750 rounded-xl">
            <h3 className="text-xl font-semibold mb-3 text-black">
              Sign in to add stocks or cryptocurrencies
            </h3>
            <p className="text-black mb-6">
              Create an account or log in to start building your portfolio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate("/login")}
                variant="primary"
                size="large"
                fullWidth
                animated
              >
                Log In
              </Button>
              <Button
                onClick={() => {
                  if (window.enableGuestMode) window.enableGuestMode();
                  toast.success("Guest mode enabled. You can now add stocks without logging in.");
                }}
                variant="outline"
                size="large"
                fullWidth
                animated
              >
                Continue as Guest
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setSearchMode("name")}
                      variant={searchMode === "name" ? "primary" : "secondary"}
                      size="small"
                      animated
                    >
                      Search by Name
                    </Button>
                    <Button
                      onClick={() => setSearchMode("symbol")}
                      variant={searchMode === "symbol" ? "primary" : "secondary"}
                      size="small"
                      animated
                    >
                      Search by Symbol
                    </Button>
                  </div>
                  <Button
                    onClick={() => setShowExchangeInfo(!showExchangeInfo)}
                    variant="text"
                    icon={<FaQuestionCircle />}
                    size="small"
                  >
                    Trading Help
                  </Button>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <FormInput
                      label={searchMode === "name" ? "Search by Company Name" : "Enter Stock Symbol"}
                      placeholder={selectedType === "stocks" 
                        ? (searchMode === "name" ? "e.g. Apple, Microsoft..." : "e.g. AAPL, MSFT...")
                        : (searchMode === "name" ? "e.g. Bitcoin, Ethereum..." : "e.g. BTC, ETH...")}
                      value={searchTerm}
                      onChange={handleSearchChange}
                      icon={<FaSearch />}
                      required
                      hint={searchMode === "name" 
                        ? `Enter at least ${MIN_SEARCH_CHARS} characters to search` 
                        : "Press Enter or Search to find the symbol"}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchMode === "symbol") {
                          handleSymbolSearch()
                        }
                      }}
                    />
                  </div>
                  
                  {searchMode === "symbol" && (
                    <Button
                      onClick={handleSymbolSearch}
                      variant="primary"
                      disabled={!searchTerm.trim() || isLoading}
                      className="mt-7"
                    >
                      {isLoading ? <FaSpinner className="animate-spin" /> : "Search"}
                    </Button>
                  )}
                </div>

                {error && (
                  <div className="bg-error/10 border-2 border-error p-4 rounded-lg mt-4 text-error font-medium">
                    {error}
                    {error.includes("rate limit") && (
                      <RateLimitInfo />
                    )}
                  </div>
                )}

                <div className="mt-4 mb-2 flex justify-between items-center">
                  <div className="text-sm text-black flex items-center">
                    <button 
                      onClick={() => setShowApiStats(!showApiStats)} 
                      className={`flex items-center gap-1 hover:text-accent focus:outline-none ${isApiRateLimited ? 'text-error' : ''}`}
                      aria-label="Toggle API usage statistics"
                    >
                      <FaChartBar className={isApiRateLimited ? "text-error" : "text-black"} />
                      <span>API Usage</span>
                      <span className={`text-xs ml-1 ${isApiRateLimited ? 'text-error font-medium' : ''}`}>
                        {isApiRateLimited ? "RATE LIMITED" : `${apiUsage.alphaVantage.dailyRequests}/${apiUsage.alphaVantage.dailyLimit} calls`}
                      </span>
                    </button>
                  </div>
                  
                  {selectedType === "stocks" && (
                    <button 
                      onClick={() => setShowExchangeInfo(!showExchangeInfo)} 
                      className="text-sm text-black flex items-center gap-1 hover:text-accent focus:outline-none"
                      aria-label="Toggle exchange information"
                    >
                      <FaInfoCircle className="text-black" />
                      <span>Exchange Codes</span>
                    </button>
                  )}
                </div>
                
                {showApiStats && (
                  <div className="mt-2 mb-4">
                    <ApiStatsInfo />
                  </div>
                )}
                
                {showExchangeInfo && (
                  <div className="mt-2 mb-4">
                    {renderExchangeInfo()}
                  </div>
                )}
              </div>

              {recentSearches.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 mb-6">
                  <h2 className="text-lg font-semibold text-black mb-3">Recent Searches</h2>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map(symbol => (
                      <Button
                        key={symbol}
                        variant="ghost"
                        size="small"
                        onClick={() => {
                          setSearchTerm(symbol);
                          setSearchMode("symbol");
                          handleSymbolSearch();
                        }}
                      >
                        {symbol}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {searchMode === "name" && searchResults.length > 0 && !selectedStock && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 mb-6">
                  <h2 className="text-lg font-semibold text-black mb-3">Search Results</h2>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {searchResults.map((result) => (
                      <div 
                        key={result.symbol} 
                        className="py-3 px-2 cursor-pointer flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition duration-150"
                        onClick={() => handleStockSelect(result)}
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-black">{result.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-black">{result.symbol}</span>
                            <span className="text-xs px-2 py-1 bg-gray-200 text-black rounded-full">{result.exchange}</span>
                          </div>
                        </div>
                        <FaPlus className="text-accent" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedStock && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-black">{selectedStock.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-black font-medium">{selectedStock.symbol}</span>
                        {selectedStock.exchange && (
                          <span className="text-xs px-2 py-1 bg-gray-200 text-black rounded-full">
                            {selectedStock.exchange}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => setSelectedStock(null)}
                      variant="ghost"
                      size="small"
                    >
                      Change
                    </Button>
                  </div>

                  {stockDetails && selectedType === "stocks" && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-gray-750 p-3 rounded-lg">
                        <div className="text-sm text-black">Price</div>
                        <div className="font-semibold text-black">
                          
                            ${stockDetails.price ? stockDetails.price.toFixed(2) : "N/A"}
                          
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-750 p-3 rounded-lg">
                        <div className="text-sm text-black">Market Cap</div>
                        <div className="font-semibold text-black">
                          {stockDetails.marketCap ? formatMarketCap(stockDetails.marketCap) : "N/A"}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-750 p-3 rounded-lg">
                        <div className="text-sm text-black">Industry</div>
                        <div className="font-semibold text-black">
                          {stockDetails.industry || "N/A"}
                        </div>
                      </div>
                      {stockDetails.peRatio && (
                        <div className="bg-gray-50 dark:bg-gray-750 p-3 rounded-lg">
                          <div className="text-sm text-black">P/E Ratio</div>
                          <div className="font-semibold text-black">
                            {stockDetails.peRatio.toFixed(2)}
                          </div>
                        </div>
                      )}
                      {stockDetails.dividendYield && (
                        <div className="bg-gray-50 dark:bg-gray-750 p-3 rounded-lg">
                          <div className="text-sm text-black">Dividend Yield</div>
                          <div className="font-semibold text-black">
                            {(stockDetails.dividendYield * 100).toFixed(2)}%
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      if (selectedType === "stocks") {
                        handleAdd(selectedStock)
                      } else {
                        handleAdd({
                          id: selectedStock.symbol.toLowerCase(),
                          symbol: selectedStock.symbol,
                          name: selectedStock.name
                        })
                      }
                    }}
                    variant="primary"
                    disabled={isLoading}
                    icon={<FaPlus />}
                    fullWidth
                    animated
                  >
                    {isLoading ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      `Add ${selectedType === "stocks" ? "Stock" : "Cryptocurrency"} to Portfolio`
                    )}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AddStock
