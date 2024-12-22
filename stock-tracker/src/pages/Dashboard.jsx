import React from 'react';
import { Link } from 'react-router-dom';
import StockCard from '../components/StockCard';
import Button from '../components/Button';

function Dashboard({ stocks, onDeleteStock }) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-text-primary">Your Stock Dashboard</h1>
        <Link to="/add-stock">
          <Button className="bg-accent hover:bg-accent-dark text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105">
            Add New Stock
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-8">
        {stocks.map((stock) => (
          <StockCard key={stock.id} stock={stock} onDelete={() => onDeleteStock(stock.id)} />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;

