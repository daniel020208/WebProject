import React from 'react';

/**
 * Button component with various styles and variants
 * @param {Object} props - Component props
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, outline, text, success, danger)
 * @param {string} [props.size='md'] - Button size (sm, md, lg)
 * @param {boolean} [props.fullWidth=false] - Whether the button should take full width
 * @param {boolean} [props.isLoading=false] - Whether the button is in loading state
 * @param {boolean} [props.animated=false] - Whether to apply hover animation effect
 * @param {React.ReactNode} [props.icon=null] - Optional icon to display 
 * @param {string} [props.iconPosition='left'] - Position of the icon ('left' or 'right')
 * @param {string} [props.className=''] - Additional classes to apply
 * @param {React.ReactNode} props.children - Button content
 * @param {Object} rest - Any other props to pass to the button element
 */
const Button = ({ 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  animated = false,
  icon = null,
  iconPosition = 'left',
  className = '',
  children,
  ...rest
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4',
    lg: 'py-3 px-6 text-lg',
  };

  // Variant classes with dark mode support
  const variantClasses = {
    primary: 'bg-accent hover:bg-accent-dark dark:bg-accent-dark dark:hover:bg-accent text-white font-medium shadow-sm hover:shadow focus:ring-2 focus:ring-accent/50 dark:focus:ring-accent/70',
    secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium shadow-sm hover:shadow focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500',
    outline: 'bg-transparent border border-accent text-accent dark:text-accent-light hover:bg-accent/10 dark:hover:bg-accent/20 focus:ring-2 focus:ring-accent/30',
    text: 'bg-transparent text-accent dark:text-accent-light hover:bg-accent/10 dark:hover:bg-accent/20 focus:ring-2 focus:ring-accent/30',
    success: 'bg-success hover:bg-success-dark dark:bg-success-dark dark:hover:bg-success text-white font-medium shadow-sm hover:shadow focus:ring-2 focus:ring-success/50',
    danger: 'bg-error hover:bg-error-dark dark:bg-error-dark dark:hover:bg-error text-white font-medium shadow-sm hover:shadow focus:ring-2 focus:ring-error/50',
  };

  // Animation class for hover scaling effect
  const animationClass = animated ? 'transform transition-transform hover:scale-105' : '';
  
  // Icon spacing
  const hasIcon = icon !== null;
  const iconSpacing = hasIcon ? (iconPosition === 'left' ? 'flex items-center gap-2' : 'flex flex-row-reverse items-center gap-2') : '';

  return (
    <button
      className={`
        ${sizeClasses[size] || sizeClasses.md}
        ${variantClasses[variant] || variantClasses.primary}
        ${fullWidth ? 'w-full' : ''}
        ${animationClass}
        ${iconSpacing}
        rounded-md transition-all duration-200 ease-in-out focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed
        ${className}
      `}
      disabled={isLoading || rest.disabled}
      {...rest}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
          <span>Loading...</span>
        </div>
      ) : (
        <>
          {hasIcon && icon}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;

