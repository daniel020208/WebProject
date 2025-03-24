"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../config/firebase"
import { FiMail, FiLock, FiUser } from "react-icons/fi"
import FormInput from "../components/FormInput"
import Button from "../components/Button"
import { toast } from "react-toastify"

function Login({ enableGuestMode }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  
  const navigate = useNavigate()
  
  const validateForm = () => {
    const newErrors = {}
    if (!email.trim()) newErrors.email = "Email is required"
    if (!password) newErrors.password = "Password is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      setIsLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
      navigate("/dashboard")
      toast.success("Successfully logged in!")
    } catch (error) {
      console.error("Login error:", error)
      let errorMessage = "Failed to login. Please try again."
      
      switch (error.code) {
        case "auth/invalid-credential":
          errorMessage = "Invalid email or password."
          break
        case "auth/user-disabled":
          errorMessage = "This account has been disabled."
          break
        case "auth/too-many-requests":
          errorMessage = "Too many failed login attempts. Please try again later."
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

  const handleGuestMode = () => {
    if (enableGuestMode) {
      enableGuestMode()
      navigate("/dashboard")
      toast.success("Guest mode enabled. Your data won't be saved between sessions.")
    }
  }
  
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 border-2 border-accent/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400">Enter your credentials to access your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            id="email"
            name="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            error={errors.email}
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
            required
          />
          
          {errors.general && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
              {errors.general}
            </div>
          )}
          
          <div className="flex justify-between items-center text-sm">
            <label className="flex items-center">
              <input type="checkbox" className="form-checkbox h-4 w-4 text-accent rounded border-gray-300 focus:ring-accent" />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-accent hover:underline">Forgot Password?</Link>
          </div>
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="large"
            disabled={isLoading}
            animated
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
        
        <div className="mt-6">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-300 dark:border-gray-600 w-full"></div>
            <div className="px-4 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">or</div>
            <div className="border-t border-gray-300 dark:border-gray-600 w-full"></div>
          </div>
          
          <div className="mt-4 space-y-3">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={handleGuestMode}
              animated
            >
              Continue as Guest
            </Button>
            
            <div className="text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Don't have an account?</span>
              <Link to="/signup" className="ml-1 text-accent hover:underline">Sign up</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

