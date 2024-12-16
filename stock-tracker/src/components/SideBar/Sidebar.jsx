import React, { useState } from 'react';
import { Home, PlusSquare, BarChart2, BotIcon as Robot, Settings, LogIn, LogOut, User } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import './Sidebar.css';

function Sidebar({ setCurrentPage, isAuthenticated, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  function handleSignOut() {
    signOut(auth).then(() => {
      setCurrentPage('login');
    }).catch((error) => {
      console.error('Error signing out:', error);
    });
  }

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
            <li className="nav-item user-info">
              <User className="icon" />
              <span>{user?.displayName || 'User'}</span>
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
                <Robot className="icon" />
                <span>Stocks Helper</span>
              </button>
            </li>
            <li className="nav-item profile-item">
              <button onClick={() => setIsProfileOpen(!isProfileOpen)}>
                <User className="icon" />
                <span>Profile</span>
              </button>
              {isProfileOpen && (
                <ul className="profile-dropdown">
                  <li>
                    <button onClick={() => setCurrentPage('settings')}>
                      <Settings className="icon" />
                      <span>Settings</span>
                    </button>
                  </li>
                  <li>
                    <button onClick={handleSignOut}>
                      <LogOut className="icon" />
                      <span>Sign Out</span>
                    </button>
                  </li>
                </ul>
              )}
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Sidebar;

