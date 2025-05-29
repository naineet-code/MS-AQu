import { useEffect, useCallback } from 'react';

interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onCtrlK?: () => void;
  onCtrlEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  enableGlobalShortcuts?: boolean;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const {
    onEscape,
    onEnter,
    onCtrlK,
    onCtrlEnter,
    onArrowUp,
    onArrowDown,
    enableGlobalShortcuts = true
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if user is typing in an input
    const target = event.target as HTMLElement;
    const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
                          target.contentEditable === 'true';

    // Handle global shortcuts
    if (enableGlobalShortcuts) {
      // Escape key - universal close/cancel
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      // Ctrl/Cmd + K - Search/Command palette
      if ((event.ctrlKey || event.metaKey) && event.key === 'k' && onCtrlK) {
        event.preventDefault();
        onCtrlK();
        return;
      }

      // Ctrl/Cmd + Enter - Submit/Send
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && onCtrlEnter) {
        event.preventDefault();
        onCtrlEnter();
        return;
      }
    }

    // Handle navigation when not typing
    if (!isInputFocused) {
      switch (event.key) {
        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;
      }
    }
  }, [onEscape, onEnter, onCtrlK, onCtrlEnter, onArrowUp, onArrowDown, enableGlobalShortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Focus management utilities
  const focusFirstFocusableElement = useCallback((container?: HTMLElement) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    const focusableElements = (container || document).querySelectorAll(focusableSelectors);
    const firstElement = focusableElements[0] as HTMLElement;
    
    if (firstElement) {
      firstElement.focus();
    }
  }, []);

  const focusLastFocusableElement = useCallback((container?: HTMLElement) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    const focusableElements = (container || document).querySelectorAll(focusableSelectors);
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    if (lastElement) {
      lastElement.focus();
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    const focusableElements = container.querySelectorAll(focusableSelectors);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab - go to previous element
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab - go to next element
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element initially
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return {
    focusFirstFocusableElement,
    focusLastFocusableElement,
    trapFocus
  };
};

// Accessibility utilities
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;
  
  document.body.appendChild(announcer);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
};

export const generateUniqueId = (prefix: string = 'id') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}; 