
import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";

const LanguageSelector = () => {
  const { availableLanguages, setSelectedLanguage } = useLanguage();
  const navigate = useNavigate();

  const selectLanguage = (language: any) => {
    setSelectedLanguage(language);
    navigate("/chat");
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
      <motion.h2 
        className="text-2xl sm:text-3xl font-bold mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Which language would you like to learn?
      </motion.h2>

      <motion.div 
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {availableLanguages.map((language) => (
          <motion.div key={language.id} variants={item}>
            <button
              onClick={() => selectLanguage(language)}
              className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 flex flex-col items-center justify-center shadow-soft transition-all duration-300 hover:shadow-medium border border-transparent hover:border-primary/20 hover:scale-105"
            >
              <span className="text-4xl mb-3">{language.flag}</span>
              <span className="font-medium">{language.name}</span>
            </button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default LanguageSelector;
