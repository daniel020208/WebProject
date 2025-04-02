"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Home, PlusSquare, BarChart2, Bot, LogIn, LogOut, User, Shield, Menu, ChevronLeft } from "lucide-react"
import { signOut } from "firebase/auth"
import { auth } from "../config/firebase"
import { FiHome, FiPlus, FiUser, FiLogOut, FiMenu, FiX, FiBarChart, FiMessageSquare, FiSettings, FiLogIn, FiUserPlus } from 'react-icons/fi'
import Button from "../components/Button"
import { FaChartLine } from "react-icons/fa"
import { FaHome as FaHomeIcon, FaUser, FaSignInAlt, FaSignOutAlt, FaBitcoin } from 'react-icons/fa'

const ADMIN_EMAIL = "daniel.golod2008@gmail.com"

function Sidebar({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthenticated = !!user

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  function isActive(path) {
    return location.pathname === path
  }

  const navItems = [
    {
      path: "/dashboard",
      name: "Dashboard",
      icon: <FiHome size={20} />,
    },
    {
      path: "/add-stock",
      name: "Add Stock",
      icon: <FiPlus size={20} />,
    },
    {
      path: "/compare-stocks",
      name: "Compare Stocks",
      icon: <FiBarChart size={20} />,
    },
    {
      path: "/ai-assistant",
      name: "AI Assistant",
      icon: <FiMessageSquare size={20} />,
    },
  ]

  if (user && user.email === ADMIN_EMAIL) {
    navItems.push({
      path: "/admin",
      name: "Admin",
      icon: <FiSettings size={20} />,
    })
  }

  function toggleSidebar() {
    setIsOpen(!isOpen)
  }

  async function handleSignOut() {
    try {
      await signOut(auth)
      navigate("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  function handleLoginClick() {
    navigate('/login')
  }

  function handleSignupClick() {
    navigate('/signup')
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile toggle button */}
      <button
        className="fixed top-4 left-4 z-30 md:hidden p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={toggleSidebar}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      <nav
        className={`fixed top-0 left-0 h-full shadow-lg bg-white dark:bg-gray-800 z-30 transition-all duration-300
          ${isOpen ? "w-64" : "w-16"} 
          ${isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}`}
        onMouseEnter={() => !isMobile && setIsOpen(true)}
        onMouseLeave={() => !isMobile && setIsOpen(false)}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-center items-center h-16 border-b border-gray-200 dark:border-gray-700 relative">
            <h1 className={`font-bold text-accent transition-opacity duration-200 ${isOpen ? "text-xl opacity-100" : "text-xl opacity-0 absolute"}`}>
              StockTracker
            </h1>
            <span className={`text-2xl font-bold text-accent transition-opacity duration-200 ${isOpen ? "opacity-0 absolute" : "opacity-100"}`}>
              ST
            </span>
          </div>

          <div className="flex-1 py-4 overflow-y-auto scrollbar-thin">
            <ul className="space-y-1 px-2">
              {navItems.map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive(item.path) 
                        ? "bg-accent/10 text-accent font-medium border-l-2 border-accent" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => isMobile && setIsOpen(false)}
                  >
                    <span className={`flex-shrink-0 ${isActive(item.path) ? "text-accent" : ""}`}>{item.icon}</span>
                    <span className={`ml-4 transition-all duration-200 whitespace-nowrap overflow-hidden ${isOpen ? "opacity-100 max-w-xs" : "opacity-0 max-w-0"}`}>
                      {item.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className={`flex items-center px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ${
                    isActive("/profile") 
                      ? "bg-accent/10 text-accent font-medium border-l-2 border-accent" 
                      : ""
                  }`}
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <FiUser size={20} className="flex-shrink-0" />
                  <span className={`ml-4 transition-all duration-200 whitespace-nowrap overflow-hidden ${isOpen ? "opacity-100 max-w-xs" : "opacity-0 max-w-0"}`}>
                    Profile
                  </span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200"
                >
                  <FiLogOut size={20} className="flex-shrink-0" />
                  <span className={`ml-4 transition-all duration-200 whitespace-nowrap overflow-hidden ${isOpen ? "opacity-100 max-w-xs" : "opacity-0 max-w-0"}`}>
                    Sign Out
                  </span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <FiLogIn size={20} className="flex-shrink-0" />
                  <span className={`ml-4 transition-all duration-200 whitespace-nowrap overflow-hidden ${isOpen ? "opacity-100 max-w-xs" : "opacity-0 max-w-0"}`}>
                    Log In
                  </span>
                </Link>

                <Link
                  to="/signup"
                  className="flex items-center px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <FiUserPlus size={20} className="flex-shrink-0" />
                  <span className={`ml-4 transition-all duration-200 whitespace-nowrap overflow-hidden ${isOpen ? "opacity-100 max-w-xs" : "opacity-0 max-w-0"}`}>
                    Sign Up
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

export default Sidebar

