
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import Header from "@/components/Header";

const Index = () => {
  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  
  // Reset selected language when returning to home page
  useEffect(() => {
    setSelectedLanguage(null);
  }, [setSelectedLanguage]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-12 flex flex-col items-center justify-center">
        <div className="container max-w-7xl">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Learn a language with AI
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Have natural conversations with your AI language tutor and improve your skills through practice.
            </p>
          </motion.div>
          
          <LanguageSelector />
        </div>
      </main>
      
      <footer className="py-6 border-t border-gray-200 dark:border-gray-800">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} LinguiFriend. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
