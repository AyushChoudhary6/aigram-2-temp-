import chatConfig from '../constants/chatConfig';

export async function sendGroqMessage(messages) {
  console.log('[Groq] Starting sendGroqMessage');
  console.log('[Groq] API Key available:', !!chatConfig.GROQ_API_KEY);
  console.log('[Groq] Messages:', messages);
  
  if (!chatConfig.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing');
  }

  const requestBody = {
    model: chatConfig.MODEL,
    messages: [
      { role: 'system', content: chatConfig.SYSTEM_PROMPT },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ],
    max_tokens: chatConfig.PARAMETERS.max_tokens,
    temperature: chatConfig.PARAMETERS.temperature,
    top_p: chatConfig.PARAMETERS.top_p
  };
  
  console.log('[Groq] Request body:', requestBody);

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${chatConfig.GROQ_API_KEY}`
    },
    body: JSON.stringify(requestBody)
  });

  console.log('[Groq] Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: { message: errorText } };
    }
    
    console.error('[Groq] Error response:', errorData);
    
    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    if (response.status === 401) {
      throw new Error('INVALID_TOKEN');
    }
    throw new Error(errorData.error?.message || 'Failed to get response');
  }

  const data = await response.json();
  console.log('[Groq] Success response:', data);
  
  return data.choices[0].message.content;
}
