
import { useState, useEffect } from 'react';
import { aiFormatter } from '@/utils/aiFormatter';

export interface ChatMessage {
  id: string;
  message: string;
  formattedMessage?: string; // Pre-formatted version to avoid re-processing
  timestamp: number;
  isUser: boolean;
  version?: number; // Version for migration support
}

export function useChatHistory() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('chatHistory');
      if (stored) {
        const parsedHistory = JSON.parse(stored);
        // Migrate old messages to new format with formatted versions
        return parsedHistory.map((msg: ChatMessage) => {
          if (!msg.formattedMessage && !msg.version) {
            return {
              ...msg,
              formattedMessage: aiFormatter.formatAnswer(msg.message),
              version: 1
            };
          }
          return msg;
        });
      }
      return [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const addMessage = (message: string, isUser: boolean) => {
    // Pre-format the message and store both versions
    const formattedMessage = aiFormatter.formatAnswer(message);
    
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      message,
      formattedMessage,
      timestamp: Date.now(),
      isUser,
      version: 1
    };
    setChatHistory(prevHistory => [...prevHistory, newMessage]);
  };

  const clearHistory = () => {
    setChatHistory([]);
  };

  // Helper function to get formatted message without re-processing
  const getFormattedMessage = (message: ChatMessage): string => {
    // If we have a pre-formatted version, use it
    if (message.formattedMessage) {
      return message.formattedMessage;
    }
    
    // Fallback: format on-the-fly (for legacy messages)
    return aiFormatter.formatAnswer(message.message);
  };

  return { 
    chatHistory, 
    addMessage, 
    clearHistory,
    getFormattedMessage
  };
}
