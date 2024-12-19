import React from 'react';
import './FormInput.css';

const FormInput = ({ type, id, value, onChange, placeholder, required, label, className }) => {
  return (
    <div className="form-group">
      {label && <label htmlFor={id}>{label}</label>}
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`form-input ${className}`}
      />
    </div>
  );
};

export default FormInput;

