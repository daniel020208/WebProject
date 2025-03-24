import React, { useState, useRef, useEffect } from "react"
import { HfInference } from "@huggingface/inference"
import Button from "../components/Button"
import FormInput from "../components/FormInput"
import { FaPaperPlane } from "react-icons/fa"

const hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY || "")
const MODEL_ID = "HuggingFaceH4/starchat-beta" // Free, good for financial conversations

function AIAssistant() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef(null)

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

    try {
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
    } catch (error) {
      console.error("Error calling AI:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again or check your connection.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6 bg-gray-700">
        <h2 className="text-2xl font-bold text-white">AI Financial Assistant</h2>
        <p className="text-gray-300 mt-2">
          Ask me anything about stocks, market analysis, or financial advice. I'm here to help!
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <p>No messages yet. Start by asking a question about stocks or financial markets!</p>
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
                    : "bg-gray-700 text-white"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-4 bg-gray-700">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-6 bg-gray-700">
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
            className={`px-6 py-2 ${
              isLoading ? "bg-gray-500" : "bg-blue-500 hover:bg-blue-600"
            } text-white rounded-lg flex items-center space-x-2 transition-colors`}
          >
            <FaPaperPlane className={`${isLoading ? "opacity-50" : ""}`} />
            <span>{isLoading ? "Sending..." : "Send"}</span>
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AIAssistant;
