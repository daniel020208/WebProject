// src/Components/Sidebar/Sidebar.jsx
import React from 'react';
import './Sidebar.css';

const Sidebar = ({ isOpen, pages, onPageChange, toggleSidebar }) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <ul>       
        {pages.map((page) => (
          <li key={page.value}>
            <button onClick={() => onPageChange(page.value)}>{page.name}</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
