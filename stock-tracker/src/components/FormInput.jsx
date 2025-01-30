const FormInput = ({ type, id, name, value, onChange, label, disabled, icon, textarea }) => {
  const inputClasses =
    "w-full p-2 pl-10 border rounded bg-primary text-text-primary border-gray-600 focus:border-accent focus:outline-none"

  return (
    <div className="form-group relative">
      {label && (
        <label htmlFor={id} className="block mb-2 text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <span className="absolute inset-y-0 left-0 flex items-center pl-3">{icon}</span>}
        {textarea ? (
          <textarea
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`${inputClasses} h-24 resize-none`}
          />
        ) : (
          <input
            type={type}
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={inputClasses}
          />
        )}
      </div>
    </div>
  )
}

export default FormInput

