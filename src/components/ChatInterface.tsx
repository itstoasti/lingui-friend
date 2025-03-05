import React, { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import ChatMessage, { MessageType } from "./ChatMessage";
import MultipleChoiceOptions from "./MultipleChoiceOptions";
import { useLanguage } from "../context/LanguageContext";
import { getLanguageLearningResponse, isApiKeyConfigured } from "../services/openai";
import LessonProgress from './LessonProgress';
import { Button } from "@/components/ui/button";

const INITIAL_MESSAGES: Record<string, MessageType[]> = {
  es: [
    {
      id: "1",
      sender: "ai",
      text: "¡Hola! Soy tu profesor de español. 'Hello' in Spanish is 'Hola'. You can select the correct response from the options below or type your answer if you have a Spanish keyboard.",
      timestamp: new Date(),
    },
  ],
  fr: [
    {
      id: "1",
      sender: "ai",
      text: "Bonjour! Je suis ton professeur de français. 'Hello' in French is 'Bonjour'. You can select the correct response from the options below or type your answer if you have a French keyboard.",
      timestamp: new Date(),
    },
  ],
  de: [
    {
      id: "1",
      sender: "ai",
      text: "Hallo! Ich bin dein Deutschlehrer. 'Hello' in German is 'Hallo'. You can select the correct response from the options below or type your answer if you have a German keyboard.",
      timestamp: new Date(),
    },
  ],
  it: [
    {
      id: "1",
      sender: "ai",
      text: "Ciao! Sono il tuo insegnante di italiano. 'Hello' in Italian is 'Ciao'. You can select the correct response from the options below or type your answer if you have an Italian keyboard.",
      timestamp: new Date(),
    },
  ],
  pt: [
    {
      id: "1",
      sender: "ai",
      text: "Olá! Eu sou seu professor de português. 'Hello' in Portuguese is 'Olá'. You can select the correct response from the options below or type your answer if you have a Portuguese keyboard.",
      timestamp: new Date(),
    },
  ],
  ja: [
    {
      id: "1",
      sender: "ai",
      text: "こんにちは！私はあなたの日本語の先生です。'Hello' in Japanese is 'こんにちは' (Konnichiwa). You can select the correct response from the options below or type your answer if you have a Japanese keyboard.",
      timestamp: new Date(),
    },
  ],
  zh: [
    {
      id: "1",
      sender: "ai",
      text: "你好！我是你的中文老师。'Hello' in Chinese is '你好' (Nǐ hǎo). You can select the correct response from the options below or type your answer if you have a Chinese keyboard.",
      timestamp: new Date(),
    },
  ],
  ru: [
    {
      id: "1",
      sender: "ai",
      text: "Привет! Я твой учитель русского языка. 'Hello' in Russian is 'Привет' (Privet). You can select the correct response from the options below or type your answer if you have a Russian keyboard.",
      timestamp: new Date(),
    },
  ],
  ar: [
    {
      id: "1",
      sender: "ai",
      text: "مرحبا! أنا مدرس اللغة العربية. 'Hello' in Arabic is 'مرحبا' (Marhaba). You can select the correct response from the options below or type your answer if you have an Arabic keyboard.",
      timestamp: new Date(),
    },
  ],
  ko: [
    {
      id: "1",
      sender: "ai",
      text: "안녕하세요! 저는 당신의 한국어 선생님입니다. 'Hello' in Korean is '안녕하세요' (Annyeonghaseyo). You can select the correct response from the options below or type your answer if you have a Korean keyboard.",
      timestamp: new Date(),
    },
  ],
  el: [
    {
      id: "1",
      sender: "ai",
      text: "Hello! I'm your Greek language teacher. Let's start with some basics. 'Hello' in Greek is 'Γειά σου' (pronounced as 'YAH-soo'). You can select the correct response from the options below or type your answer if you have a Greek keyboard.",
      timestamp: new Date(),
    },
  ],
};

type ChatInterfaceProps = {
  languageId: string;
};

const ChatInterface = ({ languageId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<MessageType[]>(INITIAL_MESSAGES[languageId] || []);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [multipleChoiceMode, setMultipleChoiceMode] = useState(false);
  const [showMultipleChoice, setShowMultipleChoice] = useState(false);
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([]);
  const [correctOption, setCorrectOption] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [teachingState, setTeachingState] = useState<{
    level: string;
    topic: string;
    progress: number;
    completed: string[];
  }>(() => {
    // Try to load from localStorage
    const savedState = localStorage.getItem('teachingState');
    if (savedState) {
      try {
        return JSON.parse(savedState);
      } catch (e) {
        console.error('Failed to parse saved teaching state:', e);
      }
    }
    // Default initial state
    return {
      level: 'beginner',
      topic: 'greetings',
      progress: 0,
      completed: []
    };
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userLevel, setUserLevel } = useLanguage();
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [previousMessages, setPreviousMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [showLessonProgress, setShowLessonProgress] = useState(false);
  // Add a new state to track if options were set from AI response
  const [optionsSetFromAI, setOptionsSetFromAI] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Only set initial messages if API key is not configured
    // If API key is configured, sendInitialAIMessage will set the messages
    if (!isApiKeyConfigured()) {
      setMessages(INITIAL_MESSAGES[languageId] || []);
    } else {
      // Clear messages to avoid showing both fallback and AI messages
      setMessages([]);
    }
    
    // Reset multiple choice state
    setCorrectOption("");
    setShowMultipleChoice(false);
    setOptionsSetFromAI(false);
    
    // If API key is configured, get initial message from OpenAI
    if (isApiKeyConfigured()) {
      setApiKeyConfigured(true);
      sendInitialAIMessage(languageId);
    } else {
      setApiKeyConfigured(false);
      // Only use setupMultipleChoiceOptions as fallback if API key is not configured
      setupMultipleChoiceOptions(languageId, "beginner", "greetings", 0);
    }
  }, [languageId]);

  useEffect(() => {
    // Only set up options from teaching state if they haven't been set from AI response
    if (!optionsSetFromAI) {
      console.log("Setting up options from teaching state (not from AI)");
      setupMultipleChoiceOptions(languageId, teachingState.level, teachingState.topic, teachingState.progress);
    } else {
      console.log("Options already set from AI response, not overriding");
    }
  }, [teachingState, languageId, optionsSetFromAI]);

  // Add a new useEffect to handle changes in multipleChoiceMode
  useEffect(() => {
    // When mode changes, update the visibility of multiple choice options
    if (multipleChoiceOptions.length > 0) {
      setShowMultipleChoice(multipleChoiceMode);
    }
  }, [multipleChoiceMode]);

  useEffect(() => {
    // Check if API key is configured
    setApiKeyConfigured(isApiKeyConfigured());
    
    // Only use setupMultipleChoiceOptions as fallback if API key is not configured
    setupMultipleChoiceOptions(languageId, "beginner", "greetings", 0);
  }, []);

  // Save teaching state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('teachingState', JSON.stringify(teachingState));
  }, [teachingState]);

  // Define the curriculum structure
  const curriculum = {
    beginner: {
      topics: [
        'greetings',
        'introductions',
        'numbers',
        'common-phrases',
        'foods',
        'colors',
        'family'
      ],
      requiredToAdvance: 5 // Need to complete at least 5 topics to advance to intermediate
    },
    intermediate: {
      topics: [
        'travel',
        'shopping',
        'dining',
        'directions',
        'weather',
        'hobbies',
        'time-expressions',
        'daily-routine'
      ],
      requiredToAdvance: 6 // Need to complete at least 6 topics to advance to advanced
    },
    advanced: {
      topics: [
        'opinions',
        'culture',
        'news',
        'storytelling',
        'idioms',
        'debate',
        'professional',
        'slang',
        'literature'
      ],
      requiredToAdvance: 0 // Advanced is the highest level
    }
  };

  // Function to get the next topic in the curriculum
  const getNextTopic = () => {
    const currentLevel = teachingState.level;
    const completedTopics = teachingState.completed;
    const availableTopics = curriculum[currentLevel as keyof typeof curriculum].topics;
    
    // Find topics that haven't been completed yet
    const remainingTopics = availableTopics.filter(topic => !completedTopics.includes(`${currentLevel}-${topic}`));
    
    if (remainingTopics.length > 0) {
      // Return the first uncompleted topic
      return remainingTopics[0];
    } else {
      // All topics in this level are completed, check if we can advance to next level
      const requiredToAdvance = curriculum[currentLevel as keyof typeof curriculum].requiredToAdvance;
      const completedInLevel = availableTopics.filter(topic => completedTopics.includes(`${currentLevel}-${topic}`)).length;
      
      if (completedInLevel >= requiredToAdvance) {
        // Advance to next level if possible
        if (currentLevel === 'beginner') {
          return curriculum.intermediate.topics[0];
        } else if (currentLevel === 'intermediate') {
          return curriculum.advanced.topics[0];
        }
      }
      
      // If we can't advance or are already at the highest level, just return the first topic of current level
      // This allows for review
      return availableTopics[0];
    }
  };

  // Function to validate and update the teaching state
  const validateTeachingState = (state: { level: string; topic: string; progress: number; completed: string[] }) => {
    const validLevels = ['beginner', 'intermediate', 'advanced'];
    let { level, topic, progress, completed } = state;
    
    // Validate level
    if (!validLevels.includes(level)) {
      console.log(`Invalid level: ${level}, resetting to beginner`);
      level = 'beginner';
    }
    
    // Validate topic
    const validTopics = curriculum[level as keyof typeof curriculum].topics;
    if (!validTopics.includes(topic)) {
      console.log(`Invalid topic: ${topic}, resetting to first topic of level`);
      topic = validTopics[0];
    }
    
    // Validate progress
    if (progress < 0) {
      console.log(`Invalid progress: ${progress}, resetting to 0`);
      progress = 0;
    }
    
    // If progress is too high (completed the topic), move to the next topic
    if (progress >= 5) { // Each topic has 5 lessons/exercises
      console.log(`Topic ${topic} completed with progress ${progress}, moving to next topic`);
      
      // Mark this topic as completed
      if (!completed.includes(`${level}-${topic}`)) {
        completed = [...completed, `${level}-${topic}`];
      }
      
      // Get the next topic
      const nextTopic = getNextTopic();
      
      // Check if we need to advance to the next level
      if (level === 'beginner' && curriculum.beginner.topics.indexOf(nextTopic) === -1) {
        level = 'intermediate';
      } else if (level === 'intermediate' && curriculum.intermediate.topics.indexOf(nextTopic) === -1) {
        level = 'advanced';
      }
      
      topic = nextTopic;
      progress = 0;
    }
    
    return { level, topic, progress, completed };
  };

  // Add useEffect to validate teaching state when it changes
  useEffect(() => {
    const validatedState = validateTeachingState(teachingState);
    
    // If the state needed to be corrected, update it
    if (validatedState.level !== teachingState.level || 
        validatedState.topic !== teachingState.topic || 
        validatedState.progress !== teachingState.progress ||
        validatedState.completed.length !== teachingState.completed.length) {
      console.log(`Correcting teaching state from ${teachingState.level}:${teachingState.topic}:${teachingState.progress} to ${validatedState.level}:${validatedState.topic}:${validatedState.progress}`);
      setTeachingState(validatedState);
      
      // Also update multiple choice options if in multiple choice mode
      if (multipleChoiceMode) {
        setupMultipleChoiceOptions(languageId, validatedState.level, validatedState.topic, validatedState.progress);
      }
    }
  }, [teachingState, languageId, multipleChoiceMode]);

  const setupMultipleChoiceOptions = (language: string, level: string, topic: string, progress: number): { options: string[], correctOption: string } => {
    let options: string[] = [];
    let correct = "";
    
    console.log(`Setting up options for: ${language}, level: ${level}, topic: ${topic}, progress: ${progress}`);
    
    // Always provide fallback options if none are found for the specific level/topic/progress
    let fallbackOptions = {
      el: {
        correct: "Ευχαριστώ",
        options: ["Ευχαριστώ", "Καλημέρα", "Γειά σου", "Συγγνώμη"]
      },
      es: {
        correct: "Gracias",
        options: ["Gracias", "Buenos días", "Hola", "Lo siento"]
      },
      fr: {
        correct: "Merci",
        options: ["Merci", "Bonjour", "Salut", "Pardon"]
      },
      de: {
        correct: "Danke",
        options: ["Danke", "Guten Tag", "Hallo", "Entschuldigung"]
      },
      default: {
        correct: "Thank you",
        options: ["Thank you", "Good morning", "Hello", "Sorry"]
      }
    };
    
    // Initial greeting responses for each language
    if (topic === "greeting") {
      if (progress === 0) {
        switch (language) {
          case "el":
            // For Greek, both "Γειά σου" (informal) and "Γειά σας" (formal) are correct forms of greeting
            // We'll set "Γειά σου" as the primary correct answer but ensure both are accepted
            correct = "Γειά σου";
            options = ["Γειά σου", "Γειά σας", "Καλημέρα", "Καληνύχτα"];
            break;
          case "es":
            correct = "Hola";
            options = ["Hola", "Gracias", "Buenas noches", "Lo siento"];
            break;
          case "fr":
            correct = "Bonjour";
            options = ["Bonjour", "Merci", "Bonne nuit", "Pardon"];
            break;
          case "de":
            correct = "Hallo";
            options = ["Hallo", "Danke", "Gute Nacht", "Entschuldigung"];
            break;
          case "it":
            correct = "Ciao";
            options = ["Ciao", "Grazie", "Buonanotte", "Scusa"];
            break;
          case "pt":
            correct = "Olá";
            options = ["Olá", "Obrigado", "Boa noite", "Desculpe"];
            break;
          case "ja":
            correct = "こんにちは";
            options = ["こんにちは", "ありがとう", "おやすみなさい", "すみません"];
            break;
          case "zh":
            correct = "你好";
            options = ["你好", "谢谢", "晚安", "对不起"];
            break;
          case "ru":
            correct = "Привет";
            options = ["Привет", "Спасибо", "Спокойной ночи", "Извините"];
            break;
          case "ar":
            correct = "مرحبا";
            options = ["مرحبا", "شكرا", "تصبح على خير", "آسف"];
            break;
          case "ko":
            correct = "안녕하세요";
            options = ["안녕하세요", "감사합니다", "안녕히 주무세요", "죄송합니다"];
            break;
          default:
            correct = "Hello";
            options = ["Hello", "Thank you", "Good night", "Sorry"];
        }
      } else if (progress === 1) {
        // Second greeting stage - introducing yourself
        switch (language) {
          case "el":
            correct = "Με λένε...";
            options = ["Με λένε...", "Χαίρω πολύ", "Από πού είσαι;", "Τι κάνεις;"];
            break;
          case "es":
            correct = "Me llamo...";
            options = ["Me llamo...", "Mucho gusto", "¿De dónde eres?", "¿Cómo estás?"];
            break;
          case "fr":
            correct = "Je m'appelle...";
            options = ["Je m'appelle...", "Enchanté", "D'où viens-tu?", "Comment ça va?"];
            break;
          default:
            correct = "My name is...";
            options = ["My name is...", "Nice to meet you", "Where are you from?", "How are you?"];
        }
      } else if (progress === 2) {
        // Third greeting stage - asking how are you
        switch (language) {
          case "el":
            correct = "Τι κάνεις;";
            options = ["Τι κάνεις;", "Πώς είσαι;", "Πού μένεις;", "Πόσο χρονών είσαι;"];
            break;
          case "es":
            correct = "¿Cómo estás?";
            options = ["¿Cómo estás?", "¿Qué tal?", "¿Dónde vives?", "¿Cuántos años tienes?"];
            break;
          case "fr":
            correct = "Comment ça va?";
            options = ["Comment ça va?", "Comment vas-tu?", "Où habites-tu?", "Quel âge as-tu?"];
            break;
          default:
            correct = "How are you?";
            options = ["How are you?", "How's it going?", "Where do you live?", "How old are you?"];
        }
      }
    } else if (topic === "basic-phrases") {
      if (progress === 0) {
        // First basic phrase - thank you
        switch (language) {
          case "el":
      correct = "Ευχαριστώ";
      options = ["Ευχαριστώ", "Καλημέρα", "Γειά σου", "Συγγνώμη"];
            break;
          case "es":
            correct = "Gracias";
            options = ["Gracias", "Buenos días", "Hola", "Lo siento"];
            break;
          case "fr":
            correct = "Merci";
            options = ["Merci", "Bonjour", "Salut", "Pardon"];
            break;
          default:
            correct = "Thank you";
            options = ["Thank you", "Good morning", "Hello", "Sorry"];
        }
      } else if (progress === 1) {
        // Second basic phrase - yes/no
        switch (language) {
          case "el":
            correct = "Ναι";
            options = ["Ναι", "Όχι", "Ίσως", "Δεν ξέρω"];
            break;
          case "es":
            correct = "Sí";
            options = ["Sí", "No", "Quizás", "No sé"];
            break;
          case "fr":
            correct = "Oui";
            options = ["Oui", "Non", "Peut-être", "Je ne sais pas"];
            break;
          default:
            correct = "Yes";
            options = ["Yes", "No", "Maybe", "I don't know"];
        }
      } else if (progress === 2) {
        // Third basic phrase - please
        switch (language) {
          case "el":
            correct = "Παρακαλώ";
            options = ["Παρακαλώ", "Ευχαριστώ", "Συγγνώμη", "Γειά σου"];
            break;
          case "es":
            correct = "Por favor";
            options = ["Por favor", "Gracias", "Lo siento", "Hola"];
            break;
          case "fr":
            correct = "S'il vous plaît";
            options = ["S'il vous plaît", "Merci", "Pardon", "Bonjour"];
            break;
          default:
            correct = "Please";
            options = ["Please", "Thank you", "Sorry", "Hello"];
        }
      } else if (progress === 3) {
        // Fourth basic phrase - I would like water
        switch (language) {
          case "el":
            correct = "Θα ήθελα νερό";
            options = ["Θα ήθελα νερό", "Θα ήθελα καφέ", "Πού είναι το μπάνιο;", "Τι ώρα είναι;"];
            break;
          case "es":
            correct = "Quisiera agua";
            options = ["Quisiera agua", "Quisiera café", "¿Dónde está el baño?", "¿Qué hora es?"];
            break;
          case "fr":
            correct = "Je voudrais de l'eau";
            options = ["Je voudrais de l'eau", "Je voudrais un café", "Où sont les toilettes?", "Quelle heure est-il?"];
            break;
          default:
            correct = "I would like water";
            options = ["I would like water", "I would like coffee", "Where is the bathroom?", "What time is it?"];
        }
      }
    } else if (topic === "simple-conversation") {
      if (progress === 0) {
        // First simple conversation - where is...
        switch (language) {
          case "el":
      correct = "Πού είναι η τουαλέτα;";
      options = ["Πώς είσαι;", "Πού είναι η τουαλέτα;", "Τι ώρα είναι;", "Πόσο κάνει;"];
            break;
          case "es":
            correct = "¿Dónde está el baño?";
            options = ["¿Cómo estás?", "¿Dónde está el baño?", "¿Qué hora es?", "¿Cuánto cuesta?"];
            break;
          case "fr":
            correct = "Où sont les toilettes?";
            options = ["Comment ça va?", "Où sont les toilettes?", "Quelle heure est-il?", "Combien ça coûte?"];
            break;
          default:
            correct = "Where is the bathroom?";
            options = ["How are you?", "Where is the bathroom?", "What time is it?", "How much is it?"];
        }
      } else if (progress === 1) {
        // Second simple conversation - numbers
        switch (language) {
          case "el":
            correct = "ένα, δύο, τρία, τέσσερα, πέντε";
            options = ["ένα, δύο, τρία, τέσσερα, πέντε", "Δευτέρα, Τρίτη, Τετάρτη", "καλημέρα, καλησπέρα, καληνύχτα", "ναι, όχι, ίσως"];
            break;
          case "es":
            correct = "uno, dos, tres, cuatro, cinco";
            options = ["uno, dos, tres, cuatro, cinco", "lunes, martes, miércoles", "buenos días, buenas tardes, buenas noches", "sí, no, quizás"];
            break;
          default:
            correct = "one, two, three, four, five";
            options = ["one, two, three, four, five", "Monday, Tuesday, Wednesday", "good morning, good afternoon, good night", "yes, no, maybe"];
        }
      } else if (progress === 2) {
        // Third simple conversation - where are you from
        switch (language) {
          case "el":
            correct = "Είμαι από...";
            options = ["Είμαι από...", "Με λένε...", "Είμαι... χρονών", "Μένω στ..."];
            break;
          case "es":
            correct = "Soy de...";
            options = ["Soy de...", "Me llamo...", "Tengo... años", "Vivo en..."];
            break;
          default:
            correct = "I am from...";
            options = ["I am from...", "My name is...", "I am... years old", "I live in..."];
        }
      }
    } else if (topic === "practice") {
      // Practice stage - various phrases based on progress
      // Use modulo to cycle through options for any progress value
      const practiceIndex = progress % 7;
      
      switch (language) {
        case "el":
          switch (practiceIndex) {
        case 0:
          correct = "Θα ήθελα καφέ";
          options = ["Θα ήθελα καφέ", "Θα ήθελα νερό", "Πού είναι το ξενοδοχείο;", "Καλό βράδυ"];
          break;
        case 1:
          correct = "Πόσο κάνει;";
          options = ["Πόσο κάνει;", "Τι ώρα είναι;", "Πώς σε λένε;", "Από πού είσαι;"];
          break;
        case 2:
          correct = "Χάρηκα για τη γνωριμία";
          options = ["Καλή όρεξη", "Χάρηκα για τη γνωριμία", "Καλό ταξίδι", "Καληνύχτα"];
          break;
        case 3:
          correct = "Ευχαριστώ";
          options = ["Παρακαλώ", "Συγγνώμη", "Ευχαριστώ", "Γειά σου"];
          break;
            case 4:
              correct = "Πού είναι η παραλία;";
              options = ["Πού είναι η παραλία;", "Πού είναι το μουσείο;", "Πού είναι το εστιατόριο;", "Πού είναι το ξενοδοχείο;"];
              break;
            case 5:
              correct = "Το λογαριασμό, παρακαλώ";
              options = ["Το λογαριασμό, παρακαλώ", "Ένα τραπέζι για δύο, παρακαλώ", "Τι μου προτείνετε;", "Είναι πικάντικο;"];
              break;
            case 6:
              correct = "Καλό ταξίδι";
              options = ["Καλό ταξίδι", "Καλή διαμονή", "Καλή όρεξη", "Καλή τύχη"];
          break;
      }
          break;
        case "es":
          switch (practiceIndex) {
            case 0:
              correct = "Quisiera un café";
              options = ["Quisiera un café", "Quisiera agua", "¿Dónde está el hotel?", "Buenas noches"];
              break;
            case 1:
              correct = "¿Cuánto cuesta?";
              options = ["¿Cuánto cuesta?", "¿Qué hora es?", "¿Cómo te llamas?", "¿De dónde eres?"];
              break;
            case 2:
              correct = "Encantado de conocerte";
              options = ["Buen provecho", "Encantado de conocerte", "Buen viaje", "Buenas noches"];
              break;
            case 3:
              correct = "Gracias";
              options = ["Por favor", "Lo siento", "Gracias", "Hola"];
              break;
            case 4:
              correct = "¿Dónde está la playa?";
              options = ["¿Dónde está la playa?", "¿Dónde está el museo?", "¿Dónde está el restaurante?", "¿Dónde está el hotel?"];
              break;
            case 5:
              correct = "La cuenta, por favor";
              options = ["La cuenta, por favor", "Una mesa para dos, por favor", "¿Qué me recomienda?", "¿Es picante?"];
              break;
            case 6:
              correct = "Buen viaje";
              options = ["Buen viaje", "Buena estancia", "Buen provecho", "Buena suerte"];
              break;
          }
          break;
        case "fr":
          switch (practiceIndex) {
            case 0:
              correct = "Je voudrais un café";
              options = ["Je voudrais un café", "Je voudrais de l'eau", "Où est l'hôtel?", "Bonne soirée"];
              break;
            case 1:
              correct = "Combien ça coûte?";
              options = ["Combien ça coûte?", "Quelle heure est-il?", "Comment t'appelles-tu?", "D'où viens-tu?"];
              break;
            case 2:
              correct = "Enchanté de faire votre connaissance";
              options = ["Bon appétit", "Enchanté de faire votre connaissance", "Bon voyage", "Bonne nuit"];
              break;
            case 3:
              correct = "Merci";
              options = ["S'il vous plaît", "Pardon", "Merci", "Bonjour"];
              break;
            case 4:
              correct = "Où est la plage?";
              options = ["Où est la plage?", "Où est le musée?", "Où est le restaurant?", "Où est l'hôtel?"];
              break;
            case 5:
              correct = "L'addition, s'il vous plaît";
              options = ["L'addition, s'il vous plaît", "Une table pour deux, s'il vous plaît", "Que me recommandez-vous?", "Est-ce épicé?"];
              break;
            case 6:
              correct = "Bon voyage";
              options = ["Bon voyage", "Bon séjour", "Bon appétit", "Bonne chance"];
              break;
          }
          break;
        default:
          // For any other language, provide generic options
          switch (practiceIndex) {
            case 0:
              correct = "I would like coffee";
              options = ["I would like coffee", "I would like water", "Where is the hotel?", "Good evening"];
              break;
            case 1:
              correct = "How much is it?";
              options = ["How much is it?", "What time is it?", "What's your name?", "Where are you from?"];
              break;
            case 2:
              correct = "Nice to meet you";
              options = ["Enjoy your meal", "Nice to meet you", "Have a good trip", "Good night"];
              break;
            case 3:
              correct = "Thank you";
              options = ["Please", "Sorry", "Thank you", "Hello"];
              break;
            case 4:
              correct = "Where is the beach?";
              options = ["Where is the beach?", "Where is the museum?", "Where is the restaurant?", "Where is the hotel?"];
              break;
            case 5:
              correct = "The check, please";
              options = ["The check, please", "A table for two, please", "What do you recommend?", "Is it spicy?"];
              break;
            case 6:
              correct = "Have a good trip";
              options = ["Have a good trip", "Enjoy your stay", "Enjoy your meal", "Good luck"];
              break;
          }
          break;
      }
    } else {
      // If we reach an unknown topic, use the fallback options
      console.log(`Unknown topic: ${topic}, using fallback options`);
      const fallback = fallbackOptions[language] || fallbackOptions.default;
      correct = fallback.correct;
      options = fallback.options;
    }
    
    // If no options were set, use fallback options
    if (options.length === 0) {
      console.log(`No options found for ${language}, level: ${level}, topic: ${topic}, progress: ${progress}, using fallback options`);
      const fallback = fallbackOptions[language] || fallbackOptions.default;
      correct = fallback.correct;
      options = fallback.options;
    }
    
    console.log(`Setting options: ${options.join(', ')}, correct: ${correct}`);
    
    // Only set the state if we're not called from a place that already sets optionsSetFromAI
    if (!optionsSetFromAI) {
      setMultipleChoiceOptions(options);
      setCorrectOption(correct);
      setShowMultipleChoice(multipleChoiceMode);
    }
    
    return { options, correctOption: correct };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Utility function to shuffle an array (Fisher-Yates algorithm)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const extractOptionsFromResponse = (response: string): { options: string[], correctOption: string, cleanedResponse?: string } => {
    // Default values
    let options: string[] = [];
    let correctOption = '';
    
    try {
      console.log("Extracting options from response:", response);
      
      // First try to find options in a Practice section
      if (response.includes('Practice:')) {
        console.log("Found Practice section");
        const practiceSection = response.split('Practice:')[1].trim();
        console.log("Practice section content:", practiceSection);
        
        // Extract options using regex to find text in quotes
        const optionRegex = /"([^"]+)"/g;
        let match;
        let allMatches = [];
        
        while ((match = optionRegex.exec(practiceSection)) !== null) {
          console.log("Found quoted option:", match[1]);
          allMatches.push(match[1]);
        }
        
        // If we found options, the first one is the correct answer
        if (allMatches.length > 0) {
          correctOption = allMatches[0];
          console.log("Correct option before shuffle:", correctOption);
          
          // Create a copy of options for shuffling
          const shuffledOptions = shuffleArray([...allMatches]);
          
          // Make sure the correct option is included in the shuffled options
          if (!shuffledOptions.includes(correctOption)) {
            console.log("Correct option not in shuffled options, adding it");
            shuffledOptions[0] = correctOption;
          }
          
          options = shuffledOptions;
          console.log("Extracted options from Practice section after shuffle:", options);
          console.log("Correct option after shuffle (unchanged):", correctOption);
        } else {
          console.log("No quoted options found in Practice section");
        }
      } else {
        console.log("No Practice section found in response");
      }
      
      // If no options were found in the Practice section, look for quoted options anywhere in the response
      if (options.length === 0) {
        console.log('Looking for quotes in entire response');
        const optionRegex = /"([^"]+)"/g;
        let match;
        let allMatches = [];
        
        while ((match = optionRegex.exec(response)) !== null) {
          console.log("Found quoted text:", match[1]);
          // Only include options that are likely to be multiple choice (not too long)
          if (match[1].length < 50) {
            allMatches.push(match[1]);
          }
        }
        
        // If we found at least 2 options, use them
        if (allMatches.length >= 2) {
          // The first match is the correct answer
          correctOption = allMatches[0];
          console.log("Correct option before shuffle:", correctOption);
          
          // Create a copy for shuffling
          const shuffledOptions = shuffleArray([...allMatches]);
          
          // Make sure the correct option is included in the shuffled options
          if (!shuffledOptions.includes(correctOption)) {
            console.log("Correct option not in shuffled options, adding it");
            shuffledOptions[0] = correctOption;
          }
          
          options = shuffledOptions;
          console.log("Extracted options from quotes in entire response after shuffle:", options);
          console.log("Correct option after shuffle (unchanged):", correctOption);
        } else {
          console.log("Not enough quoted options found in entire response");
        }
      }
      
      // If still no options were found, try to extract options from lines that look like they could be options
      if (options.length === 0) {
        console.log('Looking for lines that could be options');
        
        // Split the response into lines
        const lines = response.split('\n');
        const potentialOptions = [];
        
        // Look for short lines that might be options
        for (const line of lines) {
          const trimmedLine = line.trim();
          // Skip empty lines or lines that are too long
          if (trimmedLine && trimmedLine.length < 50 && !trimmedLine.includes(':')) {
            console.log("Found potential option line:", trimmedLine);
            potentialOptions.push(trimmedLine);
          }
        }
        
        // If we found at least 2 potential options, use them
        if (potentialOptions.length >= 2) {
          // The first one is the correct answer
          correctOption = potentialOptions[0];
          console.log("Correct option before shuffle:", correctOption);
          
          // Create a copy for shuffling
          const optionsToShuffle = potentialOptions.slice(0, 4); // Take up to 4 options
          const shuffledOptions = shuffleArray([...optionsToShuffle]);
          
          // Make sure the correct option is included in the shuffled options
          if (!shuffledOptions.includes(correctOption)) {
            console.log("Correct option not in shuffled options, adding it");
            shuffledOptions[0] = correctOption;
          }
          
          options = shuffledOptions;
          console.log("Extracted options from lines after shuffle:", options);
          console.log("Correct option after shuffle (unchanged):", correctOption);
        } else {
          console.log("Not enough potential option lines found");
        }
      }
      
      // If still no options were found, use topic-specific fallback options based on the language
      if (options.length === 0) {
        console.warn('No options found in response, using topic-specific fallbacks');
        
        // Get the current topic and language from the teaching state
        const currentTopic = teachingState.topic;
        
        // Set language-specific fallback options based on the current topic
        const fallbackOptions = {
          el: {
            greetings: {
              options: ['Γειά σου', 'Γειά σας', 'Καλημέρα', 'Καληνύχτα'],
              correctOption: 'Γειά σου'
            },
            greeting: {
              options: ['Γειά σου', 'Γειά σας', 'Καλημέρα', 'Καληνύχτα'],
              correctOption: 'Γειά σου'
            },
            numbers: {
              options: ['Ένα', 'Δύο', 'Τρία', 'Τέσσερα'],
              correctOption: 'Ένα'
            },
            'common-phrases': {
              options: ['Ευχαριστώ', 'Παρακαλώ', 'Συγγνώμη', 'Ναι'],
              correctOption: 'Ευχαριστώ'
            },
            default: {
              options: ['Ναι', 'Όχι', 'Ίσως', 'Δεν ξέρω'],
              correctOption: 'Ναι'
            }
          },
          es: {
            greetings: {
              options: ['Hola', 'Buenos días', 'Buenas noches', 'Adiós'],
              correctOption: 'Hola'
            },
            greeting: {
              options: ['Hola', 'Buenos días', 'Buenas noches', 'Adiós'],
              correctOption: 'Hola'
            },
            numbers: {
              options: ['Uno', 'Dos', 'Tres', 'Cuatro'],
              correctOption: 'Uno'
            },
            'common-phrases': {
              options: ['Gracias', 'Por favor', 'Lo siento', 'Sí'],
              correctOption: 'Gracias'
            },
            default: {
              options: ['Sí', 'No', 'Quizás', 'No sé'],
              correctOption: 'Sí'
            }
          },
          fr: {
            greetings: {
              options: ['Bonjour', 'Salut', 'Bonsoir', 'Au revoir'],
              correctOption: 'Bonjour'
            },
            greeting: {
              options: ['Bonjour', 'Salut', 'Bonsoir', 'Au revoir'],
              correctOption: 'Bonjour'
            },
            numbers: {
              options: ['Un', 'Deux', 'Trois', 'Quatre'],
              correctOption: 'Un'
            },
            'common-phrases': {
              options: ['Merci', 'S\'il vous plaît', 'Pardon', 'Oui'],
              correctOption: 'Merci'
            },
            default: {
              options: ['Oui', 'Non', 'Peut-être', 'Je ne sais pas'],
              correctOption: 'Oui'
            }
          },
          de: {
            greetings: {
              options: ['Hallo', 'Guten Morgen', 'Guten Abend', 'Auf Wiedersehen'],
              correctOption: 'Hallo'
            },
            greeting: {
              options: ['Hallo', 'Guten Morgen', 'Guten Abend', 'Auf Wiedersehen'],
              correctOption: 'Hallo'
            },
            numbers: {
              options: ['Eins', 'Zwei', 'Drei', 'Vier'],
              correctOption: 'Eins'
            },
            'common-phrases': {
              options: ['Danke', 'Bitte', 'Entschuldigung', 'Ja'],
              correctOption: 'Danke'
            },
            default: {
              options: ['Ja', 'Nein', 'Vielleicht', 'Ich weiß nicht'],
              correctOption: 'Ja'
            }
          },
          default: {
            greetings: {
              options: ['Hello', 'Good morning', 'Good evening', 'Goodbye'],
              correctOption: 'Hello'
            },
            greeting: {
              options: ['Hello', 'Good morning', 'Good evening', 'Goodbye'],
              correctOption: 'Hello'
            },
            numbers: {
              options: ['One', 'Two', 'Three', 'Four'],
              correctOption: 'One'
            },
            'common-phrases': {
              options: ['Thank you', 'Please', 'Sorry', 'Yes'],
              correctOption: 'Thank you'
            },
            default: {
              options: ['Yes', 'No', 'Maybe', 'I don\'t know'],
              correctOption: 'Yes'
            }
          }
        };
        
        // Get language-specific fallbacks or use default
        const languageFallbacks = fallbackOptions[languageId] || fallbackOptions.default;
        
        // Get topic-specific fallbacks or use default for the language
        const topicFallbacks = languageFallbacks[currentTopic] || languageFallbacks.default;
        
        options = [...topicFallbacks.options]; // Create a copy to avoid modifying the original
        correctOption = topicFallbacks.correctOption;
        
        console.log("Using fallback options for language:", languageId, "and topic:", currentTopic, options);
      }
      
      // Make sure the correct option is included in the options
      if (!options.includes(correctOption)) {
        console.log("Correct option not in options list, adding it");
        options[0] = correctOption; // Replace the first option with the correct one
      }
      
      return {
        options,
        correctOption,
        cleanedResponse: response.split('Practice:')[0].trim()
      };
    } catch (error) {
      console.error('Error extracting options:', error);
      return {
        options: ['Yes', 'No', 'Maybe', 'I don\'t know'],
        correctOption: 'Yes'
      };
    }
  };

  // Add a function to send an initial AI message
  const sendInitialAIMessage = async (language: string) => {
    setIsLoading(true);
    try {
      const initialPrompt = `I want to learn ${getLanguageName(language)}. Please introduce yourself as my language teacher and teach me ONE simple greeting (like "hello" or "good morning"). Keep it very simple and beginner-friendly.

Format your response with line breaks between sections like this:
[Friendly greeting and introduction as my language teacher]
${getLanguageName(language)} phrase: [word in ${getLanguageName(language)}]
Pronunciation: [simple phonetic pronunciation]
English meaning: [translation]
Example: [simple example of usage]

IMPORTANT: After your explanation, you MUST include a "Practice:" section with EXACTLY 4 multiple choice options. 
Format the Practice section like this:

Practice:
"[First option]" (this should be the correct answer)
"[Second option]"
"[Third option]"
"[Fourth option]"

CRITICAL FORMATTING RULES:
- Each option MUST be enclosed in quotes
- The first option MUST be the correct answer
- Each option should be on its own line
- Be warm, friendly and conversational, like a helpful tutor
- Do NOT include numbers in the options themselves
- Each option should be a complete, short phrase (1-5 words)
- Options should be relevant to what you just taught
- All options should be in ${getLanguageName(language)}`;
      
      console.log("Sending initial prompt:", initialPrompt);
      
      const response = await getLanguageLearningResponse(initialPrompt, {
        languageId: language,
        stage: "greeting",
        progress: 0,
        previousMessages: [],
        skillLevel: userLevel
      });
      
      console.log("Initial AI response:", response);
      
      // Create the AI response message
      const aiMessage: MessageType = {
        id: uuidv4(),
        sender: "ai",
        text: response,
        timestamp: new Date(),
      };
      
      // Replace all messages with just this AI message instead of appending
      setMessages([aiMessage]);
      
      // Add to previous messages for context
      setPreviousMessages([{ role: 'assistant', content: response }]);
      
      // Extract options from the AI response
      const { options, correctOption } = extractOptionsFromResponse(response);
      console.log("Extracted options:", options, "Correct option:", correctOption);
      
      if (options.length > 0 && correctOption) {
        setMultipleChoiceOptions(options);
        setCorrectOption(correctOption);
        setOptionsSetFromAI(true); // Set the flag to indicate options came from AI
      } else {
        // Fallback to default options if extraction failed
        setupMultipleChoiceOptions(language, "beginner", "greetings", 0);
        setOptionsSetFromAI(false);
      }
      
      // If in multiple choice mode, show the options
      if (multipleChoiceMode) {
        setShowMultipleChoice(true);
      }
      
    } catch (error) {
      console.error("Error getting initial AI message:", error);
      setOptionsSetFromAI(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to get language name
  const getLanguageName = (languageId: string): string => {
    const languageNames: Record<string, string> = {
      el: 'Greek',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ja: 'Japanese',
      zh: 'Chinese',
      ru: 'Russian',
      ar: 'Arabic',
      ko: 'Korean'
    };
    
    return languageNames[languageId] || languageId;
  };

  // Helper function to calculate the next teaching state based on user performance
  const calculateNextTeachingState = (currentState: { level: string; topic: string; progress: number; completed: string[] }, isCorrect: boolean) => {
    const { level, topic, progress, completed } = currentState;
    let newLevel = level;
    let newTopic = topic;
    let newProgress = progress;
    let newCompleted = [...completed];
    
    // If the answer was correct, advance to the next progress level
    if (isCorrect) {
      newProgress = progress + 1;
      
      // If we've reached the end of a topic, move to the next topic
      if (newProgress >= 5) {
        console.log(`Topic ${topic} completed with progress ${progress}, moving to next topic`);
        
        // Mark this topic as completed
        if (!newCompleted.includes(`${level}-${topic}`)) {
          newCompleted.push(`${level}-${topic}`);
        }
        
        // Get the next topic
        const nextTopic = getNextTopic();
        newTopic = nextTopic;
        
        // Check if we need to advance to the next level
        if (level === 'beginner' && curriculum.beginner.topics.indexOf(nextTopic) === -1) {
          newLevel = 'intermediate';
        } else if (level === 'intermediate' && curriculum.intermediate.topics.indexOf(nextTopic) === -1) {
          newLevel = 'advanced';
        }
        
        newProgress = 0;
      }
    } else {
      // If the answer was incorrect, we still advance but more slowly
      newProgress = progress + 0.5;
      
      // Round to nearest integer to avoid fractional progress
      newProgress = Math.floor(newProgress);
    }
    
    return { level: newLevel, topic: newTopic, progress: newProgress, completed: newCompleted };
  };

  const handleMultipleChoiceSelect = async (option: string, isCorrect: boolean) => {
    setSelectedOption(option);
    setShowFeedback(true);
    
    // Note: We ignore the isCorrect parameter passed from the component and use our own comparison for consistency
    // More lenient matching - normalize both strings and check if one contains the other
    const normalizedOption = option.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const normalizedCorrectOption = correctOption.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    
    console.log("Selected option:", option);
    console.log("Correct option:", correctOption);
    console.log("Normalized selected:", normalizedOption);
    console.log("Normalized correct:", normalizedCorrectOption);
    console.log("Current topic:", teachingState.topic);
    
    // Special case for Greek greetings - both "Γειά σου" and "Γειά σας" are correct
    const isGreekGreeting = 
      (languageId === "el" && teachingState.topic === "greeting") && 
      (normalizedOption.includes("γεια") || normalizedOption.includes("για")) &&
      (normalizedCorrectOption.includes("γεια") || normalizedCorrectOption.includes("για"));
    
    // Check if either string contains the other, or if they're similar enough
    const actuallyCorrect = 
      normalizedOption.includes(normalizedCorrectOption) || 
      normalizedCorrectOption.includes(normalizedOption) ||
      // For very short answers (like numbers), do exact matching
      (normalizedOption.length < 5 && normalizedCorrectOption.length < 5 && normalizedOption === normalizedCorrectOption) ||
      // Special case for Greek numbers and common words
      (option === "Ένα" && correctOption === "Ένα") ||
      (option === "Δύο" && correctOption === "Δύο") ||
      (option === "Τρία" && correctOption === "Τρία") ||
      (option === "Τέσσερα" && correctOption === "Τέσσερα") ||
      // Additional special cases for Greek
      (languageId === "el" && normalizedOption === "ενα" && normalizedCorrectOption === "ενα") ||
      (languageId === "el" && normalizedOption === "δυο" && normalizedCorrectOption === "δυο") ||
      (languageId === "el" && normalizedOption === "τρια" && normalizedCorrectOption === "τρια") ||
      (languageId === "el" && normalizedOption === "τεσσερα" && normalizedCorrectOption === "τεσσερα") ||
      // Special case for Greek greetings
      isGreekGreeting ||
      // Special case for variations of the same greeting
      (option === "Γειά σας" && correctOption === "Γειά σου") ||
      (option === "Γειά σου" && correctOption === "Γειά σας") ||
      (option === "Γεια σας" && correctOption === "Γεια σου") ||
      (option === "Γεια σου" && correctOption === "Γεια σας");
    
    console.log("Is actually correct:", actuallyCorrect);
    console.log("Teaching state topic:", teachingState.topic);

    // Create user message
    const userMessage: MessageType = {
      id: uuidv4(),
      sender: "user",
      text: option,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    // Add user message to previous messages for context
    setPreviousMessages((prev) => [...prev, { role: 'user', content: option }]);
    
    setIsLoading(true);

    // Simulate loading
    setTimeout(async () => {
      let feedbackResponse;
      
      if (apiKeyConfigured) {
        try {
          // Get AI feedback
          const evaluationPrompt = `The user selected "${option}" as their answer. The correct answer is "${correctOption}". ${actuallyCorrect ? "They got it right!" : "They got it wrong."}

${actuallyCorrect 
  ? "Please provide brief positive feedback on their answer in a friendly, conversational tone. Then teach them ONE new simple phrase or word in " + getLanguageName(languageId) + "."
  : "Please provide brief, encouraging feedback explaining why their answer was incorrect in a friendly, conversational tone. Remind them that the correct answer is \"" + correctOption + "\" and what it means. Then encourage them to try again."
}

Keep your response short and friendly. Remember you are teaching ${getLanguageName(languageId)} at a ${teachingState.level} level, focusing on the topic "${teachingState.topic}".

${actuallyCorrect ? `
IMPORTANT INSTRUCTION: You MUST include a "Practice:" section at the end of your response with EXACTLY 4 multiple choice options.

Your response MUST follow this exact format:
1. Positive feedback about their correct answer
2. Teach ONE new phrase or word
3. A "Practice:" section with 4 options in quotes

Format the Practice section exactly like this:

Practice:
"[First option]" (this should be the correct answer)
"[Second option]"
"[Third option]"
"[Fourth option]"

CRITICAL FORMATTING RULES:
- The Practice section MUST be included
- Each option MUST be enclosed in quotes
- The first option MUST be the correct answer
- Each option should be on its own line
- All options should be in ${getLanguageName(languageId)}
` : ''}`;

          console.log("Evaluation prompt:", evaluationPrompt);
          
          const response = await getLanguageLearningResponse(evaluationPrompt, {
            languageId,
            stage: teachingState.topic,
            progress: teachingState.progress,
            previousMessages,
            skillLevel: userLevel,
          });
          feedbackResponse = response;
          
          // If the answer was correct, extract options from the AI response for the next question
          if (actuallyCorrect) {
            console.log("User answered correctly, extracting options from AI response for next question");
            const { options: extractedOptions, correctOption: extractedCorrectOption } = extractOptionsFromResponse(response);
            
            if (extractedOptions.length > 0 && extractedCorrectOption) {
              console.log("Successfully extracted options from AI response:", extractedOptions, "Correct option:", extractedCorrectOption);
              setMultipleChoiceOptions(extractedOptions);
              setCorrectOption(extractedCorrectOption);
              setOptionsSetFromAI(true); // Set the flag to indicate options came from AI
            } else {
              console.log("Failed to extract options from AI response, using fallback options");
              // Update teaching state based on whether the answer was correct
              const nextState = calculateNextTeachingState(teachingState, actuallyCorrect);
              
              // Use setupMultipleChoiceOptions as a fallback
              const newOptions = setupMultipleChoiceOptions(
                languageId,
                nextState.level,
                nextState.topic,
                nextState.progress
              );
              
              if (newOptions && newOptions.options && newOptions.correctOption) {
                setMultipleChoiceOptions(newOptions.options);
                setCorrectOption(newOptions.correctOption);
                setOptionsSetFromAI(false); // Options came from fallback
              }
            }
          }
        } catch (error) {
          console.error("Error getting AI feedback:", error);
          feedbackResponse = actuallyCorrect
            ? "Great job! That's correct! 🎉"
            : `Not quite. The correct answer is "${correctOption}". Let's try again!`;
            
          // If there was an error but the answer was correct, still try to set up new options
          if (actuallyCorrect) {
            // Update teaching state based on whether the answer was correct
            const nextState = calculateNextTeachingState(teachingState, actuallyCorrect);
            
            // Use setupMultipleChoiceOptions as a fallback
            const newOptions = setupMultipleChoiceOptions(
              languageId,
              nextState.level,
              nextState.topic,
              nextState.progress
            );
            
            if (newOptions && newOptions.options && newOptions.correctOption) {
              setMultipleChoiceOptions(newOptions.options);
              setCorrectOption(newOptions.correctOption);
              setOptionsSetFromAI(false); // Options came from fallback
            }
          }
        }
      } else {
        // Fallback feedback if API key is not configured
        feedbackResponse = actuallyCorrect
          ? "Great job! That's correct! 🎉"
          : `Not quite. The correct answer is "${correctOption}". Let's try again!`;
          
        // If the answer was correct, still try to set up new options
        if (actuallyCorrect) {
          // Update teaching state based on whether the answer was correct
          const nextState = calculateNextTeachingState(teachingState, actuallyCorrect);
          
          // Use setupMultipleChoiceOptions as a fallback
          const newOptions = setupMultipleChoiceOptions(
            languageId,
            nextState.level,
            nextState.topic,
            nextState.progress
          );
          
          if (newOptions && newOptions.options && newOptions.correctOption) {
            setMultipleChoiceOptions(newOptions.options);
            setCorrectOption(newOptions.correctOption);
            setOptionsSetFromAI(false); // Options came from fallback
          }
        }
      }

      // Create AI message with feedback
          const aiMessage: MessageType = {
            id: uuidv4(),
            sender: "ai",
        text: feedbackResponse,
            timestamp: new Date(),
          };
          
          setMessages((prev) => [...prev, aiMessage]);
      
      // Add AI message to previous messages for context
      setPreviousMessages((prev) => [...prev, { role: 'assistant', content: feedbackResponse }]);
      
      // Update teaching state based on whether the answer was correct
      const nextState = calculateNextTeachingState(teachingState, actuallyCorrect);
      setTeachingState(nextState);
      
          setIsLoading(false);
      setShowFeedback(false);
      setSelectedOption(null);
          
      // Scroll to the bottom to show the new messages
      scrollToBottom();
        }, 1000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Add the user message to the messages array
    const userMessage: MessageType = {
      id: uuidv4(),
      sender: "user",
      text: inputValue,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    try {
      // Get the API key from localStorage
      const apiKey = localStorage.getItem("openai_api_key");

      if (apiKey) {
        // Prepare previous messages for context
        const prevMessages = messages
          .filter((msg) => msg.sender === "user" || msg.sender === "ai")
          .slice(-6) // Only include the last 6 messages for context
          .map((msg) => ({
            role: msg.sender === "user" ? "user" as const : "assistant" as const,
            content: msg.text,
          }));

        // Get the topic name in a readable format for reinforcement
        const readableTopicName = teachingState.topic.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        
        // Add topic reinforcement to the user's message
        const topicReinforcement = `The user's message is: "${inputValue}". Remember, you are teaching the topic of "${readableTopicName}" in ${getLanguageName(languageId)}. Stay focused ONLY on teaching content related to ${readableTopicName}. 

IMPORTANT PRONUNCIATION FORMATTING:
- ALWAYS use CAPITAL LETTERS for the stressed syllables (e.g., "YAH sahs" not "yah sahs" or "éna")
- Use simple English phonetics that an English speaker can easily read and pronounce
- Break longer words into syllables with hyphens if needed (e.g., "kal-ee-ME-ra")
- NEVER use accent marks in pronunciation guides (like é, í, ó) - use CAPITAL letters instead
- Be consistent with this format for ALL words and phrases

Include a "Practice:" section with 4 options in quotes at the end of your response, with the first option being the correct answer.`;

        // Get response from OpenAI
        const response = await getLanguageLearningResponse(
          topicReinforcement,
          {
            languageId,
            stage: teachingState.topic,
            progress: teachingState.progress,
            previousMessages: prevMessages,
            skillLevel: teachingState.level as 'beginner' | 'intermediate' | 'advanced'
          }
        );

        // Add the AI response to messages
      const aiMessage: MessageType = {
        id: uuidv4(),
        sender: "ai",
          text: response,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);

        // Extract options from the AI response
        const { options, correctOption, cleanedResponse } = extractOptionsFromResponse(response);
        console.log("Extracted options:", options, "Correct option:", correctOption);

        // Update the multiple choice options
        setMultipleChoiceOptions(options);
        setCorrectOption(correctOption);
        setShowMultipleChoice(true);
      } else {
        // If no API key, use mock response
        setTimeout(() => {
          const mockResponse = getMockResponse(languageId, inputValue);
          const aiMessage: MessageType = {
            id: uuidv4(),
            sender: "ai",
            text: mockResponse,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);

          // Extract options from the mock response
          const { options, correctOption } = extractOptionsFromResponse(mockResponse);
          
          // Update the multiple choice options
          setMultipleChoiceOptions(options);
          setCorrectOption(correctOption);
          setShowMultipleChoice(true);
        }, 1000);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add an error message
      const errorMessage: MessageType = {
        id: uuidv4(),
        sender: "system",
        text: "Sorry, there was an error processing your message. Please try again.",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const getResponseBasedOnTeachingState = (languageId: string, message: string, state: { level: string; topic: string; progress: number }): string => {
    if (languageId !== "el") {
      return getMockResponse(languageId, message);
    }
    
    const { level, topic, progress } = state;
    
    if (topic === "greeting") {
      const greetingResponses = [
        "Great! Now let's learn how to say 'My name is...' in Greek. It's 'Με λένε...' (pronounced as 'YAH-soo'). Try introducing yourself!",
        "Perfect! Another common greeting is 'How are you?' which in Greek is 'Τι κάνεις;' (pronounced as 'Tee KAH-nis'). Try asking me how I am!",
        "Excellent! I'm doing well, thank you. In Greek, 'I'm good' is 'Είμαι καλά' (pronounced as 'EE-meh kah-LAH'). Now let's learn some basic phrases!"
      ];
      return progress < greetingResponses.length ? greetingResponses[progress] : greetingResponses[0];
    }
    
    if (topic === "basic-phrases") {
      const basicPhraseResponses = [
        "Let's learn some useful phrases. 'Thank you' in Greek is 'Ευχαριστώ' (pronounced as 'Ef-kha-ri-STO'). Try saying thank you!",
        "Great job! 'Yes' in Greek is 'Ναι' (pronounced as 'NEH') and 'No' is 'Όχι' (pronounced as 'O-hee'). Can you practice these?",
        "Excellent! 'Please' in Greek is 'Παρακαλώ' (pronounced as 'Para-ka-LO'). This word is also used to say 'You're welcome'. Try saying please!",
        "You're doing great! Now let's try to form a simple sentence. 'I would like water' is 'Θα ήθελα νερό' (pronounced as 'Tha EE-the-la ne-RO'). Try asking for water!"
      ];
      return progress < basicPhraseResponses.length ? basicPhraseResponses[progress] : basicPhraseResponses[0];
    }
    
    if (topic === "simple-conversation") {
      const simpleConversationResponses = [
        "Perfect! Now let's learn how to ask 'Where is...?' which is 'Πού είναι...?' (pronounced as 'Poo EE-neh'). For example, 'Where is the bathroom?' is 'Πού είναι η τουαλέτα;' Try asking where something is!",
        "Good job! Let's learn numbers. 1-5 in Greek are: 'ένα' (ena), 'δύο' (dio), 'τρία' (tria), 'τέσσερα' (tessera), 'πέντε' (pente). Can you count from 1 to 5?",
        "Amazing! Now let's try to understand a simple question. If I ask 'Από πού είσαι;' I'm asking 'Where are you from?'. Try answering in Greek with 'Είμαι από...' (I am from...)",
        "You're making great progress! Now let's practice everything we've learned with a simple conversation!"
      ];
      return progress < simpleConversationResponses.length ? simpleConversationResponses[progress] : simpleConversationResponses[0];
    }
    
    const practiceResponses = [
      "Πολύ καλά! (Very good!) Let's practice. Can you say 'I would like coffee' in Greek?",
      "Excellent! 'I would like coffee' is 'Θα ήθελα καφέ'. How would you ask 'How much is it?' in Greek?",
      "'How much is it?' is 'Πόσο κάνει;' Let's try another. How would you say 'Nice to meet you' in Greek?",
      "'Nice to meet you' is 'Χάρηκα για τη γνωριμία'. You're doing great! Can you remember how to say 'thank you'?",
      "Perfect! Ευχαριστώ (Thank you) for practicing with me! Let's keep learning more phrases. How would you ask for directions to the beach in Greek?",
      "'Where is the beach?' would be 'Πού είναι η παραλία;' How about asking for the check at a restaurant?",
      "'The check, please' is 'Το λογαριασμό, παρακαλώ'. You're making excellent progress! Let's continue our practice."
    ];
    
    return practiceResponses[progress % practiceResponses.length];
  };

  const getMockResponse = (languageId: string, message: string): string => {
    const responses: Record<string, string[]> = {
      es: [
        "¡Muy bien! Sigamos practicando español.",
        "¿Podrías decirme más sobre eso?",
        "Interesante. ¿Cómo dirías esto en español?",
        "Excelente progreso. Ahora intentemos algo más complejo.",
      ],
      fr: [
        "Très bien ! Continuons à pratiquer le français.",
        "Pourrais-tu m'en dire plus à ce sujet ?",
        "Intéressant. Comment dirais-tu cela en français ?",
        "Excellent progrès. Essayons quelque chose de plus complexe maintenant.",
      ],
      de: [
        "Sehr gut! Lass uns weiter Deutsch üben.",
        "Könntest du mir mehr darüber erzählen?",
        "Interessant. Wie würdest du das auf Deutsch sagen?",
        "Ausgezeichneter Fortschritt. Versuchen wir jetzt etwas Komplexeres.",
      ],
      el: [
        "Πολύ καλά! Ας συνεχίσουμε να εξασκούμαστε στα ελληνικά.",
        "Θα μπορούσες να μου πεις περισσότερα γι' αυτό;",
        "Ενδιαφέρον. Πώς θα το έλεγες αυτό στα ελληνικά;",
        "Εξαιρετική πρόοδος. Ας δοκιμάσουμε κάτι πιο σύνθετο τώρα.",
      ],
    };
    
    const defaultResponses = [
      "I understand. Let's continue practicing.",
      "Could you tell me more about that?",
      "That's interesting. How would you say this in my language?",
      "Great progress. Let's try something more challenging now.",
    ];
    
    const languageResponses = responses[languageId] || defaultResponses;
    return languageResponses[Math.floor(Math.random() * languageResponses.length)];
  };

  // Toggle between multiple choice and typing mode
  const toggleInputMode = () => {
    const newMode = !multipleChoiceMode;
    setMultipleChoiceMode(newMode);
    
    // If switching to multiple choice mode, set up the options
    if (newMode) {
      setShowMultipleChoice(true);
      setShowFeedback(false);
      
      // If we already have options from the AI, use them
      if (multipleChoiceOptions.length > 0 && correctOption) {
        // Options are already set up, just show them
      } else if (apiKeyConfigured) {
        // If API key is configured but we don't have options, get them from the AI
        const lastAiMessage = [...messages].reverse().find(m => m.sender === "ai");
        if (lastAiMessage) {
          const { options, correctOption } = extractOptionsFromResponse(lastAiMessage.text);
          setMultipleChoiceOptions(options);
          setCorrectOption(correctOption);
        } else {
          // If no AI messages yet, send an initial message
          sendInitialAIMessage(languageId);
        }
      } else {
        // Fallback to pre-built options if API key is not configured
        setupMultipleChoiceOptions(languageId, teachingState.level, teachingState.topic, teachingState.progress);
      }
    } else {
      // If switching to typing mode, hide the multiple choice options
      setShowMultipleChoice(false);
      setSelectedOption(null);
      setShowFeedback(false);
    }
  };

  // Function to handle topic selection from the LessonProgress component
  const handleTopicSelect = (selectedLevel: string, selectedTopic: string) => {
    console.log(`Switching to topic: ${selectedTopic} at level: ${selectedLevel}`);
    
    // Update the teaching state with the new level and topic
    setTeachingState({
      level: selectedLevel,
      topic: selectedTopic,
      progress: 0, // Reset progress when switching topics
      completed: teachingState.completed
    });
    
    // Close the lesson progress view
    setShowLessonProgress(false);
    
    // Add a system message indicating the topic change
    const systemMessage: MessageType = {
      id: uuidv4(),
      sender: "system",
      text: `Switching to ${selectedLevel} level: ${selectedTopic.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`,
      timestamp: new Date(),
    };
    
    // Clear previous messages and start fresh
    setMessages([systemMessage]);
    setPreviousMessages([]);
    
    // Reset multiple choice state
    setShowMultipleChoice(false);
    setSelectedOption(null);
    setShowFeedback(false);
    
    // Setup new multiple choice options for the selected topic
    setupMultipleChoiceOptions(languageId, selectedLevel, selectedTopic, 0);
    
    // Get the topic name in a readable format
    const readableTopicName = selectedTopic.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    // Trigger a new message from the AI to introduce the topic
    const introPrompt = `You are now teaching the topic of "${readableTopicName}" at a ${selectedLevel} level in ${getLanguageName(languageId)}. 
    
IMPORTANT: You MUST ONLY teach content related to "${readableTopicName}" and NEVER deviate from this topic in your responses.

Format your response with line breaks between sections like this:
[Friendly greeting and introduction to ${readableTopicName}]

${getLanguageName(languageId)} phrase: [word or phrase in ${getLanguageName(languageId)} related to ${readableTopicName}]
Pronunciation: [CAPITALIZE the stressed syllables, like "YAH sahs" for "Γεια σας" - use English phonetics that are easy to read]
English meaning: [translation]
Example: [simple example of usage]

IMPORTANT PRONUNCIATION FORMATTING:
- ALWAYS use CAPITAL LETTERS for the stressed syllables (e.g., "YAH sahs" not "yah sahs" or "éna")
- Use simple English phonetics that an English speaker can easily read and pronounce
- Break longer words into syllables with hyphens if needed (e.g., "kal-ee-ME-ra")
- NEVER use accent marks in pronunciation guides (like é, í, ó) - use CAPITAL letters instead
- Be consistent with this format for ALL words and phrases

IMPORTANT: You MUST include a section called "Practice:" followed by EXACTLY 4 multiple choice options for practice. Format each option in quotes like this:
"First option" (this should be the correct answer)
"Second option"
"Third option"
"Fourth option"

IMPORTANT FORMATTING AND CONTENT RULES:
- Be warm, friendly and conversational, like a helpful tutor
- Do NOT include numbers in the options themselves
- Each option should be a complete, short phrase (1-5 words)
- Each option MUST be in quotes on its own line
- Options MUST be relevant to ${readableTopicName} and what you just taught
- All options should be in ${getLanguageName(languageId)} (except for the correct answer which can be in both languages)
- Use line breaks between different sections of your response
- The "Practice:" section MUST be included and MUST contain 4 options in quotes
- The first option MUST be the correct answer
- NEVER teach content outside the ${readableTopicName} topic
- For the topic "${readableTopicName}", focus ONLY on teaching ${readableTopicName}-related vocabulary and phrases`;
    
    // Set loading state
    setIsLoading(true);
    
    console.log("Sending intro prompt for new topic:", introPrompt);
    
    // Get response from OpenAI
    getLanguageLearningResponse(introPrompt, {
      languageId,
      stage: selectedTopic,
      progress: 0,
      previousMessages: [],
      skillLevel: selectedLevel as 'beginner' | 'intermediate' | 'advanced'
    }).then((response) => {
      console.log("Received AI response for new topic:", response);
      
      // Add the AI response to messages
      const aiMessage: MessageType = {
        id: uuidv4(),
        sender: "ai",
        text: response,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      
      // Extract options from the AI response
      const { options, correctOption } = extractOptionsFromResponse(response);
      console.log("Extracted options:", options, "Correct option:", correctOption);
      
      // Update the multiple choice options
      setMultipleChoiceOptions(options);
      setCorrectOption(correctOption);
      setShowMultipleChoice(true);
      
      // Set loading state to false
      setIsLoading(false);
    }).catch((error) => {
      console.error("Error getting AI response:", error);
      setIsLoading(false);
      
      // Use fallback options
      setupMultipleChoiceOptions(languageId, selectedLevel, selectedTopic, 0);
      setShowMultipleChoice(true);
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Add a button to toggle the lesson progress view */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">{getLanguageName(languageId)} Learning</h2>
        <Button
          variant="outline"
          onClick={() => setShowLessonProgress(!showLessonProgress)}
        >
          {showLessonProgress ? "Hide Curriculum" : "Show Curriculum"}
        </Button>
      </div>
      
      {/* Show the lesson progress component when showLessonProgress is true */}
      {showLessonProgress && (
        <div className="p-4">
          <LessonProgress
            level={teachingState.level}
            topic={teachingState.topic}
            progress={teachingState.progress}
            completed={teachingState.completed}
            onSelectTopic={handleTopicSelect}
            curriculum={curriculum}
          />
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {showMultipleChoice && multipleChoiceMode && (
          <div className="px-4">
              <MultipleChoiceOptions 
                options={multipleChoiceOptions}
                correctOption={correctOption}
                onSelect={handleMultipleChoiceSelect}
                showFeedback={showFeedback}
                selectedOption={selectedOption}
              />
          </div>
        )}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-secondary rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 glassmorphism shadow-soft">
        <div className="flex justify-start mb-2">
          <button
            onClick={toggleInputMode}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <span>{multipleChoiceMode ? "Switch to typing" : "Switch to multiple choice"}</span>
          </button>
        </div>
        
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message or use the options above..."
            className="flex-1 px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={showMultipleChoice && multipleChoiceMode}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || (showMultipleChoice && multipleChoiceMode)}
            className="bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white rounded-full p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
      </form>
      </div>
    </div>
  );
};

export default ChatInterface;
