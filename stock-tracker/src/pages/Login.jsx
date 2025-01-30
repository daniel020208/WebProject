import { useState } from "react"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "../config/firebase"
import { useNavigate } from "react-router-dom"
import { doc, setDoc } from "firebase/firestore"
import Button from "../components/Button"
import FormInput from "../Components/FormInput"
import { Eye, EyeOff } from "lucide-react"



function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()

  const handleAuth = async (e) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        await setDoc(doc(db, "users", user.uid), {
          email,
          displayName,
          createdAt: new Date().toISOString(),
        })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      navigate("/dashboard")
    } catch (error) {
      console.error("Error during authentication:", error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword)
    } else if (field === "confirmPassword") {
      setShowConfirmPassword(!showConfirmPassword)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-secondary rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-text-primary">{isSignUp ? "Sign Up" : "Log In"}</h2>
      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <FormInput
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            label="Display Name"
            required
          />
        )}
        <FormInput
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          label="Email"
          required
        />
        <div className="relative">
          <FormInput
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            label="Password"
            required
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility("password")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-secondary"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {isSignUp && (
          <div className="relative">
            <FormInput
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              label="Confirm Password"
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirmPassword")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-secondary"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        )}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Processing..." : isSignUp ? "Sign Up" : "Log In"}
        </Button>
      </form>
      {error && (
        <p className="mt-4 text-error text-center" role="alert">
          {error}
        </p>
      )}
      <p className="mt-4 text-center text-text-secondary">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}
        <button onClick={() => setIsSignUp(!isSignUp)} className="text-accent hover:underline ml-1">
          {isSignUp ? "Log In" : "Sign Up"}
        </button>
      </p>
    </div>
  )
}

export default Login

