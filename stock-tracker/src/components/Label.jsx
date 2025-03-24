import React from 'react';

/**
 * Label component with required indicator support and dark mode
 * @param {Object} props - Component props
 * @param {string} props.htmlFor - ID of the form element the label is for
 * @param {string} [props.className=''] - Additional classes to apply
 * @param {boolean} [props.required=false] - Whether to show the required indicator
 * @param {React.ReactNode} props.children - Label content
 */
const Label = ({ htmlFor, className = '', required = false, children }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300 ${className}`}
    >
      {children}
      {required && <span className="text-error dark:text-error-light ml-1">*</span>}
    </label>
  );
};

export default Label;

