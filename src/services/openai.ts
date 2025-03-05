import OpenAI from 'openai';

// Function to get the API key from environment variables or localStorage
function getApiKey(): string | undefined {
  // First try to get from environment variables
  const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (envApiKey && envApiKey !== 'your_openai_api_key_here') {
    return envApiKey;
  }
  
  // If not found or is the placeholder, try localStorage
  try {
    const localApiKey = localStorage.getItem('openai_api_key');
    return localApiKey || undefined;
  } catch (error) {
    // In case localStorage is not available (e.g., in SSR)
    return undefined;
  }
}

// Initialize the OpenAI client with a function to get the API key dynamically
// Use a dummy key if none is available to prevent initialization errors
const openai = new OpenAI({
  apiKey: getApiKey() || 'dummy_key_for_initialization',
  dangerouslyAllowBrowser: true // This is needed for client-side usage
});

// Interface for language learning context
interface LanguageLearningContext {
  languageId: string;
  stage: string; // This will now represent the topic
  progress: number;
  previousMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Get a response from OpenAI for language learning
 * @param message The user's message
 * @param context The language learning context
 * @returns Promise with the AI response
 */
export async function getLanguageLearningResponse(
  message: string,
  context: LanguageLearningContext
): Promise<string> {
  try {
    // Update the API key before making the request
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }
    
    // Set the API key
    openai.apiKey = apiKey;
    
    // Create a system message that explains the context
    const systemMessage = createSystemPrompt(context.languageId, context.stage, context.progress, context.skillLevel);
    
    // Prepare the messages array for the API call
    const messages = [
      { role: 'system', content: systemMessage },
      ...context.previousMessages,
      { role: 'user', content: message }
    ];

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // You can change this to gpt-4 for better results
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 300
    });

    // Return the response text
    return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return 'Sorry, there was an error communicating with the AI service. Please try again later.';
  }
}

/**
 * Create a system prompt based on the language, teaching stage, and skill level
 */
