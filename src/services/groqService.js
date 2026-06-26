import chatConfig from '../constants/chatConfig';

export async function sendGroqMessage(messages) {
  if (!chatConfig.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${chatConfig.GROQ_API_KEY}`
    },
    body: JSON.stringify({
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
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    if (response.status === 401) {
      throw new Error('INVALID_TOKEN');
    }
    throw new Error(errorData.error?.message || 'Failed to get response');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
