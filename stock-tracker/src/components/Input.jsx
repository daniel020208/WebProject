import React from 'react';

/**
 * Input component with dark mode support
 * @param {Object} props - Component props
 * @param {string} [props.type='text'] - Input type
 * @param {string} [props.className=''] - Additional classes to apply
 */
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
        className={`
          w-full px-3 py-2 rounded-md 
          bg-white dark:bg-gray-800 
          border border-gray-300 dark:border-gray-600
          text-gray-900 dark:text-white
          placeholder:text-gray-500 dark:placeholder:text-gray-400
          focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 dark:focus:ring-accent/50
          disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 disabled:cursor-not-allowed
          transition-colors duration-200
          ${className}
        `}
      />
    </div>
  );
};

export default Input;

