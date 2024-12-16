import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { getUserStocks, saveUserStocks } from './utils/firestore';
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import AddStock from './components/AddStock/AddStock';
import CompareStocks from './components/CompareStocks/CompareStocks';
import AIAssistant from './components/AIAssistant/AIAssistant';
import Settings from './components/Settings/Settings';
import Sidebar from './components/Sidebar/Sidebar';
import './App.css';

const defaultStock = { id: 'default', symbol: 'MSFT', name: 'Microsoft Corporation' };

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [stocks, setStocks] = useState([defaultStock]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        setCurrentPage('home');
        try {
          const userStocks = await getUserStocks(user.uid);
          setStocks(userStocks.length > 0 ? userStocks : [defaultStock]);
        } catch (error) {
          console.error('Error fetching user stocks:', error);
          setStocks([defaultStock]);
        }
      } else {
        setCurrentPage('login');
        setStocks([defaultStock]);
      }
    });

    return () => unsubscribe();
  }, []);

  function handleAddStock(newStock) {
    if (user && !stocks.some(stock => stock.symbol === newStock.symbol)) {
      const stockWithId = { id: Date.now().toString(), ...newStock };
      const updatedStocks = [...stocks, stockWithId];
      setStocks(updatedStocks);
      saveUserStocks(user.uid, updatedStocks)
        .then(() => setCurrentPage('home'))
        .catch(error => console.error('Error saving new stock:', error));
    }
  }

  function handleDeleteStock(stockId) {
    if (user) {
      const updatedStocks = stocks.filter(stock => stock.id !== stockId);
      setStocks(updatedStocks.length > 0 ? updatedStocks : [defaultStock]);
      saveUserStocks(user.uid, updatedStocks)
        .catch(error => console.error('Error deleting stock:', error));
    }
  }

  function handleReorderStocks(reorderedStocks) {
    setStocks(reorderedStocks);
    if (user) {
      saveUserStocks(user.uid, reorderedStocks)
        .catch(error => console.error('Error saving reordered stocks:', error));
    }
  }

  function renderPage() {
    switch (currentPage) {
      case 'home':
        return <Dashboard stocks={stocks} onDeleteStock={handleDeleteStock} onReorderStocks={handleReorderStocks} />;
      case 'add-stock':
        return <AddStock onAddStock={handleAddStock} />;
      case 'compare-stocks':
        return <CompareStocks stocks={stocks} />;
      case 'ai-assistant':
        return <AIAssistant />;
      case 'settings':
        return <Settings />;
      case 'login':
        return <Login setCurrentPage={setCurrentPage} />;
      case 'signup':
        return <Signup setCurrentPage={setCurrentPage} />;
      default:
        return <Dashboard stocks={stocks} onDeleteStock={handleDeleteStock} onReorderStocks={handleReorderStocks} />;
    }
  }

  return (
    <div className="app-container">
      <Sidebar
        setCurrentPage={setCurrentPage}
        isAuthenticated={!!user}
        user={user}
      />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;

