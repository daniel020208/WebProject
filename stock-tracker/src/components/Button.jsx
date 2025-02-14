function Button({ children, onClick, type = "button", disabled = false, className = "", variant = "primary" }) {
  const baseClasses = "px-4 py-2 rounded-md font-semibold text-sm transition-all duration-200 ease-in-out"
  const variantClasses = {
    primary: "bg-accent text-white hover:bg-opacity-90",
    secondary: "bg-secondary text-text-primary hover:bg-opacity-90",
    outline: "bg-transparent border border-accent text-accent hover:bg-accent hover:text-white",
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  )
}

export default Button

