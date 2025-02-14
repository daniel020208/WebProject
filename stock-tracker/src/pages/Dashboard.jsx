import { useState, useMemo, useEffect } from "react"
import { Link } from "react-router-dom"
import StockCard from "../Components/StockCard"
import CryptoCard from "../Components/CryptoCard"
import Button from "../components/Button"
import Input from "../components/Input"
import Label from "../components/Label"
import Select from "../components/Select"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../config/firebase"

const defaultStocks = [{ id: 1, name: "Microsoft", symbol: "MSFT", price: 300, change: 1.2, volume: 1000000 }]
const defaultCryptos = [{ id: 1, name: "Bitcoin", symbol: "BTC", price: 45000, change: 2.5, volume: 500000 }]

function Dashboard({
  stocks = defaultStocks,
  cryptos = defaultCryptos,
  onDeleteStock,
  onDeleteCrypto,
  user,
  isAuthenticated,
}) {
  const [showStocks, setShowStocks] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [userStocks, setUserStocks] = useState(stocks)
  const [userCryptos, setUserCryptos] = useState(cryptos)
  const [allUsers, setAllUsers] = useState([])

  useEffect(() => {
    setUserStocks(stocks)
    setUserCryptos(cryptos)
  }, [stocks, cryptos])

  useEffect(() => {
    const fetchAllUsers = async () => {
      if (user && user.role === "admin") {
        const usersCollection = collection(db, "users")
        const usersSnapshot = await getDocs(usersCollection)
        const usersData = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setAllUsers(usersData)
      }
    }

    fetchAllUsers()
  }, [user])

  const filteredAndSortedItems = useMemo(() => {
    const items = showStocks ? userStocks : userCryptos

    const filteredItems = items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    return filteredItems.sort((a, b) => {
      if (a.isCustom) return -1
      if (b.isCustom) return 1

      const aValue = a[sortBy]
      const bValue = b[sortBy]
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [showStocks, userStocks, userCryptos, searchQuery, sortBy, sortOrder])

  if (user && user.role === "admin") {
    return (
      <div className="space-y-8">
        <h1 className="text-4xl font-bold text-text-primary">Admin Dashboard</h1>
        <div className="bg-secondary p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-text-primary">User Management</h2>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Role</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
                <tr key={user.id}>
                  <td className="p-2">{user.displayName}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.role}</td>
                  <td className="p-2">
                    <Button>View Activity</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-text-primary">Your {showStocks ? "Stock" : "Crypto"} Dashboard</h1>
        <Link to="/add-stock">
          <Button className="bg-accent hover:bg-accent-dark text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105">
            Add New {showStocks ? "Stock" : "Crypto"}
          </Button>
        </Link>
      </div>

      {!isAuthenticated && (
        <div className="bg-primary p-4 rounded-lg text-text-primary">
          <p>You are currently using the app without an account. Sign up to save your data and access all features.</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="show-stocks" className="text-text-primary">
            Show:
          </Label>
          <Select
            id="show-stocks"
            value={showStocks ? "stocks" : "crypto"}
            onChange={(e) => setShowStocks(e.target.value === "stocks")}
          >
            <option value="stocks">Stocks</option>
            <option value="crypto">Cryptocurrencies</option>
          </Select>
        </div>

        <div className="flex-1 max-w-sm">
          <Input
            type="text"
            placeholder="Search by name or symbol"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Label htmlFor="sort-by" className="text-text-primary">
            Sort by:
          </Label>
          <Select id="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Name</option>
            <option value="symbol">Symbol</option>
            <option value="price">Price</option>
            <option value="change">Change %</option>
            <option value="volume">Volume</option>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Label htmlFor="sort-order" className="text-text-primary">
            Order:
          </Label>
          <Select id="sort-order" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1">
        {filteredAndSortedItems.map((item) =>
          showStocks ? (
            <StockCard key={item.id} stock={item} onDelete={() => onDeleteStock(item.id)} className="w-full" />
          ) : (
            <CryptoCard key={item.id} crypto={item} onDelete={() => onDeleteCrypto(item.id)} className="w-full" />
          ),
        )}
      </div>

      {filteredAndSortedItems.length === 0 && (
        <p className="text-center text-text-secondary text-lg">
          No {showStocks ? "stocks" : "cryptocurrencies"} found. Try adjusting your search or add some!
        </p>
      )}
    </div>
  )
}

export default Dashboard

