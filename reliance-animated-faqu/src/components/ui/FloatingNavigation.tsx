import React, { memo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { FileText, Brain, HelpCircle } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface FloatingNavigationProps {
  onPdfClick: () => void;
  onAiInfoClick: () => void;
  onHelpClick: () => void;
  isOnline: boolean;
  connectionStatus: 'connected' | 'connecting' | 'error';
}

export const FloatingNavigation = memo(function FloatingNavigation({ 
  onPdfClick, 
  onAiInfoClick, 
  onHelpClick, 
  isOnline, 
  connectionStatus 
}: FloatingNavigationProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Debug logging to see if component re-renders
  useEffect(() => {
    console.log('FloatingNavigation re-rendered with theme:', theme);
  }, [theme]);

  const containerClasses = `flex items-center gap-3 px-4 py-3 rounded-full shadow-xl border-2 transition-all duration-300 ${
    isDark 
      ? 'bg-gray-900/95 border-gray-700 backdrop-blur-md' 
      : 'bg-white/95 border-gray-300 backdrop-blur-md shadow-lg'
  }`;

  const buttonBaseClasses = (baseColor: string) => {
    const colorMap = {
      blue: isDark 
        ? 'bg-blue-900/40 border-blue-700/50 hover:bg-blue-800/60 hover:border-blue-600' 
        : 'bg-blue-50/80 border-blue-200/60 hover:bg-blue-100 hover:border-blue-300',
      purple: isDark 
        ? 'bg-purple-900/40 border-purple-700/50 hover:bg-purple-800/60 hover:border-purple-600' 
        : 'bg-purple-50/80 border-purple-200/60 hover:bg-purple-100 hover:border-purple-300',
      emerald: isDark 
        ? 'bg-emerald-900/40 border-emerald-700/50 hover:bg-emerald-800/60 hover:border-emerald-600' 
        : 'bg-emerald-50/80 border-emerald-200/60 hover:bg-emerald-100 hover:border-emerald-300'
    };
    
    return `relative h-12 w-12 rounded-full border-2 transition-all duration-300 ${colorMap[baseColor as keyof typeof colorMap]} group transform hover:scale-110 shadow-md`;
  };

  return (
    <div 
      key={`floating-nav-${theme}`} // Force re-render on theme change
      className="fixed bottom-20 left-4 z-[9999] pointer-events-auto"
      data-theme={theme} // Add data attribute for debugging
    >
      <div className={containerClasses}>
        {/* PDF Viewer Button */}
        <Tooltip key={`pdf-tooltip-${theme}`}>
          <TooltipTrigger asChild>
            <Button
              key={`pdf-btn-${theme}`}
              aria-label="View PDF (Ctrl+P)"
              onClick={onPdfClick}
              disabled={!isOnline}
              className={`${buttonBaseClasses('blue')} ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
              data-theme={theme}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <FileText className={`h-6 w-6 transition-transform duration-300 group-hover:rotate-3 ${
                isDark ? 'text-blue-400' : 'text-blue-500'
              }`} />
              {connectionStatus === 'connected' && (
                <div className={`absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 ${
                  isDark ? 'border-gray-900' : 'border-white'
                }`} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p>View PDF Document</p>
              <p className="text-xs text-gray-400">Ctrl+P</p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* AI Info Button */}
        <Tooltip key={`ai-tooltip-${theme}`}>
          <TooltipTrigger asChild>
            <Button
              key={`ai-btn-${theme}`}
              aria-label="AI System Information (Ctrl+I)"
              onClick={onAiInfoClick}
              className={buttonBaseClasses('purple')}
              data-theme={theme}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Brain className={`h-6 w-6 transition-transform duration-300 group-hover:-rotate-3 ${
                isDark ? 'text-purple-400' : 'text-purple-500'
              }`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p>AQu Intelligent Engine</p>
              <p className="text-xs text-gray-400">Ctrl+I</p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Help Button */}
        <Tooltip key={`help-tooltip-${theme}`}>
          <TooltipTrigger asChild>
            <Button
              key={`help-btn-${theme}`}
              aria-label="Help & How to Use (Ctrl+H)"
              onClick={onHelpClick}
              className={buttonBaseClasses('emerald')}
              data-theme={theme}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <HelpCircle className={`h-6 w-6 transition-transform duration-300 group-hover:rotate-3 ${
                isDark ? 'text-emerald-400' : 'text-emerald-500'
              }`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p>Help & How to Use</p>
              <p className="text-xs text-gray-400">Ctrl+H</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}); 