function createSystemPrompt(languageId: string, topic: string, progress: number, skillLevel: string = 'beginner'): string {
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

  const languageName = languageNames[languageId] || languageId;
  
  let basePrompt = `You are a helpful and encouraging ${languageName} language teacher. 
Your goal is to teach the user ${languageName} in a conversational way.
Keep your responses concise, clear, and focused on teaching ONE concept at a time.

The user's skill level is: ${skillLevel}.

IMPORTANT FORMATTING INSTRUCTIONS:
1. Start with a longer, enthusiastic greeting that shows your personality as a fun and energetic language teacher
   - THIS GREETING MUST BE 2-3 FULL SENTENCES followed by TWO NEWLINE CHARACTERS (\\n\\n) before the lesson content
   - Make it very warm, welcoming, and show excitement about teaching the language!
2. Be very warm, encouraging and conversational in your tone - use exclamation marks and show excitement!
3. Teach ONE new word or phrase only
4. Format the word/phrase with line breaks between each section EXACTLY like this:
   [2-3 sentence enthusiastic greeting and energetic introduction as a teacher]
   \\n
   \\n
   ${languageName} phrase: [word in ${languageName}]
   Pronunciation: [CAPITALIZE the stressed syllables, like "YAH sahs" for "Γεια σας" - use English phonetics that are easy to read]
   English meaning: [translation]
   Example: [simple example of usage with context]
   [Add an encouraging line about practicing this new phrase]
5. Each section should be on its own line with no hyphens or bullets
6. AFTER the visible content above, include a hidden "Practice:" section that will not be displayed to the user but will be used to generate multiple choice options
7. For multiple choice practice, list 3-4 options clearly marked with quotes

PRONUNCIATION FORMATTING RULES:
- ALWAYS use CAPITAL LETTERS for the stressed syllables (e.g., "YAH sahs" not "yah sahs" or "éna")
- Use simple English phonetics that an English speaker can easily read and pronounce
- Break longer words into syllables with hyphens if needed (e.g., "kal-ee-ME-ra")
- Be consistent with this format across ALL lessons and topics

Make your teaching style:
- Very enthusiastic and energetic
- Conversational and natural, like a friendly tutor
- Simple and direct
- Focused on one concept at a time
- Easy to understand for beginners
- Encouraging and positive

DO NOT:
- Introduce multiple concepts at once
- Use complex grammatical explanations
- Write overly long responses
- Use technical linguistic terminology
- Put everything in one paragraph - use line breaks between sections
- Use accent marks in pronunciation guides (like é, í, ó) - use CAPITAL letters instead
`;

  // Add skill level specific instructions
  if (skillLevel === 'beginner') {
    basePrompt += `
Since the user is a beginner, focus on simple phrases and basic vocabulary.
Use short sentences and provide clear explanations.
Repeat important concepts and be patient.
`;
  } else if (skillLevel === 'intermediate') {
    basePrompt += `
Since the user has intermediate knowledge, you can introduce more complex grammar and vocabulary.
You can have longer conversations and expect the user to understand more complex phrases.
Challenge the user appropriately but still provide support when needed.
`;
  } else if (skillLevel === 'advanced') {
    basePrompt += `
Since the user is advanced, you can use complex grammar and sophisticated vocabulary.
You can discuss a wide range of topics and expect the user to understand nuanced expressions.
Focus on refining the user's fluency and correcting subtle mistakes.
`;
  }

  // Add topic-specific instructions
  const topicInstructions: Record<string, string> = {
    // Beginner topics
    'greetings': `
You are teaching basic greetings in ${languageName}.
Focus on simple phrases like "hello", "good morning", "good evening", and "goodbye".
`,
    'introductions': `
You are teaching how to introduce oneself in ${languageName}.
Focus on phrases like "my name is", "nice to meet you", "where are you from", and "I am from".
`,
    'numbers': `
You are teaching numbers in ${languageName}.
Focus on numbers 1-20, and then how to ask about prices or quantities.
`,
    'common-phrases': `
You are teaching common everyday phrases in ${languageName}.
Focus on phrases like "please", "thank you", "excuse me", and "I'm sorry".
`,
    'foods': `
You are teaching food vocabulary in ${languageName}.
Focus on common food items, how to order in a restaurant, and express preferences.
`,
    'colors': `
You are teaching colors in ${languageName}.
Focus on basic colors and how to describe objects using colors.
`,
    'family': `
You are teaching family-related vocabulary in ${languageName}.
Focus on terms for family members and how to talk about your family.
`,

    // Intermediate topics
    'travel': `
You are teaching travel-related vocabulary in ${languageName}.
Focus on transportation, accommodation, and asking for directions.
`,
    'shopping': `
You are teaching shopping vocabulary in ${languageName}.
Focus on clothing, sizes, prices, and how to interact with shop assistants.
`,
    'dining': `
You are teaching dining vocabulary in ${languageName}.
Focus on restaurant interactions, ordering food, and discussing preferences.
`,
    'directions': `
You are teaching how to give and ask for directions in ${languageName}.
Focus on location prepositions, landmarks, and navigation vocabulary.
`,
    'weather': `
You are teaching weather-related vocabulary in ${languageName}.
Focus on describing different weather conditions and seasons.
`,
    'hobbies': `
You are teaching hobby-related vocabulary in ${languageName}.
Focus on activities, sports, and expressing likes and dislikes.
`,
    'time-expressions': `
You are teaching time expressions in ${languageName}.
Focus on telling time, days of the week, months, and scheduling.
`,
    'daily-routine': `
You are teaching vocabulary related to daily routines in ${languageName}.
Focus on common activities, reflexive verbs, and time adverbs.
`,

    // Advanced topics
    'opinions': `
You are teaching how to express opinions in ${languageName}.
Focus on agreement, disagreement, and nuanced viewpoints.
`,
    'culture': `
You are teaching cultural aspects of ${languageName}-speaking regions.
Focus on traditions, customs, and cultural expressions.
`,
    'news': `
You are teaching how to discuss current events in ${languageName}.
Focus on news vocabulary, reporting verbs, and expressing reactions.
`,
    'storytelling': `
You are teaching storytelling in ${languageName}.
Focus on narrative tenses, sequencing, and descriptive language.
`,
    'idioms': `
You are teaching common idioms in ${languageName}.
Focus on figurative expressions and their meanings in different contexts.
`,
    'debate': `
You are teaching debate vocabulary in ${languageName}.
Focus on persuasive language, counterarguments, and formal expressions.
`,
    'professional': `
You are teaching professional vocabulary in ${languageName}.
Focus on business terms, job interviews, and workplace communication.
`,
    'slang': `
You are teaching common slang and colloquial expressions in ${languageName}.
Focus on informal language used by native speakers in casual settings.
`,
    'literature': `
You are teaching literary terms and discussing literature in ${languageName}.
Focus on analyzing texts, poetry, and literary devices.
`
  };

  // Add the topic-specific instructions if available
  if (topicInstructions[topic]) {
    basePrompt += topicInstructions[topic];
  } else {
    // Fallback to the old stage-based instructions for backward compatibility
    if (topic === 'greeting') {
      basePrompt += `
You are teaching basic greetings in ${languageName}.
Focus on simple phrases like "hello", "how are you", and "my name is".
`;
    } else if (topic === 'basic-phrases') {
      basePrompt += `
You are teaching basic useful phrases in ${languageName}.
Focus on phrases like "thank you", "yes/no", "please", and simple requests.
`;
    } else if (topic === 'simple-conversation') {
      basePrompt += `
You are teaching simple conversation skills in ${languageName}.
Focus on questions, numbers, and basic conversation starters.
`;
    } else if (topic === 'practice') {
      basePrompt += `
You are helping the user practice what they've learned in ${languageName}.
Ask questions that allow them to use the phrases they've learned.
Provide gentle corrections when they make mistakes.
`;
    }
  }

  // Add a note about the user's progress
  basePrompt += `
The user is at progress level ${progress} in this topic.
Higher progress means they are more familiar with the current topic.
`;

  // Add quiz instructions if the progress is at a quiz point (every 5th lesson)
  if (progress % 5 === 4) {
    basePrompt += `
THIS IS A QUIZ LESSON. Create a comprehensive quiz that tests what the user has learned about ${topic} so far.
Include 3-5 multiple choice questions that test different aspects of this topic.
Format each question clearly with numbered options.
After the user answers, provide detailed feedback explaining why their answer was correct or incorrect.
`;
  }

  return basePrompt;
}

/**
 * Check if the OpenAI API key is configured
 */
export function isApiKeyConfigured(): boolean {
  return !!getApiKey();
} 