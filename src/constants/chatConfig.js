const chatConfig = {
  MODEL: "mistralai/Mistral-7B-Instruct-v0.3",
  
  GROQ_API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY || "",
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "",
  HF_API_KEY: process.env.EXPO_PUBLIC_HF_API_KEY || process.env.HF_TOKEN || "",
  
  GROQ_ENDPOINT: "https://api.groq.com/openai/v1/chat/completions",
  
  SYSTEM_PROMPT: "You are a helpful AI tutor inside a learning app. Answer questions clearly and concisely. Keep answers under 150 words unless the user asks for detail. If the user asks something completely unrelated to learning or the current topic, politely redirect them back.",
  
  PARAMETERS: {
    max_tokens: 300,
    temperature: 0.7,
    top_p: 0.9,
  },
  
  LIMITS: {
    MAX_HISTORY_MESSAGES: 10,
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 2000,
    REQUEST_TIMEOUT_MS: 30000,
    MAX_INPUT_LENGTH: 500
  },
  
  STORAGE_KEY: "@chatbot_history"
};

export default chatConfig;
