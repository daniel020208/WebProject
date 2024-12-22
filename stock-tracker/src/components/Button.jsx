import React from 'react';

const Button = ({ children, onClick, type = 'button', disabled = false, className = '' }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 bg-accent text-white rounded hover:bg-accent-dark transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;

