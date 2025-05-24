
"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTypingPlaceholder } from "@/hooks/useTypingPlaceholder";
import { TextVanishCanvas } from "./text-vanish-canvas";
import { SubmitButton, ButtonState } from "./submit-button";
import { PlaceholderDisplay } from "./placeholder-display";

export function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
  onFocus,
  onBlur,
  inputRef: externalInputRef,
  buttonState = 'initial',
}: {
  placeholders: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  buttonState?: ButtonState;
}) {
  const { currentPlaceholder } = useTypingPlaceholder(placeholders);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;
  const [value, setValue] = useState("");
  const [animating, setAnimating] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !animating) {
      vanishAndSubmit();
    }
  };

  const vanishAndSubmit = () => {
    setAnimating(true);
    setIsButtonPressed(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    vanishAndSubmit();
    onSubmit && onSubmit(e);
  };
  
  const handleInputFocus = () => {
    onFocus && onFocus();
  };
  
  const handleInputBlur = () => {
    onBlur && onBlur();
  };

  const handleAnimationComplete = () => {
    setValue("");
    setAnimating(false);
    setIsButtonPressed(false);
  };
  
  return (
    <form
      className={cn(
        "w-full relative max-w-xl mx-auto bg-white dark:bg-zinc-800 h-12 rounded-full overflow-hidden shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)] transition duration-200",
        value && "bg-gray-50"
      )}
      onSubmit={handleSubmit}
    >
      <TextVanishCanvas 
        value={value}
        inputRef={inputRef}
        animate={animating}
        onAnimationComplete={handleAnimationComplete}
      />
      
      <div className="flex items-center h-full w-full relative">
        <input
          onChange={(e) => {
            if (!animating) {
              setValue(e.target.value);
              onChange && onChange(e);
            }
          }}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          value={value}
          type="text"
          className={cn(
            "flex-1 text-sm sm:text-base z-10 border-none dark:text-white bg-transparent text-black h-full rounded-full focus:outline-none focus:ring-0 pl-4 sm:pl-10 pr-12",
            animating && "text-transparent dark:text-transparent"
          )}
        />
        
        <SubmitButton 
          isDisabled={!value} 
          isPressed={isButtonPressed} 
          buttonState={buttonState}
        />
      </div>

      <PlaceholderDisplay 
        currentPlaceholder={currentPlaceholder}
        placeholders={placeholders}
        value={value}
      />
    </form>
  );
}
