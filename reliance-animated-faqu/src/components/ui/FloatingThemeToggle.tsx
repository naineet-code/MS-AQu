import React, { useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export const FloatingThemeToggle = memo(function FloatingThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Debug logging to see if component re-renders
  useEffect(() => {
    console.log('FloatingThemeToggle re-rendered with theme:', theme);
  }, [theme]);

  // Add keyboard shortcut for Ctrl+T
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Only trigger shortcuts when not typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        toggleTheme();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [toggleTheme]);

  const containerClasses = `flex items-center justify-center h-14 w-14 rounded-full shadow-xl border-2 transition-all duration-300 ${
    isDark 
      ? 'bg-gray-900/95 border-gray-600 backdrop-blur-md' 
      : 'bg-white/95 border-gray-400 backdrop-blur-md shadow-lg'
  }`;

  const buttonClasses = `rounded-full backdrop-blur-sm border-0 transition-all duration-300 hover:scale-110 ${
    isDark 
      ? 'hover:bg-gray-800/80 text-gray-300 hover:text-gray-100' 
      : 'hover:bg-gray-100/80 text-gray-700 hover:text-gray-900'
  }`;

  return (
    <div 
      key={`floating-theme-${theme}`} // Force re-render on theme change
      className="fixed top-4 left-4 z-[9999] pointer-events-auto"
      data-theme={theme} // Add data attribute for debugging
    >
      <div className={containerClasses}>
        <Tooltip key={`theme-tooltip-${theme}`}>
          <TooltipTrigger asChild>
            <Button
              key={`theme-btn-${theme}`}
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={buttonClasses}
              aria-label="Toggle theme"
              data-theme={theme}
            >
              {isDark ? (
                <Sun className="h-5 w-5 transition-transform duration-300" />
              ) : (
                <Moon className="h-5 w-5 transition-transform duration-300" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p>Toggle Theme</p>
              <p className="text-xs text-gray-400">Ctrl+T</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}); 