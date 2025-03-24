import React from 'react';
import { FiChevronDown } from 'react-icons/fi';

/**
 * Select component with dark mode support
 * @param {Object} props - Component props
 * @param {string} props.id - Unique ID for the select
 * @param {string} props.name - Name of the select field
 * @param {string} [props.value] - Selected value
 * @param {function} props.onChange - Change handler
 * @param {Array} props.options - Array of option objects with value and label
 * @param {string} [props.label] - Label text
 * @param {boolean} [props.required=false] - Whether the field is required
 * @param {string} [props.className=''] - Additional classes
 */
const Select = ({
  id,
  name,
  value,
  onChange,
  options,
  label,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`
            w-full px-3 py-2 pr-10 rounded-md appearance-none
            bg-white dark:bg-gray-800 
            border border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-white
            focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 dark:focus:ring-accent/50
            disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 disabled:cursor-not-allowed
            transition-colors duration-200
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500 dark:text-gray-400">
          <FiChevronDown size={18} />
        </div>
      </div>
    </div>
  );
};

export default Select;

