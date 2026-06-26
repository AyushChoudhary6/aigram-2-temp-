export const formatTimestamp = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  
  const date = new Date(timestamp);
  const today = new Date();
  
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
};

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

export const sanitizeInput = (text) => {
  if (!text) return "";
  
  // Trim whitespace, remove HTML tags and null bytes
  let cleaned = text.trim().replace(/<[^>]*>?/gm, '').replace(/\0/g, '');
  
  const lowerCleaned = cleaned.toLowerCase();
  
  // Security Guards
  if (lowerCleaned.includes("ignore previous instructions")) {
    throw new Error("INVALID_INPUT");
  }
  if (lowerCleaned.match(/you are now\s+\w+/)) {
    throw new Error("INVALID_INPUT");
  }
  
  // Empty or punctuation-only check
  if (cleaned.length === 0 || /^[^a-zA-Z0-9]+$/.test(cleaned)) {
    throw new Error("INVALID_INPUT");
  }
  
  return cleaned;
};

export const groupMessagesByDate = (messages) => {
  const groups = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  messages.forEach(msg => {
    const msgDate = new Date(msg.timestamp).toDateString();
    let label = msgDate;
    
    if (msgDate === today) label = "Today";
    else if (msgDate === yesterday) label = "Yesterday";
    else {
      label = new Date(msg.timestamp).toLocaleDateString([], { 
        day: '2-digit', month: 'short', year: 'numeric' 
      });
    }
    
    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
  });
  
  return Object.keys(groups).map(dateLabel => ({
    dateLabel,
    messages: groups[dateLabel]
  }));
};

export const isErrorMessage = (message) => {
  return message?.status === "error";
};
