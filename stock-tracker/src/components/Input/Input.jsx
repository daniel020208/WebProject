import React from 'react';
import './Input.css';

const Input = ({ type = 'text', id, value, onChange, placeholder, required = false, className = '', label }) => {
  return (
    <div className="input-group">
      {label && <label htmlFor={id}>{label}</label>}
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`input ${className}`}
      />
    </div>
  );
};

export default Input;

