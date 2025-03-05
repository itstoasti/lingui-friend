import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { isApiKeyConfigured } from "../services/openai";

interface ApiKeyConfigProps {
  onApiKeyConfigured: () => void;
}

const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({ onApiKeyConfigured }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Check if API key is already configured
    const configured = isApiKeyConfigured();
    setIsConfigured(configured);
    
    // If not configured, show the dialog
    if (!configured) {
      setIsOpen(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      alert("Please enter a valid API key");
      return;
    }

    // In a real application, we would securely store this
    // For this demo, we'll use localStorage, but this is not secure for production
    localStorage.setItem("openai_api_key", apiKey);
    
    // Reload the page to apply the new API key
    window.location.href = window.location.href;
  };

  const handleOpenDialog = () => {
    setIsOpen(true);
  };

  return (
    <>
      {isConfigured ? (
        <Button variant="outline" onClick={handleOpenDialog} className="mb-4">
          Change API Key
        </Button>
      ) : (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md mb-4">
          <p>Please configure your OpenAI API key to use the language learning features.</p>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure OpenAI API Key</DialogTitle>
            <DialogDescription>
              Enter your OpenAI API key to enable the language learning features.
              You can get an API key from{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                OpenAI's website
              </a>
              .
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-2">
              Your API key is stored locally in your browser and is never sent to our servers.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiKey}>Save API Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApiKeyConfig; 