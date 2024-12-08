import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from './config/firebase';
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import AddStock from './components/AddStock/AddStock';
import AIAssistant from './components/AIAssistant/AIAssistant';
import Settings from './components/Settings/Settings';
import Sidebar from './components/Sidebar/Sidebar';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    const fetchStocks = async () => {
      const stocksCollection = collection(db, 'stocks');
      const stocksSnapshot = await getDocs(stocksCollection);
      const stocksList = stocksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStocks(stocksList);
    };

    if (isAuthenticated) {
      fetchStocks();
    }
  }, [isAuthenticated]);

  const handleSkipAuth = () => {
    setIsAuthenticated(true);
    setCurrentPage('home');
  };

  const handleAddStock = async (newStock) => {
    if (!stocks.some(stock => stock.symbol === newStock.symbol)) {
      const docRef = await addDoc(collection(db, 'stocks'), newStock);
      setStocks(prevStocks => [...prevStocks, { id: docRef.id, ...newStock }]);
    }
    setCurrentPage('home');
  };

  const handleDeleteStock = async (stockId) => {
    await deleteDoc(doc(db, 'stocks', stockId));
    setStocks(stocks.filter(stock => stock.id !== stockId));
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Dashboard stocks={stocks} onDeleteStock={handleDeleteStock} />;
      case 'add-stock':
        return <AddStock onAddStock={handleAddStock} />;
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
  };

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

