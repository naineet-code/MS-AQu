"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";

const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
    >
      <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
};

const CheckFilled = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("w-6 h-6", className)}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

const LoadingSpinner = ({ className }: { className?: string }) => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={cn("w-6 h-6", className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </motion.svg>
  );
};

type LoadingState = {
  text: string;
};

const LoaderCore = ({
  loadingStates,
  value = 0,
}: {
  loadingStates: LoadingState[];
  value?: number;
}) => {
  return (
    <div className="flex relative justify-center max-w-2xl mx-auto flex-col mt-32">
      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-3xl font-bold text-black dark:text-white mb-2">
          Initializing AQu Intelligence
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Preparing your intelligent FAQ system...
        </p>
      </motion.div>

      {/* Loading Steps */}
      <div className="space-y-4 px-4">
        {loadingStates.map((loadingState, index) => {
          const distance = Math.abs(index - value);
          const opacity = Math.max(1 - distance * 0.2, 0.1);
          const isActive = index === value;
          const isCompleted = index < value;
          const isPending = index > value;

          return (
            <motion.div
              key={index}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl transition-all duration-500",
                isActive && "bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50",
                isCompleted && "bg-green-50/30 dark:bg-green-900/10",
                isPending && "bg-gray-50/20 dark:bg-gray-800/20"
              )}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ 
                opacity: opacity, 
                x: 0, 
                scale: isActive ? 1.02 : 1,
                y: -(value * 2) // Subtle scroll effect
              }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              style={{
                filter: isActive ? "none" : `blur(${distance * 0.5}px)`,
              }}
            >
              {/* Icon with enhanced animations */}
              <motion.div
                className="flex-shrink-0"
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
              >
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <CheckFilled
                      className={cn(
                        "text-green-500 dark:text-green-400"
                      )}
                    />
                  </motion.div>
                )}
                {isActive && (
                  <LoadingSpinner
                    className={cn(
                      "text-blue-500 dark:text-blue-400"
                    )}
                  />
                )}
                {isPending && (
                  <CheckIcon className="text-gray-400 dark:text-gray-600" />
                )}
              </motion.div>

              {/* Text with enhanced styling */}
              <motion.div
                className="flex-1 min-w-0"
                animate={isActive ? { x: [0, 2, 0] } : {}}
                transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
              >
                <span
                  className={cn(
                    "text-sm font-medium leading-relaxed transition-colors duration-300",
                    isActive && "text-blue-700 dark:text-blue-300",
                    isCompleted && "text-green-700 dark:text-green-300",
                    isPending && "text-gray-600 dark:text-gray-400"
                  )}
                >
                  {loadingState.text}
                </span>
              </motion.div>

              {/* Progress indicator */}
              {isActive && (
                <motion.div
                  className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <motion.div
        className="mt-8 mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ 
              width: `${((value + 1) / loadingStates.length) * 100}%` 
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Step {value + 1} of {loadingStates.length}</span>
          <span>{Math.round(((value + 1) / loadingStates.length) * 100)}%</span>
        </div>
      </motion.div>
    </div>
  );
};

export const MultiStepLoader = ({
  loadingStates,
  loading,
  duration = 2000,
  loop = false,
}: {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
}) => {
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      return;
    }
    const timeout = setTimeout(() => {
      setCurrentState((prevState) =>
        loop
          ? prevState === loadingStates.length - 1
            ? 0
            : prevState + 1
          : Math.min(prevState + 1, loadingStates.length - 1)
      );
    }, duration);

    return () => clearTimeout(timeout);
  }, [currentState, loading, loop, loadingStates.length, duration]);
  
  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full h-full fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            background: "radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, rgba(0, 0, 0, 0.8) 70%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)"
          }}
        >
          {/* Enhanced background with animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 w-full max-w-4xl mx-auto">
            <LoaderCore value={currentState} loadingStates={loadingStates} />
          </div>

          {/* Gradient overlay */}
          <div className="bg-gradient-to-t inset-x-0 z-20 bottom-0 bg-white dark:bg-black h-full absolute [mask-image:radial-gradient(900px_at_center,transparent_30%,white)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};