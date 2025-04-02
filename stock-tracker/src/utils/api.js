import axios from "axios"
import { FMP_API_KEY, COINGECKO_API_KEY, FMP_BASE_URL, COINGECKO_BASE_URL } from "../config/apiKeys"

const RETRY_DELAY = 1000 // 1 second
const MAX_RETRIES = 3

// Simple in-memory cache
const apiCache = {
  search: new Map(),
  symbol: new Map(),
  quote: new Map(),
  history: new Map(),
  crypto: new Map(),
  
  // Get from cache with optional expiration time (in minutes)
  get(type, key, expirationMinutes = 60) {
    const cache = this[type]
    if (!cache) return null
    
    const item = cache.get(key)
    if (!item) return null
    
    // Check if cache is expired
    const now = Date.now()
    if (now - item.timestamp > expirationMinutes * 60 * 1000) {
      cache.delete(key)
      return null
    }
    
    console.log(`Cache hit for ${type}: ${key}`)
    return item.data
  },
  
  // Set cache with timestamp
  set(type, key, data) {
    const cache = this[type]
    if (!cache) return
    
    cache.set(key, {
      data,
      timestamp: Date.now()
    })
    
    // Keep cache size reasonable
    this.pruneCache(cache)
  },
  
  // Remove oldest entries if cache gets too large
  pruneCache(cache, maxSize = 100) {
    if (cache.size <= maxSize) return
    
    const entries = Array.from(cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    for (let i = 0; i < entries.length - maxSize; i++) {
      cache.delete(entries[i][0])
    }
  }
}

// API request counter to monitor usage
const apiStats = {
  requestCounts: {
    total: 0,
    search: 0,
    symbol: 0,
    quote: 0,
    profile: 0,
    crypto: 0
  },
  
  // Reset counts at midnight
  lastReset: Date.now(),
  
  // Flag to track if daily limit has been reached
  rateLimitReached: false,
  
  // Time when rate limit was reached
  rateLimitTimestamp: null,
  
  // Track a request
  trackRequest(type = 'total') {
    // Check if we need to reset (new day)
    const now = new Date()
    const lastResetDate = new Date(this.lastReset)
    
    if (now.getDate() !== lastResetDate.getDate() || 
        now.getMonth() !== lastResetDate.getMonth() || 
        now.getFullYear() !== lastResetDate.getFullYear()) {
      this.resetCounts()
    }
    
    // If rate limit was reached, check if we can resume (30-minute cooldown)
    if (this.rateLimitReached && this.rateLimitTimestamp) {
      const timeElapsed = now.getTime() - this.rateLimitTimestamp.getTime();
      const minutesElapsed = timeElapsed / (1000 * 60);
      
      if (minutesElapsed >= 30) {
        console.log("Rate limit cooldown period ended, resuming API requests");
        this.rateLimitReached = false;
        this.rateLimitTimestamp = null;
      } else {
        console.log(`Rate limit cooldown: ${Math.round(30 - minutesElapsed)} minutes remaining`);
        return false;
      }
    }
    
    // Check if we're approaching or exceeding the daily limit
    if (this.requestCounts.total >= 495) {
      console.log("API daily limit reached (495+ requests). Stopping requests for 30 minutes.");
      this.rateLimitReached = true;
      this.rateLimitTimestamp = new Date();
      return false;
    }
    
    // Update counters
    this.requestCounts.total++
    if (this.requestCounts[type]) {
      this.requestCounts[type]++
    }
    
    // Log every 5 requests
    if (this.requestCounts.total % 5 === 0) {
      console.log(`API Stats: ${JSON.stringify(this.requestCounts)}`)
    }
    
    return true
  },
  
  // Get current stats
  getStats() {
    return {
      ...this.requestCounts,
      alphaVantage: {
        dailyRequests: this.requestCounts.total,
        dailyLimit: 500
      },
      rateLimitReached: this.rateLimitReached,
      rateLimitResetTime: this.rateLimitTimestamp ? new Date(this.rateLimitTimestamp.getTime() + 30 * 60 * 1000) : null
    }
  },
  
  // Reset counts
  resetCounts() {
    this.lastReset = Date.now()
    this.rateLimitReached = false
    this.rateLimitTimestamp = null
    Object.keys(this.requestCounts).forEach(key => {
      this.requestCounts[key] = 0
    })
  }
}

// Create axios instances with retry logic
const createAxiosInstance = (baseURL, params = {}) => {
  const instance = axios.create({
    baseURL,
    params,
  })

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Check if this is a rate limit error
      if (error.response?.status === 429) {
        apiStats.rateLimitReached = true;
        apiStats.rateLimitTimestamp = new Date();
        console.log("Rate limit reached (429). Stopping requests for 30 minutes.");
      }
      
      const { config } = error
      config.retryCount = config.retryCount || 0

      if (config.retryCount >= MAX_RETRIES) {
        return Promise.reject(error)
      }

      // Don't retry if we've already hit the rate limit
      if (apiStats.rateLimitReached) {
        return Promise.reject(new Error("API daily limit reached. Try again later."))
      }

      config.retryCount += 1

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * config.retryCount))
      return instance(config)
    }
  )

  return instance
}

