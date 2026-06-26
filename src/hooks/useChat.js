import { useReducer, useEffect, useCallback, useRef } from 'react';
import chatConfig from '../constants/chatConfig';
import { sendGeminiMessage } from '../services/geminiService';
import { sanitizeInput, truncateText } from '../utils/chatHelpers';
import { saveHistory, loadHistory as loadHistoryFromStorage, clearHistory as clearStorage } from '../services/chatStorage';

const initialState = {
  messages: [{
    id: 'welcome_msg',
    role: 'assistant',
    content: "Hi! I'm your AI tutor. How can I help you learn today?",
    timestamp: Date.now(),
    status: 'sent'
  }],
  input: '',
  loading: false,
  error: null
};

function chatReducer(state, action) {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    case 'CLEAR_CHAT':
      return { ...state, messages: [initialState.messages[0]] };
    case 'RESTORE_HISTORY':
      return { ...state, messages: action.payload.length > 0 ? action.payload : state.messages };
    case 'UPDATE_LAST_MESSAGE':
      const updatedMessages = [...state.messages];
      updatedMessages[updatedMessages.length - 1] = {
        ...updatedMessages[updatedMessages.length - 1],
        ...action.payload
      };
      return { ...state, messages: updatedMessages };
    case 'REMOVE_LAST_ASSISTANT_MESSAGE':
      const filtered = [...state.messages];
      if (filtered.length > 0 && filtered[filtered.length - 1].role === 'assistant') {
        filtered.pop();
      }
      return { ...state, messages: filtered };
    default:
      return state;
  }
}

export default function useChat() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const messagesRef = useRef(state.messages);

  useEffect(() => {
    messagesRef.current = state.messages;
  }, [state.messages]);

  const loadHistory = useCallback(async () => {
    try {
      const history = await loadHistoryFromStorage();
      if (history && history.length > 0) {
        dispatch({ type: 'RESTORE_HISTORY', payload: history });
      }
    } catch (e) {
      if (__DEV__) console.log("Failed to load history", e);
    }
  }, []);

  const checkModelOnMount = useCallback(async () => {
    // Groq doesn't need a model check, so we can skip this
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      await loadHistory();
      if (isMounted) await checkModelOnMount();
    };
    initialize();
    return () => { isMounted = false; };
  }, [loadHistory, checkModelOnMount]);

  const executeSend = async (textContent, isRetry = false, options = {}) => {
    if (state.loading) return;

    let cleanText;
    try {
      cleanText = sanitizeInput(textContent);
      cleanText = truncateText(cleanText, chatConfig.LIMITS.MAX_INPUT_LENGTH);
    } catch (error) {
      return; 
    }

    let userMsg;
    if (!isRetry) {
      userMsg = {
        id: Date.now() + Math.random().toString(),
        role: 'user',
        content: cleanText,
        timestamp: Date.now(),
        status: 'sending'
      };
      dispatch({ type: 'ADD_MESSAGE', payload: userMsg });
      dispatch({ type: 'SET_INPUT', payload: '' });
    } else {
      userMsg = messagesRef.current[messagesRef.current.length - 1]; // Assume user message is last
      dispatch({ type: 'UPDATE_LAST_MESSAGE', payload: { status: 'sending' } });
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    // The current history for calling Groq
    const historyToSent = isRetry ? messagesRef.current : [...messagesRef.current, userMsg];

    try {
      const filteredHistory = historyToSent.filter(m => m.role !== 'system');
      const responseText = await sendGeminiMessage(filteredHistory);
      
      dispatch({ type: 'UPDATE_LAST_MESSAGE', payload: { status: 'sent' } });
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: Date.now() + Math.random().toString(),
          role: 'assistant',
          content: responseText,
          timestamp: Date.now(),
          status: 'sent'
        }
      });
      // Call the success callback if provided
      if (options?.onSuccess) {
        options.onSuccess(responseText);
      }
      saveHistory([...historyToSent, { role: 'assistant', content: responseText, timestamp: Date.now(), status: 'sent' }]);
    } catch (error) {
      console.error('[useChat] Error sending message:', error);
      let friendlyError = error.message || "Something went wrong. Please try again.";

      dispatch({ type: 'SET_ERROR', payload: friendlyError });
      dispatch({ type: 'UPDATE_LAST_MESSAGE', payload: { status: 'error' } });
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: Date.now() + Math.random().toString(),
          role: 'assistant',
          content: friendlyError,
          timestamp: Date.now(),
          status: 'error'
        }
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleSend = (options = {}) => {
    executeSend(state.input, false, options);
  };

  const retryLastMessage = () => {
    dispatch({ type: 'REMOVE_LAST_ASSISTANT_MESSAGE' });
    const userMessage = messagesRef.current[messagesRef.current.length - 2]; 
    if (userMessage && userMessage.role === 'user') {
      executeSend(userMessage.content, true);
    }
  };

  const clearChat = useCallback(async () => {
    dispatch({ type: 'CLEAR_CHAT' });
    await clearStorage();
  }, []);

  const setInput = useCallback((text) => {
    dispatch({ type: 'SET_INPUT', payload: text });
  }, []);

  return {
    messages: state.messages,
    input: state.input,
    loading: state.loading,
    error: state.error,
    handleSend,
    clearChat,
    retryLastMessage,
    setInput
  };
}
