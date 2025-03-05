
import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = {
  id: string;
  name: string;
  flag: string;
  level: "beginner" | "intermediate" | "advanced";
};

type LanguageContextType = {
  selectedLanguage: Language | null;
  setSelectedLanguage: (language: Language) => void;
  availableLanguages: Language[];
  userLevel: "beginner" | "intermediate" | "advanced";
  setUserLevel: (level: "beginner" | "intermediate" | "advanced") => void;
};

const defaultLanguages: Language[] = [
  { id: "es", name: "Spanish", flag: "🇪🇸", level: "beginner" },
  { id: "fr", name: "French", flag: "🇫🇷", level: "beginner" },
  { id: "de", name: "German", flag: "🇩🇪", level: "beginner" },
  { id: "it", name: "Italian", flag: "🇮🇹", level: "beginner" },
  { id: "pt", name: "Portuguese", flag: "🇵🇹", level: "beginner" },
  { id: "ja", name: "Japanese", flag: "🇯🇵", level: "beginner" },
  { id: "zh", name: "Mandarin", flag: "🇨🇳", level: "beginner" },
  { id: "ru", name: "Russian", flag: "🇷🇺", level: "beginner" },
  { id: "ar", name: "Arabic", flag: "🇸🇦", level: "beginner" },
  { id: "ko", name: "Korean", flag: "🇰🇷", level: "beginner" },
  { id: "el", name: "Greek", flag: "🇬🇷", level: "beginner" },
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [userLevel, setUserLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");

  return (
    <LanguageContext.Provider
      value={{
        selectedLanguage,
        setSelectedLanguage,
        availableLanguages: defaultLanguages,
        userLevel,
        setUserLevel,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
