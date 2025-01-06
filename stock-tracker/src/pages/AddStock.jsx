import React, { useState } from 'react';
import Button from '../Components/Button';

const TWELVE_DATA_API_KEY = import.meta.env.VITE_TWELVE_DATA_API_KEY;

function AddStock({ onAddStock, onAddCrypto }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCrypto, setIsCrypto] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      let results;
      if (isCrypto) {
        const response = await fetch(`https://api.coincap.io/v2/assets?search=${query}&limit=10`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data.data && data.data.length > 0) {
          setSearchResults(data.data.map(coin => ({
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
          })));
        } else {
          setError('No results found');
        }
      } else {
        const response = await fetch(`https://api.twelvedata.com/symbol_search?symbol=${query}&apikey=${TWELVE_DATA_API_KEY}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        results = data.data
          .filter(stock => stock.exchange && ['NASDAQ', 'NYSE'].includes(stock.exchange))
          .slice(0, 10)
          .map(stock => ({
            id: stock.symbol,
            symbol: stock.symbol,
            name: stock.instrument_name,
          }));
      }

      if (results && results.length === 0 && !isCrypto) {
        setError('No results found');
      } 
    } catch (err) {
      console.error("Error details:", err);
      setError(`Error searching for ${isCrypto ? 'cryptocurrencies' : 'stocks'}: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  function handleAdd(item) {
    if (isCrypto) {
      onAddCrypto(item);
    } else {
      onAddStock(item);
    }
    setQuery('');
    setSearchResults([]);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-secondary rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-text-primary">Add New {isCrypto ? 'Cryptocurrency' : 'Stock'}</h2>
      <div className="mb-4">
        <label className="inline-flex items-center cursor-pointer">
          <span className="mr-3 text-sm font-medium text-text-primary">Stocks</span>
          <div className="relative">
            <input type="checkbox" value="" className="sr-only peer" checked={isCrypto} onChange={() => setIsCrypto(!isCrypto)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </div>
          <span className="ml-3 text-sm font-medium text-text-primary">Crypto</span>
        </label>
      </div>
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search for a ${isCrypto ? 'cryptocurrency' : 'stock'}...`}
            required
            disabled={isLoading}
            className="flex-grow p-2 border border-gray-600 rounded-l-md bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <Button 
            type="submit" 
            className="bg-accent hover:bg-accent-dark text-white font-bold py-2 px-4 rounded-r-md"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </form>
      {error && <p className="text-error mb-4">{error}</p>}
      {searchResults.length > 0 && (
        <ul className="bg-primary rounded-md overflow-hidden">
          {searchResults.map((item) => (
            <li key={item.id} className="border-b border-gray-700 last:border-b-0">
              <div className="flex justify-between items-center p-4">
                <span className="text-text-primary">{item.name} ({item.symbol.toUpperCase()})</span>
                <Button 
                  onClick={() => handleAdd(item)} 
                  className="bg-accent hover:bg-accent-dark text-white font-bold py-1 px-3 rounded-md text-sm"
                >
                  Add
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AddStock;

