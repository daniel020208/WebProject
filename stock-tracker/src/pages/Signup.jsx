import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../Components/Button'; 

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
    <div className="max-w-md mx-auto mt-8 p-6 bg-secondary rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-text-primary">Sign Up</h2>
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label htmlFor="email" className="block mb-2 text-sm font-medium text-text-primary">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full p-2 border rounded bg-primary text-text-primary border-gray-600 focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-2 text-sm font-medium text-text-primary">Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min. 6 characters)"
            required
            className="w-full p-2 border rounded bg-primary text-text-primary border-gray-600 focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showPassword"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
            className="mr-2"
          />
          <label htmlFor="showPassword" className="text-text-primary">Show Password</label>
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-text-primary">Confirm Password</label>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            required
            className="w-full p-2 border rounded bg-primary text-text-primary border-gray-600 focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showConfirmPassword"
            checked={showConfirmPassword}
            onChange={() => setShowConfirmPassword(!showConfirmPassword)}
            className="mr-2"
          />
          <label htmlFor="showConfirmPassword" className="text-text-primary">Show Confirm Password</label>
        </div>
        <div>
          <label htmlFor="displayName" className="block mb-2 text-sm font-medium text-text-primary">Display Name</label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display Name"
            required
            className="w-full p-2 border rounded bg-primary text-text-primary border-gray-600 focus:border-accent focus:outline-none"
          />
        </div>
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full"
        >
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </Button>
      </form>
      {error && <p className="mt-4 text-error text-center" role="alert">{error}</p>}
      <p className="mt-4 text-center text-text-secondary">
        Already have an account? <Link to="/login" className="text-accent hover:underline">Login</Link>
      </p>
    </div>
  );
}

export default Signup;

