import React, { useState } from 'react';
import './AddStock.css';

const API_KEY = import.meta.env.VITE_FINANCIAL_MODELING_PREP_API_KEY;

function AddStock({ onAddStock }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);
  const [newStockSymbol, setNewStockSymbol] = useState('');
  const [newStockName, setNewStockName] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`https://financialmodelingprep.com/api/v3/search?query=${query}&limit=10&apikey=${API_KEY}`);
      const data = await response.json();
      if (data.length === 0) {
        setError('No results found');
      } else {
        setSearchResults(data);
        setError(null);
      }
    } catch (err) {
      setError('Error searching for stocks');
      console.error(err);
    }
  };

  const handleAddStock = (stock) => {
    onAddStock(stock);
    setQuery('');
    setSearchResults([]);
  };

  const handleAddNewStock = (e) => {
    e.preventDefault();
    if (newStockSymbol && newStockName) {
      onAddStock({ symbol: newStockSymbol.toUpperCase(), name: newStockName });
      setNewStockSymbol('');
      setNewStockName('');
    }
  };

  return (
    <div className="add-stock">
      <h2>Add New Stock</h2>
      <div className="search-section">
        <h3>Search for a Stock</h3>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a stock..."
            required
          />
          <button type="submit"className='button1'>Search</button>
        </form>
        {error && <p className="error">{error}</p>}
        {searchResults.length > 0 && (
          <ul className="search-results">
            {searchResults.map((stock) => (
              <li key={stock.symbol}>
                <span>{stock.name} ({stock.symbol})</span>
                <button onClick={() => handleAddStock(stock)} className='button1'>Add</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="manual-add-section">
        <h3>Add Stock Manually</h3>
        <form onSubmit={handleAddNewStock}>
          <input
            type="text"
            value={newStockSymbol}
            onChange={(e) => setNewStockSymbol(e.target.value)}
            placeholder="Stock Symbol (e.g., AAPL)"
            required
          />
          <input
            type="text"
            value={newStockName}
            onChange={(e) => setNewStockName(e.target.value)}
            placeholder="Stock Name (e.g., Apple Inc.)"
            required
          />
          <button type="submit"className='button1'>Add Stock</button>
        </form>
      </div>
    </div>
  );
}

export default AddStock;

