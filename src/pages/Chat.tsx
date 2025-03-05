
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ChatInterface from "@/components/ChatInterface";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";

const Chat = () => {
  const { selectedLanguage } = useLanguage();
  const navigate = useNavigate();
  
  // Redirect to home if no language is selected
  useEffect(() => {
    if (!selectedLanguage) {
      navigate("/");
    }
  }, [selectedLanguage, navigate]);
  
  if (!selectedLanguage) return null;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <motion.main 
        className="flex-1 pt-16 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4 bg-secondary/50 border-b border-gray-200 dark:border-gray-800 text-center">
          <div className="inline-flex items-center space-x-2 py-1 px-3 bg-white dark:bg-gray-800 rounded-full shadow-soft">
            <span className="text-xl">{selectedLanguage.flag}</span>
            <h2 className="text-sm font-medium">
              {selectedLanguage.name} - {selectedLanguage.level.charAt(0).toUpperCase() + selectedLanguage.level.slice(1)} Level
            </h2>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <ChatInterface languageId={selectedLanguage.id} />
        </div>
      </motion.main>
    </div>
  );
};

export default Chat;
