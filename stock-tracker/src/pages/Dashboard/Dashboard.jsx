import React from 'react';
import { Link } from 'react-router-dom';
import StockCard from '../../components/StockCard/StockCard';
import Button from '../../components/Button/Button';
import './Dashboard.css';

function Dashboard({ stocks, onDeleteStock }) {
  return (
    <div className="dashboard">
      <h1>Your Stock Dashboard</h1>
      
        <div className="stock-list">
          {stocks.map((stock) => (
            <StockCard key={stock.id} stock={stock} onDelete={() => onDeleteStock(stock.id)} />
          ))}
        </div>
      
    </div>
  );
}

export default Dashboard;

