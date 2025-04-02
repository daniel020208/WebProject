import React from "react"
import { FaTools, FaExclamationTriangle } from "react-icons/fa"

function AIAssistant() {
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 bg-gray-100 dark:bg-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Financial Assistant</h2>
            <p className="text-gray-500 dark:text-gray-300 mt-2">
              This feature is currently under construction
            </p>
          </div>
          <FaTools className="text-3xl text-amber-500" />
        </div>
        
        <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: "300px" }}>
          <div className="text-center">
            <FaExclamationTriangle className="text-5xl text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
              Feature Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-lg mb-6">
              We're currently working on implementing our AI Financial Assistant. 
              This feature will provide personalized financial advice and answer 
              your questions about stocks, investing, and market trends.
            </p>
            <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-amber-800 dark:text-amber-300 text-sm">
                Thank you for your patience as we build this exciting new feature!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIAssistant
