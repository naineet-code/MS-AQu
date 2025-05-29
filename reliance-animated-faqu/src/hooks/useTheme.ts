import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Simple initial theme detection
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') as Theme;
      if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
        return storedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Simple theme application
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = window.document.documentElement;
    
    // Apply theme classes
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    
    // Store theme preference
    localStorage.setItem('theme', newTheme);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Simple toggle function
  const toggleTheme = useCallback(() => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme]);

  return { 
    theme, 
    toggleTheme
  };
}
