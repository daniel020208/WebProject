import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Home, PlusSquare, BarChart2, Bot, LogIn, LogOut, User, Shield } from "lucide-react"
import { signOut } from "firebase/auth"
import { auth } from "../config/firebase"

const ADMIN_EMAIL = "daniel.golod2008@gmail.com" // Replace with your desired admin email

function Sidebar({ isAuthenticated, user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      navigate("/dashboard")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav
      className={`fixed top-0 left-0 h-screen bg-secondary transition-all duration-300 ease-in-out overflow-hidden z-10 shadow-lg ${
        isOpen ? "w-64" : "w-16"
      }`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="flex flex-col h-full py-6">
        <ul className="flex-grow space-y-2">
          <li>
            <Link
              to="/dashboard"
              className={`flex items-center px-4 py-3 text-text-primary hover:bg-primary transition duration-300 ${isActive("/dashboard") ? "bg-primary" : ""}`}
            >
              <Home className="w-6 h-6 min-w-[24px]" />
              <span className={`ml-4 ${isOpen ? "block" : "hidden"}`}>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/add-stock"
              className={`flex items-center px-4 py-3 text-text-primary hover:bg-primary transition duration-300 ${isActive("/add-stock") ? "bg-primary" : ""}`}
            >
              <PlusSquare className="w-6 h-6 min-w-[24px]" />
              <span className={`ml-4 ${isOpen ? "block" : "hidden"}`}>Add Stock</span>
            </Link>
          </li>
          <li>
            <Link
              to="/compare-stocks"
              className={`flex items-center px-4 py-3 text-text-primary hover:bg-primary transition duration-300 ${isActive("/compare-stocks") ? "bg-primary" : ""}`}
            >
              <BarChart2 className="w-6 h-6 min-w-[24px]" />
              <span className={`ml-4 ${isOpen ? "block" : "hidden"}`}>Compare Stocks</span>
            </Link>
          </li>
          <li>
            <Link
              to="/ai-assistant"
              className={`flex items-center px-4 py-3 text-text-primary hover:bg-primary transition duration-300 ${isActive("/ai-assistant") ? "bg-primary" : ""}`}
            >
              <Bot className="w-6 h-6 min-w-[24px]" />
              <span className={`ml-4 ${isOpen ? "block" : "hidden"}`}>AI Assistant</span>
            </Link>
          </li>
          {isAuthenticated && (
            <li>
              <Link
                to="/profile"
                className={`flex items-center px-4 py-3 text-text-primary hover:bg-primary transition duration-300 ${isActive("/profile") ? "bg-primary" : ""}`}
              >
                <User className="w-6 h-6 min-w-[24px]" />
                <span className={`ml-4 ${isOpen ? "block" : "hidden"}`}>Profile</span>
              </Link>
            </li>
          )}
          {user && user.email === ADMIN_EMAIL && (
            <li>
              <Link
                to="/admin"
                className={`flex items-center px-4 py-3 text-text-primary hover:bg-primary transition duration-300 ${isActive("/admin") ? "bg-primary" : ""}`}
              >
                <Shield className="w-6 h-6 min-w-[24px]" />
                <span className={`ml-4 ${isOpen ? "block" : "hidden"}`}>Admin</span>
              </Link>
            </li>
          )}
        </ul>
        <div className="mt-auto">
          {isAuthenticated ? (
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-3 text-text-primary hover:bg-primary transition duration-300"
            >
              <LogOut className="w-6 h-6 min-w-[24px]" />
              <span className={`ml-4 ${isOpen ? "block" : "hidden"}`}>Sign Out</span>
            </button>
          ) : (
            <Link
              to="/login"
              className={`flex items-center px-4 py-3 text-text-primary hover:bg-primary transition duration-300 ${isActive("/login") ? "bg-primary" : ""}`}
            >
              <LogIn className="w-6 h-6 min-w-[24px]" />
              <span className={`ml-4 ${isOpen ? "block" : "hidden"}`}>Log In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Sidebar

