import React, { useState } from 'react';
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import AddStock from './components/AddStock/AddStock';
import CompareStocks from './components/CompareStocks/CompareStocks';
import AIAssistant from './components/AIAssistant/AIAssistant';
import Settings from './components/Settings/Settings';
import Sidebar from './components/SideBar/Sidebar';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stocks, setStocks] = useState([
    { id: 'default', symbol: 'MSFT', name: 'Microsoft Corporation' }
  ]);

  function handleSkipAuth() {
    setIsAuthenticated(true);
    setCurrentPage('home');
  }

  function handleAddStock(newStock) {
    console.log("Adding new stock:", newStock);
    if (!stocks.some(stock => stock.symbol === newStock.symbol)) {
      const stockWithId = { id: Date.now().toString(), ...newStock };
      setStocks(prevStocks => [...prevStocks, stockWithId]);
      console.log("Stock added successfully:", stockWithId);
      setCurrentPage('home');
    } else {
      console.log("Stock already exists");
    }
  }

  function handleDeleteStock(stockId) {
    setStocks(prevStocks => prevStocks.filter(stock => stock.id !== stockId));
  }

  function renderPage() {
    switch (currentPage) {
      case 'home':
        return <Dashboard stocks={stocks} onDeleteStock={handleDeleteStock} />;
      case 'add-stock':
        return <AddStock onAddStock={handleAddStock} />;
      case 'compare-stocks':
        return <CompareStocks stocks={stocks} />;
      case 'ai-assistant':
        return <AIAssistant />;
      case 'settings':
        return <Settings />;
      case 'login':
        return <Login setIsAuthenticated={setIsAuthenticated} setCurrentPage={setCurrentPage} />;
      case 'signup':
        return <Signup setIsAuthenticated={setIsAuthenticated} setCurrentPage={setCurrentPage} />;
      default:
        return <Dashboard stocks={stocks} onDeleteStock={handleDeleteStock} />;
    }
  }

  return (
    <div className="app-container">
      <Sidebar
        setIsAuthenticated={setIsAuthenticated}
        setCurrentPage={setCurrentPage}
        isAuthenticated={isAuthenticated}
      />
      <main className="main-content">
        {renderPage()}
        {!isAuthenticated && (
          <button onClick={handleSkipAuth} className="skip-auth-button">
            Skip Authentication
          </button>
        )}
      </main>
    </div>
  );
}

export default App;

