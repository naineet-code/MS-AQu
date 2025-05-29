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
      className="fixed bottom-20 right-4 z-30 w-80 sm:w-96 max-h-[70vh] overflow-hidden"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="backdrop-blur-xl bg-white/10 dark:bg-black/30 border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-white/10 dark:border-white/5">
          <h3 className={`font-medium text-lg ${isDark ? 'text-white' : 'text-black'}`}>Chat History</h3>
          <div className="flex gap-2">
            {/* Clear History */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClear}
                  className="h-8 w-8 transform transition-transform duration-200 ease-in-out hover:animate-hover-tada"
                  aria-label="Clear chat history"
                >
                  <Trash2 className="h-4 w-4 hover:animate-pulse" />
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
                  className="h-8 w-8 transform transition-transform duration-200 ease-in-out hover:animate-hover-tada"
                  aria-label="Close chat history"
                >
                  <X className="h-4 w-4 hover:animate-pulse" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close History</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="overflow-y-auto p-4 max-h-[60vh] space-y-3">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <div 
                key={msg.id}
                className={`p-3 rounded-lg ${
                  msg.isUser 
                    ? "bg-purple-500/20 ml-6 border border-purple-500/30" 
                    : "bg-blue-500/20 mr-6 border border-blue-500/30"
                }`}
              >
                {/* Message content */}
                <div className={`text-sm mb-2 ${isDark ? 'text-white/90' : 'text-black/90'}`}>
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
                          className={`mt-2 p-1 h-auto text-xs hover:bg-white/10 transform transition-transform duration-200 ease-in-out hover:animate-hover-tada ${
                            isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
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
                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                  {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                </p>
              </div>
            ))
          ) : (
            <p className={`text-center py-4 ${isDark ? 'text-white/50' : 'text-black/50'}`}>No messages yet</p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