const fmpApi = createAxiosInstance(FMP_BASE_URL, { apikey: FMP_API_KEY })
const coingeckoApi = createAxiosInstance(COINGECKO_BASE_URL, {})

// Add headers for CoinGecko API
if (COINGECKO_API_KEY) {
  coingeckoApi.defaults.headers.common['x-cg-pro-api-key'] = COINGECKO_API_KEY;
}

// Map of common crypto symbols to their CoinGecko IDs
const cryptoIdMap = {
  'btc': 'bitcoin',
  'eth': 'ethereum',
  'usdt': 'tether',
  'usdc': 'usd-coin',
  'bnb': 'binancecoin',
  'xrp': 'ripple',
  'sol': 'solana',
  'ada': 'cardano',
  'doge': 'dogecoin',
  'trx': 'tron',
  'link': 'chainlink',
  'matic': 'matic-network',
  'dot': 'polkadot',
  'ltc': 'litecoin',
  'avax': 'avalanche-2',
  'shib': 'shiba-inu',
  'uni': 'uniswap',
  'atom': 'cosmos',
  'xlm': 'stellar',
  'etc': 'ethereum-classic'
};

// Helper function to get the correct CoinGecko ID from a symbol
const getCoinGeckoId = (symbol) => {
  // If it's already using the full format, return as is
  if (symbol.includes('-') || symbol.length > 5) {
    return symbol.toLowerCase();
  }
  
  // Check the mapping
  return cryptoIdMap[symbol.toLowerCase()] || symbol.toLowerCase();
};

// Helper function to validate API response
const validateResponse = (response, errorMessage) => {
  if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
    throw new Error(errorMessage)
  }
  return response.data
}

// Stock API functions
export const getStockQuote = async (symbol) => {
  try {
    // Check cache first
    const cachedData = apiCache.get('quote', symbol, 5) // expire after 5 minutes
    if (cachedData) {
      return cachedData
    }
    
    // Check if rate limit has been reached
    if (apiStats.rateLimitReached) {
      throw new Error("API daily limit reached. Try again later.")
    }
    
    // Track this API request
    if (!apiStats.trackRequest('quote')) {
      throw new Error("API daily limit reached. Try again later.")
    }
    
    const response = await fmpApi.get(`/quote/${symbol}`)
    const data = validateResponse(response, "Stock not found")

    if (Array.isArray(data) && data.length > 0) {
      const stock = data[0]
      const result = {
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change: stock.changesPercentage,
        volume: stock.volume,
        marketCap: stock.marketCap,
        pe: stock.pe,
        eps: stock.eps,
      }
      
      // Cache the result
      apiCache.set('quote', symbol, result)
      return result
    }
    throw new Error("Invalid stock data format")
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error("API access denied. Please check your API key.")
    }
    if (error.response?.status === 429) {
      apiStats.rateLimitReached = true;
      apiStats.rateLimitTimestamp = new Date();
      throw new Error("API daily limit reached. Try again in 30 minutes.")
    }
    console.error("Error fetching stock quote:", error)
    throw error
  }
}

export const getStockNews = async (symbol) => {
  try {
    // Track this API request
    apiStats.trackRequest('news')
    
    const response = await fmpApi.get(`/stock_news?tickers=${symbol}&limit=10`)
    return response.data
  } catch (error) {
    console.error("Error fetching stock news:", error)
    throw error
  }
}

export const getStockHistory = async (symbol, timeframe) => {
  try {
    // Check cache first
    const cacheKey = `${symbol}-${timeframe}`
    const cachedData = apiCache.get('history', cacheKey, 60) // expire after 60 minutes
    if (cachedData) {
      return cachedData
    }
    
    // Track this API request
    apiStats.trackRequest('history')
    
    const response = await fmpApi.get(`/historical-price-full/${symbol}`, {
      params: {
        timeseries: timeframe,
      },
    })
    const data = validateResponse(response, "Historical data not found")
    
    // Cache the result
    apiCache.set('history', cacheKey, data)
    return data
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error("API access denied. Please check your API key.")
    }
    console.error("Error fetching stock history:", error)
    throw error
  }
}

