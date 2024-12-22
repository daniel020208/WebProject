import React from 'react';

const Input = ({ type = 'text', id, value, onChange, placeholder, required = false, className = '', label }) => {
  return (
    <div className="mb-4">
      {label && <label htmlFor={id} className="block mb-2 text-sm font-medium text-text-primary">{label}</label>}
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full p-2 border rounded bg-primary text-text-primary border-gray-600 focus:border-accent focus:outline-none ${className}`}
      />
    </div>
  );
};

export default Input;

