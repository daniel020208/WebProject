import React from 'react';

const FormInput = ({ type, id, value, onChange, placeholder, required, label, className }) => {
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
        className={`w-full p-2 bg-primary text-text-primary border border-gray-600 rounded focus:outline-none focus:border-accent ${className}`}
      />
    </div>
  );
};

export default FormInput;

