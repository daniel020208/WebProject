// src/Components/FormContainer/FormContainer.jsx
import React from 'react';
import './FormContainer.css';

const FormContainer = ({ title, children }) => {
  return (
    <div className="form-container">
      <h2>{title}</h2>
      {children}
    </div>
  );
};

export default FormContainer;
