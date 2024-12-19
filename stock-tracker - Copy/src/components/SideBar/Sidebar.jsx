import React, { useState } from 'react';
import { Home, PlusSquare, BarChart2, Bot, Settings, LogIn, User } from 'lucide-react';
import './Sidebar.css';

function Sidebar({ setCurrentPage, isAuthenticated, user }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className={`sidebar ${isOpen ? 'open' : ''}`}
         onMouseEnter={() => setIsOpen(true)}
         onMouseLeave={() => setIsOpen(false)}>
      <ul className="nav-list">
        {!isAuthenticated && (
          <li className="nav-item signin-btn">
            <button onClick={() => setCurrentPage('login')}>
              <LogIn className="icon" />
              <span>Sign In</span>
            </button>
          </li>
        )}
        {isAuthenticated && (
          <>
            <li className="nav-item">
              <button onClick={() => setCurrentPage('profile')}>
                <User className="icon" />
                <span>{user?.displayName || 'Profile'}</span>
              </button>
            </li>
            <li className="nav-item">
              <button onClick={() => setCurrentPage('home')}>
                <Home className="icon" />
                <span>Dashboard</span>
              </button>
            </li>
            <li className="nav-item">
              <button onClick={() => setCurrentPage('add-stock')}>
                <PlusSquare className="icon" />
                <span>Add Stocks</span>
              </button>
            </li>
            <li className="nav-item">
              <button onClick={() => setCurrentPage('compare-stocks')}>
                <BarChart2 className="icon" />
                <span>Compare Stocks</span>
              </button>
            </li>
            <li className="nav-item">
              <button onClick={() => setCurrentPage('ai-assistant')}>
                <Bot className="icon" />
                <span>Stocks Helper</span>
              </button>
            </li>
            <li className="nav-item">
              <button onClick={() => setCurrentPage('settings')}>
                <Settings className="icon" />
                <span>Settings</span>
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Sidebar;

