import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email || !password) {
      setError('Both email and password are required.');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (error) {
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No user found with this email. Please check your email or sign up.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address.');
          break;
        default:
          setError('An error occurred during login. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-secondary rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-text-primary">Login</h2>
      <form onSubmit={handleLogin} className="space-y-4">
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
            placeholder="Password"
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
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      {error && <p className="mt-4 text-error text-center" role="alert">{error}</p>}
      <p className="mt-4 text-center text-text-secondary">
        Don't have an account? <Link to="/signup" className="text-accent hover:underline">Sign up</Link>
      </p>
    </div>
  );
}

export default Login;

