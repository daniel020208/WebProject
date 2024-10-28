// src/Components/SignUpPage/SignUpPage.jsx
import React from 'react';
import FormContainer from '../FormContainer/FormContainer';
import './SignUpPage.css';

function SignUpPage() {
  return (
    <FormContainer title="Sign Up">
      <form>
        <input type="text" placeholder="Username" required />
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Password" required />
        <button type="submit">Sign Up</button>
      </form>
    </FormContainer>
  );
}

export default SignUpPage;
