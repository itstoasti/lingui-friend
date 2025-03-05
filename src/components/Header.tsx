
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

const Header = () => {
  const { selectedLanguage } = useLanguage();
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-10 glassmorphism py-4 px-6 sm:px-8 flex items-center justify-between animate-slideDown">
      <Link to="/" className="text-xl font-semibold tracking-tight flex items-center">
        <span className="bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center mr-2 shadow-soft">L</span>
        <span>Lingui<span className="text-primary">Friend</span></span>
      </Link>
      
      <div className="flex items-center space-x-3">
        {selectedLanguage && location.pathname !== "/" && (
          <div className="hidden sm:flex items-center bg-secondary/80 px-3 py-1.5 rounded-full text-sm font-medium">
            <span className="mr-2">{selectedLanguage.flag}</span>
            <span>{selectedLanguage.name}</span>
          </div>
        )}
        
        <nav className="flex items-center space-x-1">
          <Link 
            to="/chat" 
            className={`p-2 rounded-lg transition-colors ${
              location.pathname === "/chat" 
                ? "bg-primary/10 text-primary" 
                : "hover:bg-secondary"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </Link>
          
          <Link 
            to="/profile" 
            className={`p-2 rounded-lg transition-colors ${
              location.pathname === "/profile" 
                ? "bg-primary/10 text-primary" 
                : "hover:bg-secondary"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
