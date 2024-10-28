// src/Components/App/App.jsx
import React, { useState } from 'react';

import Sidebar from './Components/Sidebar/Sidebar';
import LoginPage from './Components/LoginPage/LoginPage';
import SignUpPage from './Components/SignUpPage/SignUpPage';

import './index.css';




function App() {
  const [activePage, setActivePage] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const pages = [
    { name: 'Home', value: 'home' },
    { name: 'Login', value: 'login' },
    { name: 'Sign Up', value: 'signup' },
  ];

  const toggleSidebar = () => { setIsSidebarOpen(!isSidebarOpen); };

  const handlePageChange = (page) => {
    setActivePage(page);
    setIsSidebarOpen(false);
  };

  return (
    <div className={`app ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      
      <Sidebar isOpen={isSidebarOpen} pages={pages} onPageChange={handlePageChange} />
      
      <div className="content">
        {activePage === 'home' && (
          <div className="home-page">
            <h1>something</h1>
           
          </div>
        )}
        {activePage === 'login' && <LoginPage />}
        {activePage === 'signup' && <SignUpPage />}
      </div>

      <button className="toggle-sidebar-button" onClick={toggleSidebar}>
        {isSidebarOpen ? 'Close Menu' : 'Open Menu'}
      </button>
    </div>
  );
}

export default App;