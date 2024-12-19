import React, { useState } from 'react';
import './AddStock.css';

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
    <div className="add-stock">
      <h2>Add New Stock</h2>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a stock..."
          required
          disabled={isLoading}
          className="search-input"
        />
        <button type="submit" className="search-button" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {searchResults.length > 0 && (
        <ul className="search-results">
          {searchResults.map((stock) => (
            <li key={stock.symbol}>
              <span>{stock.name} ({stock.symbol})</span>
              <button onClick={() => handleAddStock(stock)} className="add-button">Add</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AddStock;

