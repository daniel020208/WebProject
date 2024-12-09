import React from 'react';
import StockCard from '../StockCard/StockCard';
import './Dashboard.css';

function Dashboard({ stocks, onDeleteStock }) {
  console.log("Stocks in Dashboard:", stocks);

  return (
    <div className="dashboard">
      <h2>Your Stocks</h2>
      <div className="stock-list">
        {stocks.map(stock => (
          <StockCard key={stock.id} stock={stock} onDelete={() => onDeleteStock(stock.id)} />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;

