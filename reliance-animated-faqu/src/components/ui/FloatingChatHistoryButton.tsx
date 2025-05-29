import React, { memo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { History } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface FloatingChatHistoryButtonProps {
  onClick: () => void;
  chatHistoryLength: number;
}

export const FloatingChatHistoryButton = memo(function FloatingChatHistoryButton({ 
  onClick, 
  chatHistoryLength 
}: FloatingChatHistoryButtonProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Debug logging to see if component re-renders
  useEffect(() => {
    console.log('FloatingChatHistoryButton re-rendered with theme:', theme);
  }, [theme]);

  const containerClasses = `flex items-center justify-center h-14 w-14 rounded-full shadow-xl border-2 transition-all duration-300 ${
    isDark 
      ? 'bg-gray-900/95 border-gray-600 backdrop-blur-md' 
      : 'bg-white/95 border-gray-400 backdrop-blur-md shadow-lg'
  }`;

  const buttonClasses = `relative h-10 w-10 rounded-full transition-all duration-300 ${
    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
  } group transform hover:scale-110`;

  return (
    <div 
      key={`floating-chat-${theme}`} // Force re-render on theme change
      className="fixed bottom-20 right-4 z-[9999] pointer-events-auto"
      data-theme={theme} // Add data attribute for debugging
    >
      <div className={containerClasses}>
        <Tooltip key={`chat-tooltip-${theme}`}>
          <TooltipTrigger asChild>
            <Button
              key={`chat-btn-${theme}`}
              size="icon"
              variant="ghost"
              aria-label="Chat History (Ctrl+J)"
              onClick={onClick}
              className={buttonClasses}
              data-theme={theme}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <History className={`h-5 w-5 transition-transform duration-300 group-hover:rotate-3 ${
                isDark ? 'text-blue-400' : 'text-blue-500'
              }`} />
              {chatHistoryLength > 0 && (
                <div 
                  key={`badge-${theme}-${chatHistoryLength}`}
                  className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border ${
                    isDark 
                      ? 'bg-blue-600/60 border-gray-800/50' 
                      : 'bg-blue-500/80 border-white/50'
                  }`}
                >
                  <span className="text-xs text-white font-medium">
                    {chatHistoryLength}
                  </span>
                </div>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p>Chat History</p>
              <p className="text-xs text-gray-400">Ctrl+J</p>
              {chatHistoryLength > 0 && (
                <p className="text-xs text-blue-400">{chatHistoryLength} messages</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}); 