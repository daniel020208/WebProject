import { useState, useEffect } from "react"
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "./config/firebase"
import { getUserStocks, getUserCryptos, saveUserStocks, saveUserCryptos } from "./utils/firestore"
import Sidebar from "./components/Sidebar"
import Dashboard from "./pages/Dashboard"
import AddStock from "./pages/AddStock"
import CompareStocks from "./pages/CompareStocks"
import AIAssistant from "./pages/AIAssistant"
import Profile from "./pages/Profile"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import AdminDashboard from "./pages/AdminDashboard"

const API_KEY = import.meta.env.VITE_FINANCIAL_MODELING_PREP_API_KEY

const defaultStocks = [{ id: 1, name: "Microsoft", symbol: "MSFT", price: 300, change: 1.2, volume: 1000000 }]

const defaultCryptos = [{ id: 1, name: "Bitcoin", symbol: "BTC", price: 45000, change: 2.5, volume: 500000 }]

function App() {
  const [user, setUser] = useState(null)
  const [stocks, setStocks] = useState(defaultStocks)
  const [cryptos, setCryptos] = useState(defaultCryptos)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userStocks = await getUserStocks(user.uid)
          const userCryptos = await getUserCryptos(user.uid)
          setStocks(userStocks.length ? userStocks : defaultStocks)
          setCryptos(userCryptos.length ? userCryptos : defaultCryptos)
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      } else {
        setStocks(defaultStocks)
        setCryptos(defaultCryptos)
      }
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleDeleteStock = async (stockId) => {
    if (user) {
      const updatedStocks = stocks.filter((stock) => stock.id !== stockId)
      setStocks(updatedStocks)
      await saveUserStocks(user.uid, updatedStocks)
    }
  }

  const handleDeleteCrypto = async (cryptoId) => {
    if (user) {
      const updatedCryptos = cryptos.filter((crypto) => crypto.id !== cryptoId)
      setCryptos(updatedCryptos)
      await saveUserCryptos(user.uid, updatedCryptos)
    }
  }

  const handleAddStock = async (newStock) => {
    if (user) {
      const updatedStocks = [...stocks, newStock]
      setStocks(updatedStocks)
      await saveUserStocks(user.uid, updatedStocks)
    } else {
      setStocks([...stocks, newStock])
    }
  }

  const handleAddCrypto = async (newCrypto) => {
    if (user) {
      const updatedCryptos = [...cryptos, newCrypto]
      setCryptos(updatedCryptos)
      await saveUserCryptos(user.uid, updatedCryptos)
    } else {
      setCryptos([...cryptos, newCrypto])
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Router>
      <div className="flex bg-background min-h-screen">
        <Sidebar isAuthenticated={!!user} user={user} />
        <main className="flex-grow p-6 ml-20 transition-all duration-300 ease-in-out">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
              <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/dashboard" />} />
              <Route path="/profile" element={<Profile user={user} />} />
              <Route
                path="/dashboard"
                element={
                  <Dashboard
                    stocks={stocks}
                    cryptos={cryptos}
                    onDeleteStock={handleDeleteStock}
                    onDeleteCrypto={handleDeleteCrypto}
                    user={user}
                    isAuthenticated={!!user}
                  />
                }
              />
              <Route
                path="/add-stock"
                element={
                  <AddStock
                    onAddStock={handleAddStock}
                    onAddCrypto={handleAddCrypto}
                    user={user}
                    isAuthenticated={!!user}
                  />
                }
              />
              <Route
                path="/compare-stocks"
                element={<CompareStocks stocks={stocks} cryptos={cryptos} user={user} isAuthenticated={!!user} />}
              />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/admin" element={<AdminDashboard user={user} />} />
              <Route
                path="/"
                element={
                  <Dashboard
                    stocks={stocks}
                    cryptos={cryptos}
                    onDeleteStock={handleDeleteStock}
                    onDeleteCrypto={handleDeleteCrypto}
                    user={user}
                    isAuthenticated={!!user}
                  />
                }
              />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  )
}

export default App

