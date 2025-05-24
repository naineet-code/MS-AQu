
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { ButtonState } from "@/components/ui/submit-button";
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

// Static sample questions for the WSSI module, limited to <=65 characters
const defaultPlaceholders = [
  "What are the primary goals of the WSSI module in planning?",
  "How does WSSI guide decisions using past, present & future data?",
  "Why split the Annual Operating Plan (AOP) into weekly segments?",
  "What role does the Retail Week Calendar play in WSSI?",
  "What two input types does WSSI require and how do they differ?",
  "How is inventory data allocated across WSSI sales channels?",
  "What does the GRN date represent in inventory planning?",
  "In what cases would a style be excluded from WSSI planning?",
  "How is ASP calculated for projected weeks in WSSI?",
  "What factors determine COGS in projected periods?",
  "How is discount% calculated for actual and projected sales?",
  "Why use last year’s performance in current planning?",
  "How does WSSI determine the sales channel for a style?",
  "How do shelf life and lead time affect style flow in WSSI?",
  "How is inventory handling different for new vs aged styles?",
  "How does WSSI align planned inwards with expected sales?",
  "What metrics are displayed in WSSI’s Sales Metrics panel?",
  "How is data aggregated before display in WSSI dashboards?",
  "Why might discount% in future weeks appear inconsistent?",
  "How does WSSI support stock planning via ‘Weeks of Cover’?"
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
  
  // Determine button state based on current interaction state
  const getButtonState = (): ButtonState => {
    if (isReturnedFromResponse) {
      return 'new-question'; // User clicked "New Question" - button on right, input ready
    } else if (isInputFocused) {
      return 'active'; // User is typing/focused - button on right
    } else {
      return 'initial'; // Default state - button towards top center
    }
  };
  
  const buttonState = getButtonState();

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
              buttonState={buttonState}
            />
          </CardContent>
        </Card>
      </MovingBorderCard>
    </motion.div>
  );
};

export default ChatInputSection;
