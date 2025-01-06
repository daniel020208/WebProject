import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StockCard from '../Components/StockCard';
import CryptoCard from '../Components/CryptoCard';
import Button from '../Components/Button';

function Dashboard({ stocks, cryptos, onDeleteStock, onDeleteCrypto }) {
  const [showStocks, setShowStocks] = useState(true);
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-text-primary">Your Stock Dashboard</h1>
        <label className="inline-flex items-center cursor-pointer">
          <span className="mr-3 text-sm font-medium text-text-primary">Crypto</span>
          <div className="relative">
            <input type="checkbox" value="" className="sr-only peer" checked={showStocks} onChange={() => setShowStocks(!showStocks)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </div>
          <span className="ml-3 text-sm font-medium text-text-primary">Stocks</span>
        </label>
        <Link to="/add-stock">
          <Button className="bg-accent hover:bg-accent-dark text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105">
            Add New Stock
          </Button>
        </Link>
      </div>

      <div className="grid gap-8">
        {showStocks
          ? stocks.map((stock) => (
            <StockCard key={stock.id} stock={stock} onDelete={() => onDeleteStock(stock.id)} />
          ))
          : cryptos.map((crypto) => (
            <CryptoCard key={crypto.id} crypto={crypto} onDelete={() => onDeleteCrypto(crypto.id)} />
          ))}
      </div>
    </div>
  );
}

export default Dashboard;

