import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import './Signup.css';

function Signup({ setIsAuthenticated, setCurrentPage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store additional user info in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        displayName,
        phoneNumber,
        email
      });

      setIsAuthenticated(true);
      setCurrentPage('home');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="auth-form">
      <h2>Sign Up</h2>
      <form onSubmit={handleSignUp}>
        <input 
          type="email" 
          placeholder='Email' 
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
          required
        />
        <input 
          type="password" 
          placeholder='Password' 
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
          required
        />
        <input 
          type="text" 
          placeholder='Display Name' 
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)} 
          required
        />
        <input 
          type="tel" 
          placeholder='Phone Number' 
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)} 
        />
        <button type="submit">Sign Up</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        Already have an account? <button onClick={() => setCurrentPage('login')}>Login</button>
      </p>
    </div>
  );
}

export default Signup;

