import chatConfig from '../constants/chatConfig';

export async function sendGeminiMessage(messages) {
  console.log('[Gemini] Starting sendGeminiMessage');
  console.log('[Gemini] API Key available:', !!chatConfig.GEMINI_API_KEY);
  console.log('[Gemini] Messages:', messages);
  
  if (!chatConfig.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  // Convert the chat history to Gemini's format
  const formattedMessages = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const requestBody = {
    contents: [{
      role: 'user',
      parts: [{ text: chatConfig.SYSTEM_PROMPT }]
    }, ...formattedMessages],
    generationConfig: {
      maxOutputTokens: chatConfig.PARAMETERS.max_tokens,
      temperature: chatConfig.PARAMETERS.temperature,
      topP: chatConfig.PARAMETERS.top_p
    }
  };

  console.log('[Gemini] Request body:', requestBody);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${chatConfig.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  );

  console.log('[Gemini] Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: { message: errorText } };
    }
    
    console.error('[Gemini] Error response:', errorData);
    throw new Error(errorData.error?.message || 'Failed to get response');
  }

  const data = await response.json();
  console.log('[Gemini] Success response:', data);
  
  return data.candidates[0].content.parts[0].text;
}
