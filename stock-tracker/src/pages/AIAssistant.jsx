import React, { useState } from "react";
import Button from "../components/Button";
import FormInput from "../components/FormInput";

function AIAssistant() {
 

  
  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-white">AI Assistant</h2>
      <div className="mb-4 p-4 bg-gray-700 rounded-md text-white">
      </div>
      <FormInput
        type="text"
        id="inputText"
        name="inputText"

        label="Input Text"
        className="mb-4"
      />
      <Button className="bg-blue-500 text-white">
        Send
      </Button>
    </div>
  );
}

export default AIAssistant;

