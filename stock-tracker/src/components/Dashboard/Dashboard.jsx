import React from 'react';
import StockCard from '../StockCard/StockCard';
import './Dashboard.css';

function Dashboard({ stocks }) {
  return (
    <div className="dashboard">
      <h2>Your Stocks</h2>
      <div className="stock-list">
        {stocks.map(stock => (
          <StockCard key={stock.symbol} symbol={stock.symbol} name={stock.name} />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;

