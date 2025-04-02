import React, { useState, useRef, useEffect } from "react"
import { HfInference } from "@huggingface/inference"
import Button from "../components/Button"
import FormInput from "../components/FormInput"
import { FaPaperPlane, FaSave, FaHistory } from "react-icons/fa"
import { doc, setDoc, getDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore"
import { db } from "../config/firebase"

const hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY || "")
const MODEL_ID = "HuggingFaceH4/starchat-beta" // Free, good for financial conversations

// Sample preset questions that users might ask
const PRESET_QUESTIONS = [
  "What stocks should I consider for long-term investment?",
  "How do I analyze a company's financial health?",
  "What's the difference between growth and value investing?",
  "How does inflation affect the stock market?",
  "Should I invest in ETFs or individual stocks?",
]

function AIAssistant({ user }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showHistory, setShowHistory] = useState(false)
  const [savedConversations, setSavedConversations] = useState([])
  const chatEndRef = useRef(null)

  // Load conversation history for logged-in users
  useEffect(() => {
    const loadUserConversations = async () => {
      if (!user) return
      
      try {
        const userDocRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userDocRef)
        
        if (userDoc.exists() && userDoc.data().aiConversations) {
          setSavedConversations(userDoc.data().aiConversations)
        }
      } catch (err) {
        console.error("Error loading conversation history:", err)
      }
    }
    
    loadUserConversations()
  }, [user])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)
    setError(null)

    try {
      // If we've already tried 3 times, show a more descriptive error
      if (retryCount >= 3) {
        throw new Error("Maximum retry attempts reached. The AI service might be experiencing issues.")
      }

      const response = await hf.textGeneration({
        model: MODEL_ID,
        inputs: `<|system|>You are a helpful AI assistant specializing in stock market analysis and financial advice. Always provide balanced, informative responses based on factual market knowledge.</s>
<|user|>${userMessage}</s>
<|assistant|>`,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.95,
          repetition_penalty: 1.15,
        },
      })

      const assistantMessage = response.generated_text.split("<|assistant|>")[1].trim()
      setMessages((prev) => [...prev, { role: "assistant", content: assistantMessage }])
      setRetryCount(0) // Reset retry count on success
    } catch (error) {
      console.error("Error calling AI:", error)
      setError(error.message || "An error occurred while generating a response")
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again or check your connection.",
        },
      ])
      setRetryCount((prev) => prev + 1)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePresetQuestion = (question) => {
    setInput(question)
  }

  const saveConversation = async () => {
    if (!user || messages.length === 0) return
    
    try {
      const userDocRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userDocRef)
      
      const newConversation = {
        id: Date.now().toString(),
        timestamp: Timestamp.now(),
        messages: messages,
        title: messages[0]?.content.slice(0, 50) + "..." || "Conversation"
      }
      
      if (userDoc.exists()) {
        await updateDoc(userDocRef, {
          aiConversations: arrayUnion(newConversation)
        })
      } else {
        await setDoc(userDocRef, {
          aiConversations: [newConversation]
        })
      }
      
      setSavedConversations((prev) => [...prev, newConversation])
      alert("Conversation saved successfully!")
    } catch (err) {
      console.error("Error saving conversation:", err)
      alert("Failed to save conversation. Please try again.")
    }
  }

  const loadConversation = (conversation) => {
    setMessages(conversation.messages)
    setShowHistory(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6 bg-gray-100 dark:bg-gray-700 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Financial Assistant</h2>
          <p className="text-gray-500 dark:text-gray-300 mt-2">
            Ask me anything about stocks, market analysis, or financial advice
          </p>
        </div>
        <div className="flex space-x-2">
          {user && (
            <>
              <Button 
                onClick={() => saveConversation()} 
                disabled={messages.length === 0}
                title="Save conversation"
              >
                <FaSave size={18} className="mr-2" /> Save
              </Button>
              <Button 
                onClick={() => setShowHistory(!showHistory)} 
                title="View saved conversations"
              >
                <FaHistory size={18} className="mr-2" /> History
              </Button>
            </>
          )}
        </div>
      </div>

      {showHistory && savedConversations.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your Saved Conversations</h3>
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
            {savedConversations.map((convo) => (
              <Button 
                key={convo.id}
                onClick={() => loadConversation(convo)}
                className="text-left p-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              >
                <p className="text-sm text-gray-900 dark:text-white truncate">{convo.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(convo.timestamp.toDate()).toLocaleString()}
                </p>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Preset questions */}
      {messages.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Suggested Questions</h3>
          <div className="flex flex-wrap gap-2">
            {PRESET_QUESTIONS.map((question, index) => (
              <Button 
                key={index}
                onClick={() => handlePresetQuestion(question)}
                className="text-sm p-2"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white dark:bg-gray-800">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <p>No messages yet. Start by asking a question about stocks or financial markets!</p>
            <p className="mt-2 text-sm">Or try one of the suggested questions above.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-4 bg-gray-100 dark:bg-gray-700">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="max-w-[80%] rounded-lg p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm">
              <p>Error: {error}</p>
              <p className="mt-1">Please try again or refresh the page if the problem persists.</p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-gray-100 dark:bg-gray-700">
        <div className="flex space-x-4">
          <FormInput
            type="text"
            id="inputText"
            name="inputText"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about stocks, market analysis, or financial advice..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-2 flex items-center space-x-2`}
          >
            <FaPaperPlane />
            <span>{isLoading ? "Sending..." : "Send"}</span>
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AIAssistant;
