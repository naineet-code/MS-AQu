
import { useState, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  message: string;
  timestamp: number;
  isUser: boolean;
}

export function useChatHistory() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chatHistory');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const addMessage = (message: string, isUser: boolean) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      message,
      timestamp: Date.now(),
      isUser,
    };
    setChatHistory(prevHistory => [...prevHistory, newMessage]);
  };

  const clearHistory = () => {
    setChatHistory([]);
  };

  return { 
    chatHistory, 
    addMessage, 
    clearHistory 
  };
}
