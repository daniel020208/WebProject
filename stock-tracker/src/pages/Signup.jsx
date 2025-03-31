"use client"

import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { setDoc, doc } from "firebase/firestore"
import { auth, db } from "../config/firebase"
import { useNavigate, Link } from "react-router-dom"
import Button from "../components/Button"
import { toast } from 'react-toastify';

const SignupPage = ({ enableGuestMode }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !displayName.trim()) {
      setError("Email, password, confirm password, and display name are required.")
      return false
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return false
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return false
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.")
      return false
    }
    return true
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!validateForm()) {
      setIsLoading(false)
      return
    }

    try {
      // Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update the user's display name in Authentication
      await updateProfile(user, { displayName: displayName })

      // Create a user document in Firestore with the same ID as the Auth user
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid, // Add the uid field explicitly
        email,
        displayName,
        role: "user", // Default role
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        stocks: [],
        cryptos: [],
      })

      navigate("/dashboard")
    } catch (error) {
      console.error("Error during signup:", error)
      switch (error.code) {
        case "auth/email-already-in-use":
          setError("This email is already registered. Please login instead.")
          break
        case "auth/invalid-email":
          setError("Please enter a valid email address.")
          break
        case "auth/weak-password":
          setError("Please choose a stronger password.")
          break
        default:
          setError(`An error occurred during signup: ${error.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestSignup = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create a user document in Firestore with the same ID as the Auth user
      // Assuming you have a Firestore setup to save user data
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        displayName: "Guest User", // Default display name for guest users
        role: "user", // Default role
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        stocks: [],
        cryptos: [],
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error during signup:", error);
      switch (error.code) {
        case "auth/email-already-in-use":
          setError("This email is already registered. Please login instead.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/weak-password":
          setError("Please choose a stronger password.");
          break;
        default:
          setError(`An error occurred during signup: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 border-2 border-accent/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create an Account</h1>
          <p className="text-gray-600 dark:text-gray-400">Enter your details to sign up</p>
        </div>
        
        <form onSubmit={handleSignUp} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-700 text-white"
              placeholder="Enter your display name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-700 text-white"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-700 text-white"
              placeholder="Enter your password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-700 text-white"
              placeholder="Confirm your password"
            />
          </div>
          <Button onClick={handleSignUp} variant="primary" fullWidth disabled={isLoading}>
            {isLoading ? "Signing Up..." : "Sign Up"}
          </Button>
        </form>
        
        <div className="mt-4">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 hover:underline">Log In</Link>
          </p>
          <p className="text-sm text-gray-400">
            Continue without signing up?{' '}
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                if (window.enableGuestMode) window.enableGuestMode();
                toast.success("Guest mode enabled. You can now use the app without signing up.");
                navigate("/dashboard");
              }}
            >
              Continue Without Signup
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignupPage

