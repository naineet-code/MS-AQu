import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/hooks/useChatHistory";
// Chat history icons
import { X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface ChatHistoryProps {
  messages: ChatMessage[];
  onClear: () => void;
  onClose?: () => void;
}

export default function ChatHistory({ messages, onClear, onClose }: ChatHistoryProps) {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };
  
  const truncateMessage = (message: string, limit = 100) => {
    if (message.length <= limit) return message;
    return message.slice(0, limit) + '...';
  };

  return (
    <motion.div
      key={`chat-history-${theme}`}
      className="fixed bottom-20 right-4 z-[9998] w-80 sm:w-96 max-h-[70vh] overflow-hidden"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`backdrop-blur-xl shadow-2xl overflow-hidden border-2 transition-all duration-300 ${
        isDark 
          ? 'bg-gray-900/95 border-gray-600' 
          : 'bg-white/95 border-gray-400'
      }`}>
        <div className={`p-4 flex items-center justify-between border-b transition-colors duration-300 ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`font-medium text-lg transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Chat History
          </h3>
          <div className="flex gap-2">
            {/* Clear History */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClear}
                  className={`h-8 w-8 transform transition-all duration-300 hover:scale-110 ${
                    isDark 
                      ? 'hover:bg-gray-700 text-gray-300 hover:text-red-400' 
                      : 'hover:bg-gray-100 text-gray-700 hover:text-red-600'
                  }`}
                  aria-label="Clear chat history"
                >
                  <Trash2 className="h-5 w-5 transition-colors duration-300" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear History</TooltipContent>
            </Tooltip>
            {/* Close History */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className={`h-8 w-8 transform transition-all duration-300 hover:scale-110 ${
                    isDark 
                      ? 'hover:bg-gray-700 text-gray-300 hover:text-gray-100' 
                      : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                  }`}
                  aria-label="Close chat history"
                >
                  <X className="h-5 w-5 transition-colors duration-300" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close History</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="overflow-y-auto p-4 max-h-[60vh] space-y-3">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <motion.div 
                key={`${msg.id}-${theme}`}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  msg.isUser 
                    ? `ml-6 border ${
                        isDark 
                          ? 'bg-purple-900/40 border-purple-500/50' 
                          : 'bg-purple-100/60 border-purple-300/60'
                      }` 
                    : `mr-6 border ${
                        isDark 
                          ? 'bg-blue-900/40 border-blue-500/50' 
                          : 'bg-blue-100/60 border-blue-300/60'
                      }`
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Message content */}
                <div className={`text-sm mb-2 transition-colors duration-300 ${
                  isDark ? 'text-white/90' : 'text-gray-900/90'
                }`}>
                  {msg.isUser ? (
                    // User messages: always show full text (questions are usually short)
                    <p>{msg.message}</p>
                  ) : (
                    // Bot messages: truncate long answers
                    <>
                      <p>
                        {expandedMessages.has(msg.id) 
                          ? msg.message 
                          : truncateMessage(msg.message)
                        }
                      </p>
                      {msg.message.length > 100 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMessageExpansion(msg.id)}
                          className={`mt-2 p-1 h-auto text-xs transition-all duration-300 hover:scale-105 ${
                            isDark 
                              ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30' 
                              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-100/50'
                          }`}
                        >
                          {expandedMessages.has(msg.id) ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              Show More
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
                {/* Timestamp */}
                <p className={`text-xs transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                </p>
              </motion.div>
            ))
          ) : (
            <motion.p 
              className={`text-center py-4 transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              No messages yet
            </motion.p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
