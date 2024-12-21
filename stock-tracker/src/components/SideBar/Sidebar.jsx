import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, PlusSquare, BarChart2, Bot, Settings, LogIn, LogOut, User } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import './Sidebar.css';

function Sidebar({ isAuthenticated, user }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);


  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className={`sidebar ${isOpen ? 'open' : ''}`}
         onMouseEnter={() => setIsOpen(true)}
         onMouseLeave={() => setIsOpen(false)}>
      <ul className="nav-list">
        {!isAuthenticated && (
          <li className="nav-item signin-btn">
            <Link to="/login">
              <LogIn className="icon" />
              <span>Sign In</span>
            </Link>
          </li>
        )}
        {isAuthenticated && (
          <>
            <li className="nav-item">
              <Link to="/profile">
                <User className="icon" />
                <span>Profile</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/dashboard">
                <Home className="icon" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/add-stock">
                <PlusSquare className="icon" />
                <span>Add Stock</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/compare-stocks">
                <BarChart2 className="icon" />
                <span>Compare Stocks</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/ai-assistant">
                <Bot className="icon" />
                <span>AI Assistant</span>
              </Link>
            </li>
            <li className="nav-item">
              <button onClick={handleSignOut}>
                <LogOut className="icon" />
                <span>Sign Out</span>
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Sidebar;

