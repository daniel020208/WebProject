import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { getUserStocks, saveUserStocks } from './utils/firestore';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AddStock from './pages/AddStock';
import CompareStocks from './pages/CompareStocks';
import AIAssistant from './pages/AIAssistant';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';

const defaultStock = { id: 'default', symbol: 'MSFT', name: 'Microsoft Corporation' };

function App() {
  const [user, setUser] = useState(null);
  const [stocks, setStocks] = useState([defaultStock]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userStocks = await getUserStocks(user.uid);
          setStocks(userStocks.length > 0 ? userStocks : [defaultStock]);
        } catch (error) {
          console.error('Error fetching user stocks:', error);
          setStocks([defaultStock]);
        } finally {
          setUser(user);
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
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
      saveUserStocks(user.id, reorderedStocks)
        .catch(error => console.error('Error saving reordered stocks:', error));
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-background text-text-primary">Loading...</div>;
  }

  return (
    <Router>
      <div className="flex bg-background min-h-screen">
        <Sidebar isAuthenticated={!!user} user={user} />
        <main className="flex-grow p-6 ml-20 transition-all duration-300 ease-in-out">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
              <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/profile" />} />
              <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
              <Route path="/dashboard" element={user ? <Dashboard stocks={stocks} onDeleteStock={handleDeleteStock} onReorderStocks={handleReorderStocks} /> : <Navigate to="/login" />} />
              <Route path="/add-stock" element={user ? <AddStock onAddStock={handleAddStock} /> : <Navigate to="/login" />} />
              <Route path="/compare-stocks" element={user ? <CompareStocks stocks={stocks} /> : <Navigate to="/login" />} />
              <Route path="/ai-assistant" element={user ? <AIAssistant /> : <Navigate to="/login" />} />
              <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;