// Crypto API functions
export const getCryptoPrice = async (id) => {
  try {
    // Check cache first
    const cachedData = apiCache.get('crypto', id, 5) // expire after 5 minutes
    if (cachedData) {
      return cachedData
    }
    
    // Track this API request
    apiStats.trackRequest('crypto')
    
    const response = await coingeckoApi.get(`/simple/price`, {
      params: {
        ids: id,
        vs_currencies: "usd",
        include_24hr_vol: true,
        include_24hr_change: true,
        include_market_cap: true,
      },
    })
    const data = validateResponse(response, "Cryptocurrency not found")
    const cryptoData = data[id]
    
    const result = {
      price: cryptoData.usd,
      change: cryptoData.usd_24h_change,
      volume: cryptoData.usd_24h_vol,
      marketCap: cryptoData.usd_market_cap,
    }
    
    // Cache the result
    apiCache.set('crypto', id, result)
    return result
  } catch (error) {
    console.error("Error fetching crypto price:", error)
    throw error
  }
}

export const getCryptoHistory = async (id, days) => {
  try {
    // Get the correct CoinGecko ID
    const coinId = getCoinGeckoId(id);
    console.log(`Getting crypto history for ID: ${coinId} (original: ${id})`);
    
    // Check if the API rate limit has been reached
    if (apiStats.rateLimitReached) {
      throw new Error("API rate limit reached. Please try again later.");
    }
    
    // Check cache first
    const cacheKey = `crypto-history-${coinId}-${days}`;
    const cachedData = apiCache.get('crypto', cacheKey, 60); // 60 minute cache
    if (cachedData) {
      return cachedData;
    }
    
    // Set up request parameters
    const params = {
      vs_currency: "usd",
      days: days,
      interval: days > 90 ? "daily" : "hourly",
    };
    
    // Log the URL being requested for debugging
    console.log(`Requesting: ${COINGECKO_BASE_URL}/coins/${coinId}/market_chart with params:`, params);
    
    const response = await coingeckoApi.get(`/coins/${coinId}/market_chart`, { params });
    
    const data = validateResponse(response, "Historical data not found");
    
    // Cache the result
    apiCache.set('crypto', cacheKey, data);
    return data;
  } catch (error) {
    // Handle API errors specifically
    if (error.response) {
      console.error(`CoinGecko API error (${error.response.status}):`, error.response.data);
      
      if (error.response.status === 401) {
        throw new Error("Unauthorized: CoinGecko API key invalid or not provided");
      }
      else if (error.response.status === 429) {
        console.error("Rate limit exceeded for CoinGecko API");
        apiStats.rateLimitReached = true;
        apiStats.rateLimitTimestamp = new Date();
        throw new Error("CoinGecko API rate limit exceeded. Please try again later.");
      }
      else if (error.response.status === 400) {
        throw new Error("Bad request to CoinGecko API. Invalid parameters or coin ID.");
      }
    }
    
    // For CORS errors or other network errors
    if (error.message === 'Network Error') {
      throw new Error("Network error connecting to CoinGecko API. Please check your connection.");
    }
    
    console.error("Error fetching crypto history:", error);
    throw error;
  }
}

// Market Overview
export const getMarketOverview = async () => {
  try {
    const [marketIndexes, sectors] = await Promise.all([
      fmpApi.get("/quotes/index"),
      fmpApi.get("/stock/sectors-performance"),
    ])
    
    return {
      indexes: marketIndexes.data,
      sectors: sectors.data,
    }
  } catch (error) {
    console.error("Error fetching market overview:", error)
    throw error
  }
}

