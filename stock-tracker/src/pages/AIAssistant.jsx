import React, { useState } from "react";
import Button from "../components/Button";
import FormInput from "../components/FormInput";

function AIAssistant() {
  const [inputText, setInputText] = useState("");
  const [conversation, setConversation] = useState([
    { role: "system", content: "You are a helpful assistant specialized in stocks." },
  ]);

  const handleGenerateText = () => {
    const newMessage = { role: "user", content: inputText };
    const updatedConversation = [...conversation, newMessage];

    const fixedResponse = "This is a fixed response related to stocks.";

    const botMessage = { role: "assistant", content: fixedResponse };
    setConversation([...updatedConversation, botMessage]);
    setInputText("");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-white">AI Assistant</h2>
      <div className="mb-4 p-4 bg-gray-700 rounded-md text-white">
        {conversation.map((msg, index) => (
          <div key={index} className={`mb-2 ${msg.role === "user" ? "text-blue-400" : "text-green-400"}`}>
            <strong>{msg.role === "user" ? "User" : "Assistant"}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <FormInput
        type="text"
        id="inputText"
        name="inputText"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        label="Input Text"
        className="mb-4"
      />
      <Button className="bg-blue-500 text-white" onClick={handleGenerateText}>
        Send
      </Button>
    </div>
  );
}

export default AIAssistant;

