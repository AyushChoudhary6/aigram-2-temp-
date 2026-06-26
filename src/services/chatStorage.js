import AsyncStorage from '@react-native-async-storage/async-storage';
import chatConfig from '../constants/chatConfig';

export const saveHistory = async (messages) => {
  try {
    const validMessages = messages
      .filter(msg => msg.role !== 'system')
      .slice(-50); // Keep only last 50 messages to avoid bloat
      
    await AsyncStorage.setItem(chatConfig.STORAGE_KEY, JSON.stringify(validMessages));
  } catch (error) {
    if (__DEV__) console.log("Failed to save chat history:", error);
  }
};

export const loadHistory = async () => {
  try {
    const data = await AsyncStorage.getItem(chatConfig.STORAGE_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) return parsed;
    
    return [];
  } catch (error) {
    if (__DEV__) console.log("Failed to load chat history:", error);
    return [];
  }
};

export const clearHistory = async () => {
  try {
    await AsyncStorage.removeItem(chatConfig.STORAGE_KEY);
    return true;
  } catch (error) {
    if (__DEV__) console.log("Failed to clear chat history:", error);
    return false;
  }
};

export const exportHistory = (messages) => {
  return messages
    .filter(msg => msg.role !== 'system')
    .map(msg => `[${new Date(msg.timestamp).toISOString()}] ${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n\n');
};
