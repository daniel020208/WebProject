"use client"

import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

/**
 * FormInput component with label, validation, and optional password toggle
 * @param {Object} props - Component props
 * @param {string} props.id - Unique ID for the input
 * @param {string} props.name - Name of the input field
 * @param {string} props.label - Label text
 * @param {string} [props.type='text'] - Input type
 * @param {string} [props.value=''] - Input value
 * @param {function} props.onChange - Change handler
 * @param {function} [props.onBlur] - Blur handler for validation
 * @param {string} [props.placeholder=''] - Placeholder text
 * @param {string} [props.error=''] - Error message
 * @param {string} [props.hint=''] - Hint text
 * @param {boolean} [props.required=false] - Whether the field is required
 * @param {boolean} [props.disabled=false] - Whether the field is disabled
 * @param {string} [props.className=''] - Additional classes
 * @param {ReactNode} [props.icon] - Icon to display in the input
 */
const FormInput = ({
  id,
  name,
  label,
  type = 'text',
  value = '',
  onChange,
  onBlur,
  placeholder = '',
  error = '',
  hint = '',
  required = false,
  disabled = false,
  className = '',
  icon = null,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

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
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        
        {type === 'textarea' ? (
          <textarea
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur && onBlur(e);
            }}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full ${icon ? 'pl-10' : 'px-4'} py-2 rounded-md 
              bg-white dark:bg-gray-800 
              border ${error ? 'border-error' : isFocused ? 'border-accent' : 'border-gray-300 dark:border-gray-600'} 
              text-gray-900 dark:text-white
              placeholder:text-gray-500 dark:placeholder:text-gray-400
              focus:outline-none focus:ring-2 ${error ? 'focus:ring-error/30' : 'focus:ring-accent/30 dark:focus:ring-accent/50'}
              disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 disabled:cursor-not-allowed
              transition-colors duration-200
              min-h-[100px] resize-y
            `}
            required={required}
            {...(type !== 'textarea' ? rest : {})}
          />
        ) : (
          <input
            id={id}
            name={name}
            type={inputType}
            value={value}
            onChange={onChange}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur && onBlur(e);
            }}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full ${icon ? 'pl-10' : 'px-4'} py-2 rounded-md 
              bg-white dark:bg-gray-800 
              border ${error ? 'border-error' : isFocused ? 'border-accent' : 'border-gray-300 dark:border-gray-600'} 
              text-gray-900 dark:text-white
              placeholder:text-gray-500 dark:placeholder:text-gray-400
              focus:outline-none focus:ring-2 ${error ? 'focus:ring-error/30' : 'focus:ring-accent/30 dark:focus:ring-accent/50'}
              disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500 disabled:cursor-not-allowed
              transition-colors duration-200
              ${type === 'password' ? 'pr-10' : ''}
            `}
            required={required}
            {...rest}
          />
        )}
        
        {type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-error dark:text-error-light" id={`${id}-error`}>{error}</p>
      )}
      
      {!error && hint && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400" id={`${id}-hint`}>{hint}</p>
      )}
    </div>
  );
};

export default FormInput;

