import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { isApiKeyConfigured } from "../services/openai";
import { toast } from "../components/ui/use-toast";

interface SettingsProps {
  languageId: string;
  onLanguageChange: (languageId: string) => void;
  skillLevel: string;
  onSkillLevelChange: (level: string) => void;
}

const Settings: React.FC<SettingsProps> = ({
  languageId,
  onLanguageChange,
  skillLevel,
  onSkillLevelChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  const [activeTab, setActiveTab] = useState("language");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Check if API key is already configured
    const configured = isApiKeyConfigured();
    setIsApiConfigured(configured);
    
    // Try to get the stored API key to display (masked)
    try {
      const storedKey = localStorage.getItem("openai_api_key");
      if (storedKey) {
        // Mask the API key for display
        const maskedKey = storedKey.substring(0, 3) + "..." + storedKey.substring(storedKey.length - 4);
        setApiKey(maskedKey);
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim() || apiKey.includes("...")) {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid API key",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Store the API key in localStorage
      localStorage.setItem("openai_api_key", apiKey);
      setIsApiConfigured(true);
      
      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved successfully",
        variant: "default"
      });

      // Close the dialog
      setIsOpen(false);
      
      // Reload the page to apply the new API key
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "Error Saving API Key",
        description: "There was an error saving your API key. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearApiKey = () => {
    try {
      localStorage.removeItem("openai_api_key");
      setApiKey("");
      setIsApiConfigured(false);
      
      toast({
        title: "API Key Removed",
        description: "Your OpenAI API key has been removed",
        variant: "default"
      });
      
      // Reload the page to apply the change
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error removing API key:", error);
      toast({
        title: "Error",
        description: "There was an error removing your API key",
        variant: "destructive"
      });
    }
  };

  const handleOpenDialog = () => {
    setIsOpen(true);
  };

  const handleLanguageChange = (value: string) => {
    onLanguageChange(value);
  };

  const handleSkillLevelChange = (value: string) => {
    onSkillLevelChange(value);
    
    toast({
      title: "Skill Level Updated",
      description: `Your skill level has been set to ${value}`,
      variant: "default"
    });
  };

  return (
    <>
      <Button variant="outline" onClick={handleOpenDialog} className="mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        Settings
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Configure your language learning preferences and API key.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="language">Language Settings</TabsTrigger>
              <TabsTrigger value="api">API Configuration</TabsTrigger>
            </TabsList>
            
            <TabsContent value="language" className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={languageId} onValueChange={handleLanguageChange}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="el">Greek</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Changing the language will redirect you to the home page.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="skill-level">Skill Level</Label>
                <Select value={skillLevel} onValueChange={handleSkillLevelChange}>
                  <SelectTrigger id="skill-level">
                    <SelectValue placeholder="Select your skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  This affects the complexity of the language lessons.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="api" className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">OpenAI API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder={isApiConfigured ? "API key is configured" : "sk-..."}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Your API key is stored locally in your browser and is never sent to our servers.
                  Get your API key from{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    OpenAI's website
                  </a>
                  .
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleSaveApiKey} className="flex-1" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save API Key"}
                </Button>
                
                {isApiConfigured && (
                  <Button variant="destructive" onClick={handleClearApiKey} disabled={isSaving}>
                    Clear Key
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Settings; 