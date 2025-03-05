import React from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

type MultipleChoiceOptionsProps = {
  options: string[];
  correctOption: string;
  onSelect: (option: string, isCorrect: boolean) => void;
  showFeedback: boolean;
  selectedOption: string | null;
};

const MultipleChoiceOptions = ({
  options,
  correctOption,
  onSelect,
  showFeedback,
  selectedOption,
}: MultipleChoiceOptionsProps) => {
  // More lenient matching function for determining if an option is correct
  const isOptionCorrect = (option: string, correctOption: string): boolean => {
    const normalizedOption = option.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const normalizedCorrectOption = correctOption.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    
    // Check for Greek greetings - both "Γειά σου" and "Γειά σας" are correct forms of greeting
    const isGreekGreeting = 
      (normalizedOption.includes("γεια") || normalizedOption.includes("για")) &&
      (normalizedCorrectOption.includes("γεια") || normalizedCorrectOption.includes("για"));
    
    // Special cases for Greek greetings
    const isGreekGreetingVariation = 
      (option === "Γειά σας" && correctOption === "Γειά σου") ||
      (option === "Γειά σου" && correctOption === "Γειά σας") ||
      (option === "Γεια σας" && correctOption === "Γεια σου") ||
      (option === "Γεια σου" && correctOption === "Γεια σας");
    
    return normalizedOption.includes(normalizedCorrectOption) || 
           normalizedCorrectOption.includes(normalizedOption) ||
           // For very short answers (like numbers), do exact matching
           (normalizedOption.length < 5 && normalizedCorrectOption.length < 5 && normalizedOption === normalizedCorrectOption) ||
           // Special cases for Greek
           isGreekGreeting ||
           isGreekGreetingVariation;
  };

  return (
    <div className="w-full space-y-2 my-4">
      {options.map((option) => {
        // Use the more lenient matching function
        const isCorrect = isOptionCorrect(option, correctOption);
        const isSelected = option === selectedOption;
        
        return (
          <Button
            key={option}
            variant={isSelected ? (isCorrect ? "default" : "destructive") : "outline"}
            className="w-full justify-between text-left mb-2"
            onClick={() => onSelect(option, isCorrect)}
            disabled={showFeedback}
          >
            <span>{option}</span>
            {showFeedback && isSelected && (
              isCorrect ? 
                <Check className="text-green-500 h-5 w-5" /> : 
                <X className="text-red-500 h-5 w-5" />
            )}
          </Button>
        );
      })}
    </div>
  );
};

export default MultipleChoiceOptions;
