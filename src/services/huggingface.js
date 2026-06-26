import chatConfig from '../constants/chatConfig';

/**
 * Call the Groq API with the given messages array (OpenAI-compatible format).
 */
const callGroq = async (messages) => {
  const url = chatConfig.GROQ_ENDPOINT;
  const apiKey = chatConfig.GROQ_API_KEY;

  const fetchPromise = fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: chatConfig.MODEL,
      messages,
      temperature: chatConfig.PARAMETERS.temperature,
      max_tokens: chatConfig.PARAMETERS.max_tokens,
      top_p: chatConfig.PARAMETERS.top_p,
    }),
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), chatConfig.LIMITS.REQUEST_TIMEOUT_MS)
  );

  return Promise.race([fetchPromise, timeoutPromise]);
};

/**
 * Parse the Groq API response and return the generated text.
 */
const parseGroqResponse = async (response) => {
  if (response.status === 429) throw new Error('RATE_LIMIT');
  if (response.status === 401) throw new Error('INVALID_TOKEN');
  if (response.status === 400) throw new Error('BAD_REQUEST');
  if (response.status === 503) throw new Error('MODEL_LOADING');
  if (!response.ok) throw new Error('API_ERROR');

  const data = await response.json();
  if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('EMPTY_RESPONSE');
  }

  return data.choices[0].message.content.trim();
};

/**
 * Send a message to the AI and get a response using the Groq API.
 * @param {Array} messageHistory - Array of messages with role, content, status
 * @returns {Promise<string>} The AI response text
 */
export const sendMessage = async (messageHistory) => {
  const recentHistory = messageHistory.slice(-chatConfig.LIMITS.MAX_HISTORY_MESSAGES);

  // Build messages array for OpenAI-compatible API, filtering out error messages
  const messages = [
    { role: 'system', content: chatConfig.SYSTEM_PROMPT },
    ...recentHistory
      .filter((msg) => msg.status !== 'error')
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
  ];

  const response = await callGroq(messages);
  return await parseGroqResponse(response);
};

/**
 * Check if the AI model is ready.
 * Groq is always ready, so this returns immediately.
 */
export const checkModelStatus = async () => {
  return { loaded: true, estimatedTime: null };
};
