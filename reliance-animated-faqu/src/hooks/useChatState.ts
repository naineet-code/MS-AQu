import { useState, useEffect } from 'react';
import { useChatHistory } from './useChatHistory';

interface UseChatStateReturn {
  isInputFocused: boolean;
  setIsInputFocused: (focused: boolean) => void;
  showResponse: boolean;
  setShowResponse: (show: boolean) => void;
  questionMode: boolean;
  setQuestionMode: (mode: boolean) => void;
  currentQuestion: string;
  setCurrentQuestion: (question: string) => void;
  shouldAutoFocus: boolean;
  setShouldAutoFocus: (focus: boolean) => void;
  isReturnedFromResponse: boolean;
  setIsReturnedFromResponse: (returned: boolean) => void;
  isTransitioning: boolean;
  setIsTransitioning: (transitioning: boolean) => void;
  handleAddMessage: (message: string, isUser: boolean) => void;
  handleNewQuestion: () => void;
}

export const useChatState = (): UseChatStateReturn => {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [questionMode, setQuestionMode] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);
  const [isReturnedFromResponse, setIsReturnedFromResponse] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { addMessage } = useChatHistory();

  // Reset autoFocus after it's used
  useEffect(() => {
    if (shouldAutoFocus && questionMode) {
      const timer = setTimeout(() => {
        setShouldAutoFocus(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoFocus, questionMode]);

  // Modified addMessage function to track current question
  const handleAddMessage = (message: string, isUser: boolean) => {
    if (isUser) {
      setCurrentQuestion(message);
    }
    addMessage(message, isUser);
  };

  // Handle going back to question mode
  const handleNewQuestion = () => {
    setQuestionMode(true);
    setShowResponse(false);
    setShouldAutoFocus(false);
    setIsReturnedFromResponse(true);
    setIsTransitioning(true);
    
    setTimeout(() => {
      const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
        setIsInputFocused(true);
      }
      setIsTransitioning(false);
    }, 700);
  };

  return {
    isInputFocused,
    setIsInputFocused,
    showResponse,
    setShowResponse,
    questionMode,
    setQuestionMode,
    currentQuestion,
    setCurrentQuestion,
    shouldAutoFocus,
    setShouldAutoFocus,
    isReturnedFromResponse,
    setIsReturnedFromResponse,
    isTransitioning,
    setIsTransitioning,
    handleAddMessage,
    handleNewQuestion
  };
}; 