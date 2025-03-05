import React from "react";
import { motion } from "framer-motion";

export type MessageType = {
  id: string;
  sender: "user" | "ai" | "system";
  text: string;
  timestamp: Date;
};

type ChatMessageProps = {
  message: MessageType;
};

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.sender === "user";

  // Function to render text with line breaks
  const renderTextWithLineBreaks = (text: string) => {
    // For AI messages, hide the Practice section and everything after it
    if (text.includes('Practice:')) {
      text = text.split('Practice:')[0].trim();
    }
    
    // Remove text in square brackets (instructions for the AI)
    text = text.replace(/\[.*?\]/g, '').trim();
    
    // PRESERVE double line breaks instead of removing them
    // text = text.replace(/\n\s*\n/g, '\n').trim();
    
    const lines = text.split('\n');
    return lines.map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <motion.div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? "bg-primary text-white rounded-tr-none"
            : "glassmorphism rounded-tl-none"
        }`}
      >
        <p className="text-sm sm:text-base">
          {isUser ? message.text : renderTextWithLineBreaks(message.text)}
        </p>
        <div className={`text-xs mt-1 ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
