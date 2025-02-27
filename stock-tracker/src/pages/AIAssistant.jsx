"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Button from "../components/Button"
import FormInput from "../components/FormInput"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db, auth } from "../config/firebase"
import { generateText } from "ai"
import { deepseek } from "@ai-sdk/deepseek"

function AIAssistant() {
  const [inputText, setInputText] = useState("")
  const [conversation, setConversation] = useState([])
  const [userStocks, setUserStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUserStocks = async () => {
      const user = auth.currentUser
      if (user) {
        const userRef = collection(db, "users")
        const q = query(userRef, where("uid", "==", user.uid))
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data()
          setUserStocks(userData.stocks || [])
        }
      }
      setLoading(false)
    }

    fetchUserStocks()
  }, [])

  const handleGenerateText = async () => {
    if (!inputText.trim()) return

    const newMessage = { role: "user", content: inputText }
    const updatedConversation = [...conversation, newMessage]

    setConversation(updatedConversation)
    setInputText("")
    setGenerating(true)

    try {
      const stockInfo = userStocks.map((stock) => `${stock.symbol}: ${stock.name}`).join(", ")
      const prompt = `You are a financial advisor AI assistant. The user has the following stocks in their portfolio: ${stockInfo}. Please provide advice based on this context and the user's question. User's question: ${inputText}`

      const { text } = await generateText({
        model: deepseek("deepseek-reasoner"),
        messages: [
          { role: "system", content: "You are a helpful financial advisor AI." },
          { role: "user", content: prompt },
        ],
      })

      const botMessage = { role: "assistant", content: text.trim() }
      setConversation([...updatedConversation, botMessage])
    } catch (error) {
      console.error("Error generating AI response:", error)
      let errorMessage = "I'm sorry, I encountered an error. Please try again."
      if (error.response) {
        console.error("Error response:", error.response.data)
        errorMessage += " Error details: " + JSON.stringify(error.response.data)
      }
      const botMessage = { role: "assistant", content: errorMessage }
      setConversation([...updatedConversation, botMessage])
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="text-center text-text-primary">Loading...</div>
  }

  if (!auth.currentUser) {
    return (
      <div className="p-6 max-w-2xl mx-auto bg-secondary rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-text-primary">AI Assistant</h2>
        <p className="text-text-secondary mb-4">Please log in to use the AI Assistant.</p>
        <Button onClick={() => navigate("/login")}>Log In</Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-secondary rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-text-primary">AI Assistant</h2>
      <div className="mb-4 p-4 bg-primary rounded-md text-text-primary overflow-y-auto h-64">
        {conversation.map((msg, index) => (
          <div key={index} className={`mb-2 ${msg.role === "user" ? "text-accent" : "text-text-secondary"}`}>
            <strong>{msg.role === "user" ? "You" : "Assistant"}:</strong> {msg.content}
          </div>
        ))}
        {generating && <div className="text-text-secondary">AI is thinking...</div>}
      </div>
      <FormInput
        type="text"
        id="inputText"
        name="inputText"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        label="Ask about your stocks or investment advice"
        className="mb-4"
      />
      <Button className="bg-accent text-white" onClick={handleGenerateText} disabled={generating}>
        {generating ? "Generating..." : "Send"}
      </Button>
    </div>
  )
}

export default AIAssistant