// Search functionality
export const searchSecurities = async (query, attempt = 0, maxRetries = 3, delay = 1000) => {
  try {
    // Check cache first
    const cachedData = apiCache.get('search', query.toLowerCase(), 1440) // cache for 24 hours
    if (cachedData) {
      return cachedData
    }
    
    // Check if rate limit has been reached
    if (apiStats.rateLimitReached) {
      throw new Error("API daily limit reached. Try again later.")
    }
    
    try {
      // Track this API request
      if (!apiStats.trackRequest('search')) {
        throw new Error("API daily limit reached. Try again later.")
      }
      
      const response = await fmpApi.get("/search", {
        params: {
          query,
          limit: 20,
        },
      })
      const data = validateResponse(response, "No results found")
      const results = data
        .filter((item) => {
          // Only include exchanges available in the free tier
          const validExchanges = [
            "NYSE", "NASDAQ", "AMEX", // US exchanges supported in free tier
          ]
          return validExchanges.some(ex => 
            item.exchangeShortName?.toUpperCase().includes(ex) || 
            item.stockExchange?.toUpperCase().includes(ex)
          )
        })
        .map((item) => ({
          symbol: item.symbol,
          name: item.name,
          exchange: item.exchangeShortName || item.stockExchange || "Unknown",
        }))
      
      // Cache the results
      apiCache.set('search', query.toLowerCase(), results)
      return results
    } catch (error) {
      // Handle rate limiting (429 errors) with exponential backoff
      if (error.response?.status === 429 && attempt < maxRetries) {
        console.log(`Rate limited (429). Retrying search in ${delay/1000}s... (Attempt ${attempt + 1}/${maxRetries})`)
        
        // Wait with exponential backoff before retrying
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Retry with increased delay (exponential backoff)
        return searchSecurities(query, attempt + 1, maxRetries, delay * 2)
      }
      
      // For 429 errors that have exhausted retries
      if (error.response?.status === 429) {
        apiStats.rateLimitReached = true;
        apiStats.rateLimitTimestamp = new Date();
        throw new Error("API rate limit exceeded. Try again in 30 minutes.")
      }
      
      // Other errors
      if (error.response?.status === 403) {
        throw new Error("API access denied. Please check your API key.")
      }
      
      // Re-throw the error
      throw error
    }
  } catch (error) {
    console.error("Error searching securities:", error)
    throw error
  }
}

// Symbol search functionality
export const searchBySymbol = async (symbol, attempt = 0, maxRetries = 3, delay = 1000) => {
  try {
    // Check cache first
    const cachedData = apiCache.get('symbol', symbol, 60) // expire after 60 minutes
    if (cachedData) {
      return cachedData
    }
    
    // Check if the symbol is from a supported exchange
    if (symbol.includes('.L')) {
      throw new Error("London Stock Exchange (LSE) stocks are not supported in the free tier.")
    }
    if (symbol.includes('.KS') || symbol.includes('.KQ')) {
      throw new Error("Korean Stock Exchange stocks are not supported in the free tier.")
    }
    if (symbol.includes('.T')) {
      throw new Error("Tokyo Stock Exchange stocks are not supported in the free tier.")
    }
    if (symbol.includes('.SS') || symbol.includes('.SZ')) {
      throw new Error("Chinese stock exchanges are not supported in the free tier.")
    }
    if (symbol.includes('.F') || symbol.includes('.DE')) {
      throw new Error("German stock exchanges are not supported in the free tier.")
    }

    // Check if rate limit has been reached
    if (apiStats.rateLimitReached) {
      throw new Error("API daily limit reached. Try again later.")
    }

    try {
      // Track this API request
      if (!apiStats.trackRequest('symbol')) {
        throw new Error("API daily limit reached. Try again later.")
      }
      
      const [quoteResponse, profileResponse] = await Promise.all([
        fmpApi.get(`/quote/${symbol}`),
        fmpApi.get(`/profile/${symbol}`)
      ])
      
      const quoteData = validateResponse(quoteResponse, "Stock not found")
      const profileData = validateResponse(profileResponse, "Company profile not found")
      
      if (Array.isArray(quoteData) && quoteData.length > 0) {
        const quote = quoteData[0]
        const profile = Array.isArray(profileData) ? profileData[0] : profileData
        
        const result = {
          symbol: quote.symbol,
          name: quote.name,
          price: quote.price,
          change: quote.changesPercentage,
          volume: quote.volume,
          marketCap: quote.marketCap,
          pe: quote.pe,
          exchange: profile?.exchangeShortName || quote.exchange || "Unknown",
          industry: profile?.industry || "Unknown",
          description: profile?.description || null,
          sector: profile?.sector || "Unknown",
          website: profile?.website || null,
        }
        
        // Cache the result
        apiCache.set('symbol', symbol, result)
        return result
      }
      throw new Error("Invalid stock data format")
    } catch (error) {
      // Handle rate limiting (429 errors) with exponential backoff
      if (error.response?.status === 429 && attempt < maxRetries) {
        console.log(`Rate limited (429). Retrying symbol search in ${delay/1000}s... (Attempt ${attempt + 1}/${maxRetries})`)
        
        // Wait with exponential backoff before retrying
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Retry with increased delay (exponential backoff)
        return searchBySymbol(symbol, attempt + 1, maxRetries, delay * 2)
      }
      
      // For 429 errors that have exhausted retries
      if (error.response?.status === 429) {
        apiStats.rateLimitReached = true;
        apiStats.rateLimitTimestamp = new Date();
        throw new Error("API rate limit exceeded. Try again in 30 minutes.")
      }
      
      throw error
    }
  } catch (error) {
    console.error("Error searching by symbol:", error)
    throw error
  }
}

// Export API stats for components to use
export const getApiStats = () => apiStats.getStats() 