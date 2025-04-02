import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "./config/firebase"
import { saveUserStocks, saveUserCryptos } from "./utils/firestore"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import Sidebar from "./components/Sidebar"
import ThemeToggle from "./components/ThemeToggle"
import Dashboard from "./pages/Dashboard"
import AddStock from "./pages/AddStock"
import CompareStocks from "./pages/CompareStocks"
import AIAssistant from "./pages/AIAssistant"
import Profile from "./pages/Profile"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import AdminDashboard from "./pages/AdminDashboard"
import { db } from "./config/firebase"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
// Import API keys from central configuration if needed
// import { FMP_API_KEY } from "./config/apiKeys"

const defaultStocks = [{ id: 1, name: "Microsoft", symbol: "MSFT", price: 300, change: 1.2, volume: 1000000 }]

const defaultCryptos = [{ id: "bitcoin", name: "Bitcoin", symbol: "BTC", price: 45000, change: 2.5, volume: 500000 }]

function App() {
  const [user, setUser] = useState(null)
  const [stocks, setStocks] = useState(defaultStocks)
  const [cryptos, setCryptos] = useState(defaultCryptos)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user document exists, create it if not
          const userDocRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userDocRef)
          
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              email: user.email,
              displayName: user.displayName || "",
              createdAt: new Date(),
              role: "user",
              lastLogin: new Date(),
              status: "active",
              stocksCount: 0,
              cryptosCount: 0
            })
          } else {
            // Update last login time
            await updateDoc(userDocRef, {
              lastLogin: new Date(),
              status: "active"
            })
          }
          
          // Fetch user stocks
          if (userDoc.exists() && userDoc.data().stocks) {
            setStocks(userDoc.data().stocks)
          }
          
          // Fetch user cryptos
          if (userDoc.exists() && userDoc.data().cryptos) {
            setCryptos(userDoc.data().cryptos)
          }
        } catch (error) {
          console.error("Error setting up user:", error)
        }
      } else {
        // Use default stocks and cryptos when not logged in
        setStocks(defaultStocks)
        setCryptos(defaultCryptos)
        
        // Clear comparison-related localStorage items when not logged in
        localStorage.removeItem('compareSelectedStocks');
        localStorage.removeItem('compareTimeframe');
        localStorage.removeItem('compareMetric');
      }
      setUser(user)
      setLoading(false)
      setAuthChecked(true)
    })

    return () => unsubscribe()
  }, [])

  // Initialize theme based on user preference or system settings
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const handleAddStock = async (stock) => {
    const existingStockIndex = stocks.findIndex((s) => s.symbol === stock.symbol)
    
    if (existingStockIndex !== -1) {
      const updatedStocks = [...stocks]
      updatedStocks[existingStockIndex] = stock
      setStocks(updatedStocks)
      if (user) {
        await saveUserStocks(user.uid, updatedStocks)
      }
      return
    }
    
    const newStocks = [...stocks, stock]
    setStocks(newStocks)
    
    if (user) {
      try {
        await saveUserStocks(user.uid, newStocks)
        
        // Update stocksCount in user document
        const userDocRef = doc(db, "users", user.uid)
        await updateDoc(userDocRef, {
          stocksCount: newStocks.length
        })
      } catch (error) {
        console.error("Error saving stock:", error)
      }
    }
  }

  const handleDeleteStock = async (stockId) => {
    const newStocks = stocks.filter((stock) => stock.id !== stockId)
    setStocks(newStocks)
    
    if (user) {
      try {
        await saveUserStocks(user.uid, newStocks)
        
        // Update stocksCount in user document
        const userDocRef = doc(db, "users", user.uid)
        await updateDoc(userDocRef, {
          stocksCount: newStocks.length
        })
      } catch (error) {
        console.error("Error deleting stock:", error)
      }
    }
  }

  const handleAddCrypto = async (crypto) => {
    const existingCryptoIndex = cryptos.findIndex((c) => c.id === crypto.id)
    
    if (existingCryptoIndex !== -1) {
      const updatedCryptos = [...cryptos]
      updatedCryptos[existingCryptoIndex] = crypto
      setCryptos(updatedCryptos)
      if (user) {
        await saveUserCryptos(user.uid, updatedCryptos)
      }
      return
    }
    
    const newCryptos = [...cryptos, crypto]
    setCryptos(newCryptos)
    
    if (user) {
      try {
        await saveUserCryptos(user.uid, newCryptos)
        
        // Update cryptosCount in user document
        const userDocRef = doc(db, "users", user.uid)
        await updateDoc(userDocRef, {
          cryptosCount: newCryptos.length
        })
      } catch (error) {
        console.error("Error saving crypto:", error)
      }
    }
  }

  const handleDeleteCrypto = async (cryptoId) => {
    const newCryptos = cryptos.filter((crypto) => crypto.id !== cryptoId)
    setCryptos(newCryptos)
    
    if (user) {
      try {
        await saveUserCryptos(user.uid, newCryptos)
        
        // Update cryptosCount in user document
        const userDocRef = doc(db, "users", user.uid)
        await updateDoc(userDocRef, {
          cryptosCount: newCryptos.length
        })
      } catch (error) {
        console.error("Error deleting crypto:", error)
      }
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-accent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-accent font-bold">Loading</div>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="app-container bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen transition-colors duration-300">
        <Sidebar user={user} />
        
        <main className={`main-content transition-all duration-300 ${user ? 'with-sidebar' : 'p-6'}`}>
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
          
          {authChecked && (
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
              <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
              <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
              <Route path="/profile/:id" element={<Profile user={user} />} />
              <Route 
                path="/dashboard" 
                element={
                  <Dashboard 
                    user={user} 
                    stocks={stocks}
                    cryptos={cryptos}
                    onDeleteStock={handleDeleteStock}
                    onDeleteCrypto={handleDeleteCrypto}
                  />
                } 
              />
              <Route 
                path="/add-stock" 
                element={
                  <AddStock 
                    user={user}
                    onAddStock={handleAddStock}
                    onAddCrypto={handleAddCrypto}
                  />
                } 
              />
              <Route 
                path="/compare-stocks" 
                element={
                  <CompareStocks 
                    stocks={stocks} 
                    cryptos={cryptos} 
                    user={user} 
                  />
                } 
              />
              <Route path="/ai-assistant" element={<AIAssistant user={user} />} />
              <Route 
                path="/admin" 
                element={
                  user?.email === "daniel.golod2008@gmail.com" ? 
                  <AdminDashboard user={user} /> : 
                  <Navigate to="/dashboard" />
                } 
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          )}
        </main>
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </BrowserRouter>
  )
}

export default App

