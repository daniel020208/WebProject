import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useNavigate, Link } from 'react-router-dom';
import FormInput from '../../components/FormInput/FormInput';
import Button from '../../components/Button/Button';
import './Signup.css';

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !displayName) {
      setError("Email, password, confirm password, and display name are required.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: displayName });

      await setDoc(doc(db, 'users', user.uid), {
        email,
        displayName,
        phoneNumber: phoneNumber || null,
        createdAt: new Date().toISOString()
      });

      navigate('/dashboard');
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered. Please login instead.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/weak-password':
          setError('Please choose a stronger password.');
          break;
        default:
          setError(`An error occurred during signup: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Sign Up</h2>
      <form onSubmit={handleSignUp}>
        <FormInput
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          label="Email"
          className={error && !email ? 'error' : ''}
        />
        <FormInput
          type={showPassword ? 'text' : 'password'}
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min. 6 characters)"
          required
          label="Password"
          className={error && (!password || password.length < 6) ? 'error' : ''}
        />
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            <span>Show Password</span>
          </label>
        </div>
        <FormInput
          type={showConfirmPassword ? 'text' : 'password'}
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          required
          label="Confirm Password"
          className={error && password !== confirmPassword ? 'error' : ''}
        />
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showConfirmPassword}
              onChange={() => setShowConfirmPassword(!showConfirmPassword)}
            />
            <span>Show Confirm Password</span>
          </label>
        </div>
        <FormInput
          type="text"
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display Name"
          required
          label="Display Name"
          className={error && !displayName ? 'error' : ''}
        />

        <Button type="submit" disabled={isLoading} className="submit-button">
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </Button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      <p className="auth-switch">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Signup;