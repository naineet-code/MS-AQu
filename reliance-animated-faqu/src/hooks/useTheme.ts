import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  // Always use light theme
  const [theme, setTheme] = useState<Theme>('light');

  // Enhanced theme application - only apply light theme
  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof window === 'undefined') return;
    
    const root = window.document.documentElement;
    const body = window.document.body;
    
    // Remove all theme classes first
    root.classList.remove('dark', 'light');
    body.classList.remove('dark', 'light');
    
    // Always apply light theme
    root.classList.add('light');
    body.classList.add('light');
    
    // Update data attribute for consistency
    root.setAttribute('data-theme', 'light');
    
    // Store light theme preference
    localStorage.setItem('theme', 'light');
    
    // Force a style recalculation
    root.style.colorScheme = 'light';
  }, []);

  // Apply light theme on mount
  useEffect(() => {
    applyTheme('light');
  }, [applyTheme]);

  // Apply initial light theme immediately on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      applyTheme('light');
    }
  }, []);

  // Disabled toggle function - does nothing
  const toggleTheme = useCallback(() => {
    // Do nothing - theme switching disabled
    console.log('Theme switching is disabled - staying on light theme');
  }, []);

  return { 
    theme: 'light' as Theme, // Always return light
    toggleTheme
  };
}
