"use client"

import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { setDoc, doc } from "firebase/firestore"
import { auth, db } from "../config/firebase"
import { useNavigate, Link } from "react-router-dom"
import Button from "../components/Button"
import FormInput from "../components/FormInput"
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiLock } from "react-icons/fi"

const SignupPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors = {}
    
    if (!displayName.trim()) newErrors.displayName = "Display name is required"
    if (!email.trim()) newErrors.email = "Email is required"
    else if (!email.includes("@") || !email.includes(".")) newErrors.email = "Please enter a valid email address"
    
    if (!password) newErrors.password = "Password is required"
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters"
    
    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password"
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)

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
        createdAt: new Date(),
        lastLogin: new Date(),
        stocks: [],
        cryptos: [],
        stocksCount: 0,
        cryptosCount: 0
      })

      toast.success("Account created successfully!")
      navigate("/dashboard")
    } catch (error) {
      console.error("Error during signup:", error)
      let errorMessage = "Failed to create account. Please try again."
      
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email is already registered. Please login instead."
          break
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address."
          break
        case "auth/weak-password":
          errorMessage = "Please choose a stronger password."
          break
        default:
          errorMessage = error.message || errorMessage
      }
      
      toast.error(errorMessage)
      setErrors({ general: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 border-2 border-accent/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create an Account</h1>
          <p className="text-gray-600 dark:text-gray-400">Enter your details to sign up</p>
        </div>
        
        <form onSubmit={handleSignUp} className="space-y-6">
          <FormInput
            id="displayName"
            name="displayName"
            label="Display Name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            error={errors.displayName}
            icon={<FiUser size={18} className="text-gray-400" />}
            required
          />
          
          <FormInput
            id="email"
            name="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            error={errors.email}
            icon={<FiMail size={18} className="text-gray-400" />}
            required
          />
          
          <FormInput
            id="password"
            name="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            error={errors.password}
            icon={<FiLock size={18} className="text-gray-400" />}
            required
          />
          
          <FormInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            error={errors.confirmPassword}
            icon={<FiLock size={18} className="text-gray-400" />}
            required
          />
          
          {errors.general && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
              {errors.general}
            </div>
          )}
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="large"
            disabled={isLoading}
            animated
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </Button>
        </form>
        
        <div className="mt-6">
          <div className="text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Already have an account?</span>
            <Link to="/login" className="ml-1 text-accent hover:underline">Login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage

