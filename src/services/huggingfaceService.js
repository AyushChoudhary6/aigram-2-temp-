import chatConfig from '../constants/chatConfig';

export async function sendHuggingFaceMessage(messages) {
  console.log('[Hugging Face] Starting sendHuggingFaceMessage');
  console.log('[Hugging Face] API Key available:', !!chatConfig.HF_API_KEY);
  console.log('[Hugging Face] Messages:', messages);
  
  if (!chatConfig.HF_API_KEY) {
    throw new Error('HF_API_KEY is missing');
  }

  // Build the prompt from the message history
  let prompt = chatConfig.SYSTEM_PROMPT + '\n\n';
  messages.forEach(msg => {
    if (msg.role === 'user') {
      prompt += `User: ${msg.content}\n`;
    } else if (msg.role === 'assistant') {
      prompt += `Assistant: ${msg.content}\n`;
    }
  });
  prompt += 'Assistant:';

  const requestBody = {
    inputs: prompt,
    parameters: {
      max_new_tokens: chatConfig.PARAMETERS.max_tokens,
      temperature: chatConfig.PARAMETERS.temperature,
      top_p: chatConfig.PARAMETERS.top_p,
      return_full_text: false
    }
  };

  console.log('[Hugging Face] Request body:', requestBody);

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${chatConfig.MODEL}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${chatConfig.HF_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    }
  );

  console.log('[Hugging Face] Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: { message: errorText } };
    }
    
    console.error('[Hugging Face] Error response:', errorData);
    throw new Error(errorData.error?.message || 'Failed to get response');
  }

  const data = await response.json();
  console.log('[Hugging Face] Success response:', data);
  
  // Extract the generated text
  let generatedText = data[0]?.generated_text || data.generated_text || '';
  // Clean up the response
  generatedText = generatedText.split('Assistant:').pop().trim();
  return generatedText;
}
