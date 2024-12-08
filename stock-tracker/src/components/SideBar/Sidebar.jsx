import React, { useState } from 'react';
import { FaHome, FaRobot, FaPlusSquare, FaCog, FaSignInAlt, FaSignOutAlt, FaUser } from 'react-icons/fa';
import './Sidebar.css';

function Sidebar({ setCurrentPage, setIsAuthenticated, isAuthenticated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSignIn = () => {
    setIsAuthenticated(true);
    setCurrentPage('home');
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setCurrentPage('login');
  };

  return (
    <nav className={`sidebar ${isOpen ? 'open' : ''}`}
         onMouseEnter={() => setIsOpen(true)}
         onMouseLeave={() => setIsOpen(false)}>
      <ul className="nav-list">
        {!isAuthenticated && (
          <li className="nav-item signin-btn">
            <button onClick={handleSignIn}>
              <FaSignInAlt className="icon" />
              <span>Sign In</span>
            </button>
          </li>
        )}
        {isAuthenticated && (
          <>
            <li className="nav-item">
              <button onClick={() => setCurrentPage('home')}>
                <FaHome className="icon" />
                <span>Dashboard</span>
              </button>
            </li>
            <li className="nav-item">
              <button onClick={() => setCurrentPage('add-stock')}>
                <FaPlusSquare className="icon" />
                <span>Add Stocks</span>
              </button>
            </li>
            <li className="nav-item">
              <button onClick={() => setCurrentPage('ai-assistant')}>
                <FaRobot className="icon" />
                <span>Stocks Helper</span>
              </button>
            </li>
            <li className="nav-item profile-item">
              <button onClick={() => setIsProfileOpen(!isProfileOpen)}>
                <FaUser className="icon" />
                <span>Profile</span>
              </button>
              {isProfileOpen && (
                <ul className="profile-dropdown">
                  <li>
                    <button onClick={() => setCurrentPage('settings')}>
                      <FaCog className="icon" />
                      <span>Settings</span>
                    </button>
                  </li>
                  <li>
                    <button onClick={handleSignOut}>
                      <FaSignOutAlt className="icon" />
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

