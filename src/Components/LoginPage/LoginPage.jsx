// src/Components/LoginPage/LoginPage.jsx
import React from 'react';
import FormContainer from '../FormContainer/FormContainer';
import './LoginPage.css';

function LoginPage() {
  return (
    <FormContainer title="Login">
      <form>
        <input type="text" placeholder="Username" required />
        <input type="password" placeholder="Password" required />
        <button type="submit">Log In</button>
      </form>
    </FormContainer>
  );
}

export default LoginPage;
