import React, { useState } from 'react';
import Button from '../components/Button';
const API_KEY = import.meta.env.VITE_FINANCIAL_MODELING_PREP_API_KEY;

function AddStock({ onAddStock }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleSearch(e) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSearchResults([]);

    fetch(`https://financialmodelingprep.com/api/v3/search?query=${query}&limit=20&apikey=${API_KEY}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.length === 0) {
          setError('No results found');
        } else {
          const filteredResults = data
            .filter(stock => stock.exchangeShortName && ['NASDAQ', 'NYSE'].includes(stock.exchangeShortName))
            .sort((a, b) => {
              if (a.symbol.toLowerCase() === query.toLowerCase()) return -1;
              if (b.symbol.toLowerCase() === query.toLowerCase()) return 1;
              if (a.symbol.toLowerCase().startsWith(query.toLowerCase())) return -1;
              if (b.symbol.toLowerCase().startsWith(query.toLowerCase())) return 1;
              return a.symbol.localeCompare(b.symbol);
            })
            .slice(0, 10);

          setSearchResults(filteredResults);
        }
      })
      .catch(err => {
        console.error("Error details:", err);
        setError('Error searching for stocks: ' + err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function handleAddStock(stock) {
    fetch(`https://financialmodelingprep.com/api/v3/profile/${stock.symbol}?apikey=${API_KEY}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.length > 0) {
          const newStock = { symbol: stock.symbol, name: data[0].companyName };
          onAddStock(newStock);
          setQuery('');
          setSearchResults([]);
        } else {
          setError('No data available for this stock');
        }
      })
      .catch(err => {
        console.error("Error adding stock:", err);
        setError('Error adding stock: ' + err.message);
      });
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-secondary rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-text-primary">Add New Stock</h2>
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a stock..."
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
          {searchResults.map((stock) => (
            <li key={stock.symbol} className="border-b border-gray-700 last:border-b-0">
              <div className="flex justify-between items-center p-4">
                <span className="text-text-primary">{stock.name} ({stock.symbol})</span>
                <Button 
                  onClick={() => handleAddStock(stock)} 
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

