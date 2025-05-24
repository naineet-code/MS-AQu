import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { MovingBorderCard } from "@/components/ui/moving-border-card";
import { motion } from "motion/react";
import { useTheme } from "@/hooks/useTheme";

interface ChatInputSectionProps {
  isInputFocused: boolean;
  setIsInputFocused: (focused: boolean) => void;
  setShowResponse: (show: boolean) => void;
  onAddMessage: (message: string, isUser: boolean) => void;
  questionMode: boolean;
  setQuestionMode: (mode: boolean) => void;
  currentQuestion: string;
  autoFocus?: boolean;
  /** Callback to submit a question and fetch response data */
  onSubmitQuestion: (question: string) => Promise<any>;
  isReturnedFromResponse?: boolean;
  isTransitioning?: boolean;
}

// Static sample questions for the Merchandising Algorithms module
const defaultPlaceholders = [
  "What does the Ideal Size Set (ISS) mean in retail?",
  "Why do sizes sell differently in online vs retail stores?",
  "How do you calculate the right size mix for products?",
  "What happens if a product has no size sales data?",
  "How is customer demand used to decide inventory?",
  "What is Rate of Sale (ROS) and why is it important?",
  "What is the minimum data needed for size analysis?",
  "How do outlier sales affect inventory planning?",
  "What's a good way to avoid stocking wrong sizes?",
  "Why adjust inventory based on sales channels?",
  "How does the system handle sudden size trends?",
  "What data is used to calculate size proportions?",
  "Why round size contribution values to decimals?",
  "How does historical sales data improve accuracy?",
  "What is a Pivotal Row and why does it matter?",
  "What is the role of Attribute Groups (AG)?",
  "Why set a Minimum Order Quantity (MOQ)?",
  "How are size gaps adjusted during ordering?",
  "What if sales data is incomplete or delayed?",
  "How does this system help avoid stockouts?"
];

const ChatInputSection: React.FC<ChatInputSectionProps> = ({
  isInputFocused,
  setIsInputFocused,
  setShowResponse,
  onAddMessage,
  onSubmitQuestion,
  questionMode,
  setQuestionMode,
  currentQuestion,
  autoFocus = false,
  isReturnedFromResponse = false,
  isTransitioning = false
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use the static sample questions
  const chatPlaceholders = defaultPlaceholders;

  useEffect(() => {
    // Auto-focus the input when the component loads with autoFocus prop
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        setIsInputFocused(true);
      }, 100); // Small delay to ensure rendering is complete
    }
  }, [autoFocus, setIsInputFocused]);

  const handleChatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inputField = e.currentTarget.querySelector('input');
    const message = inputField ? inputField.value.trim() : '';
    if (!message) return;
    console.log("Submitted question:", message);
    // Add user message
    onAddMessage(message, true);
    // Clear input
    if (inputRef.current) inputRef.current.value = '';
    // Transition to response view
    setQuestionMode(false);
    setShowResponse(true);
    // Fetch answer from backend
    try {
      const data = await onSubmitQuestion(message);
      // Add bot response to chat history
      if (data && data.answer) {
        onAddMessage(data.answer, false);
      } else if (data && data.error) {
        onAddMessage(data.error, false);
      } else {
        onAddMessage('No response from server.', false);
      }
    } catch (err: any) {
      console.error(err);
      onAddMessage(err?.message || 'Error contacting server', false);
    }
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = () => {
    // Don't handle blur during transition to prevent interference
    if (isTransitioning) return;
    
    const inputElement = document.querySelector('input');
    if (!inputElement || !inputElement.value.trim()) {
      setIsInputFocused(false);
    }
  };

  return (
    <motion.div 
      className="w-full"
      animate={{
        y: (isInputFocused || isReturnedFromResponse) ? "-30vh" : 0,
        marginTop: (isInputFocused || isReturnedFromResponse) ? "2rem" : "0",
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        delay: (isInputFocused || isReturnedFromResponse) ? 0.3 : 0
      }}
      initial={false}
    >
      <MovingBorderCard
        borderRadius="1.5rem"
        duration={5000}
        className={`transition-all duration-500 ${
          isDark 
            ? 'bg-zinc-900/30 border-white/10' 
            : 'bg-white/20 border-white/20'
        } shadow-2xl`}
      >
        <Card className="bg-transparent border-0 shadow-none rounded-3xl">
          <CardContent className="p-6 rounded-3xl">
            <PlaceholdersAndVanishInput
              placeholders={chatPlaceholders}
              onChange={handleChatChange}
              onSubmit={handleChatSubmit}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              inputRef={inputRef}
            />
          </CardContent>
        </Card>
      </MovingBorderCard>
    </motion.div>
  );
};

export default ChatInputSection;