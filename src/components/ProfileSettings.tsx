import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/use-toast";
import { isApiKeyConfigured } from "@/services/openai";

const ProfileSettings = () => {
  const { userLevel, setUserLevel, selectedLanguage, availableLanguages, setSelectedLanguage } = useLanguage();
  const [apiKey, setApiKey] = useState("");
  const [isApiConfigured, setIsApiConfigured] = useState(false);
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

  const handleLevelChange = (value: "beginner" | "intermediate" | "advanced") => {
    setUserLevel(value);
    toast({
      title: "Settings updated",
      description: `Your proficiency level has been updated to ${value}.`,
    });
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const langId = e.target.value;
    const language = availableLanguages.find(lang => lang.id === langId);
    if (language) {
      setSelectedLanguage(language);
      toast({
        title: "Language changed",
        description: `You are now learning ${language.name}.`,
      });
    }
  };

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

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Your Learning Profile</h2>
        <p className="text-sm text-muted-foreground">
          Personalize your language learning experience
        </p>
      </div>

      <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-soft border border-gray-100 dark:border-gray-700 space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium">Language</h3>
          <div className="space-y-2">
            <Label htmlFor="language">Select the language you want to learn</Label>
            <select
              id="language"
              value={selectedLanguage?.id || ""}
              onChange={handleLanguageChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              {!selectedLanguage && <option value="">Select a language</option>}
              {availableLanguages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Proficiency Level</h3>
          <RadioGroup
            value={userLevel}
            onValueChange={(value: any) => handleLevelChange(value)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
              <RadioGroupItem value="beginner" id="beginner" />
              <Label htmlFor="beginner" className="flex-1 cursor-pointer">
                <div className="font-medium">Beginner</div>
                <div className="text-sm text-muted-foreground">
                  I'm just starting to learn this language
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
              <RadioGroupItem value="intermediate" id="intermediate" />
              <Label htmlFor="intermediate" className="flex-1 cursor-pointer">
                <div className="font-medium">Intermediate</div>
                <div className="text-sm text-muted-foreground">
                  I understand basics and can hold simple conversations
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
              <RadioGroupItem value="advanced" id="advanced" />
              <Label htmlFor="advanced" className="flex-1 cursor-pointer">
                <div className="font-medium">Advanced</div>
                <div className="text-sm text-muted-foreground">
                  I'm comfortable but want to improve fluency and vocabulary
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">OpenAI API Configuration</h3>
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder={isApiConfigured ? "API key is configured" : "sk-..."}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Your API key is stored locally in your browser and is never sent to our servers.
              Get your API key from{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                OpenAI's website
              </a>.
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
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button className="bg-primary hover:bg-primary/90 text-white font-medium">
          Save Preferences
        </Button>
      </div>
    </div>
  );
};

export default ProfileSettings;
