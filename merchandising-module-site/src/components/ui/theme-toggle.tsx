import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

// Create a simple event system to communicate theme changes
export const themeChangeEvent = new EventTarget();
export const THEME_CHANGE_EVENT = "themeChanged";

export const ThemeToggle = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>((props, ref) => {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    // Toggle theme
    toggleTheme();
    
    // Update background immediately
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Force a re-render of the background animation
    const event = new CustomEvent(THEME_CHANGE_EVENT, { 
      detail: { 
        theme: theme === 'light' ? 'dark' : 'light',
        timestamp: Date.now() // Add timestamp to force re-render
      } 
    });
    themeChangeEvent.dispatchEvent(event);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          className="rounded-full backdrop-blur-sm border transform transition-transform duration-300 ease-in-out hover:animate-hover-tada"
          aria-label="Toggle theme"
          {...props}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 hover:animate-spin" />
          ) : (
            <Sun className="h-5 w-5 hover:animate-spin" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Toggle Theme</p>
      </TooltipContent>
    </Tooltip>
  );
});

ThemeToggle.displayName = "ThemeToggle";
