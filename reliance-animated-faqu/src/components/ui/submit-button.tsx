import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Send, Sparkles, Zap, RotateCcw } from "lucide-react";

export type ButtonState = 'initial' | 'active' | 'new-question';

interface SubmitButtonProps {
  isDisabled: boolean;
  isPressed: boolean;
  buttonState: ButtonState;
}

export function SubmitButton({ isDisabled, isPressed, buttonState }: SubmitButtonProps) {
  // Define icon and animations based on state
  const getIconConfig = () => {
    switch (buttonState) {
      case 'initial':
        return {
          Icon: Sparkles,
          rotation: 0,
          animation: 'hover:animate-pulse',
          gradient: 'from-violet-400 via-purple-400 to-indigo-400',
          extraClasses: 'animate-pulse'
        };
      case 'active':
        return {
          Icon: Zap,
          rotation: 45,
          animation: 'animate-pulse',
          gradient: 'from-blue-400 via-cyan-400 to-teal-400',
          extraClasses: 'animate-bounce'
        };
      case 'new-question':
        return {
          Icon: RotateCcw,
          rotation: 180,
          animation: 'hover:animate-bounce',
          gradient: 'from-green-400 via-emerald-400 to-blue-400',
          extraClasses: 'animate-spin'
        };
      default:
        return {
          Icon: Send,
          rotation: 0,
          animation: 'hover:animate-bounce',
          gradient: 'from-purple-500 via-blue-500 to-indigo-500',
          extraClasses: ''
        };
    }
  };

  const iconConfig = getIconConfig();
  const { Icon, rotation, animation, gradient, extraClasses } = iconConfig;

  return (
    <div className="absolute right-2 flex items-center justify-center h-full pointer-events-none">
      <motion.button
        disabled={isDisabled}
        type="submit"
        className={cn(
          "z-20 inline-flex items-center justify-center h-8 w-8 rounded-full",
          "disabled:bg-gray-100 dark:disabled:bg-zinc-800",
          "bg-gradient-to-r", gradient,
          "transition-all duration-300 hover:shadow-lg backdrop-blur-sm dark:backdrop-blur-md pointer-events-auto",
          "animate-[gradient_7s_ease_infinite]",
          // Enhanced effects for new-question state
          buttonState === 'new-question' && [
            "hover:shadow-emerald-400/60 hover:shadow-2xl",
            "before:absolute before:inset-0 before:rounded-full",
            "before:bg-gradient-to-r before:from-emerald-400/20 before:via-green-400/20 before:to-blue-400/20",
            "before:blur-xl before:scale-150 before:opacity-0 hover:before:opacity-100",
            "before:transition-all before:duration-500",
            "relative overflow-visible"
          ]
        )}
        style={{
          backgroundSize: "200% 200%",
        }}
        whileTap={{ scale: 0.85, rotate: rotation + 90 }}
        whileHover={{ 
          scale: buttonState === 'new-question' ? 1.35 : 1.1,
          rotate: buttonState === 'new-question' ? rotation + 15 : 0,
          boxShadow: buttonState === 'new-question' 
            ? [
                "0 0 25px rgba(16, 185, 129, 0.8)",
                "0 0 50px rgba(16, 185, 129, 0.5)", 
                "0 0 75px rgba(16, 185, 129, 0.3)",
                "inset 0 0 20px rgba(255, 255, 255, 0.2)"
              ].join(", ")
            : undefined,
          transition: {
            type: "spring",
            stiffness: 600,
            damping: 15,
            duration: 0.4
          }
        }}
        animate={{ 
          scale: isPressed ? 0.85 : undefined,
          rotate: rotation,
          // Enhanced pulsing for new-question state
          ...(buttonState === 'new-question' && !isPressed && {
            boxShadow: [
              "0 0 15px rgba(16, 185, 129, 0.4), 0 0 30px rgba(34, 197, 94, 0.2)",
              "0 0 25px rgba(16, 185, 129, 0.6), 0 0 50px rgba(34, 197, 94, 0.4)",
              "0 0 15px rgba(16, 185, 129, 0.4), 0 0 30px rgba(34, 197, 94, 0.2)"
            ]
          })
        }}
        transition={{ 
          duration: buttonState === 'new-question' ? 0.25 : 0.4,
          type: "spring",
          stiffness: buttonState === 'new-question' ? 600 : 400,
          damping: buttonState === 'new-question' ? 15 : 25,
          // Enhanced pulsing animation for new-question
          ...(buttonState === 'new-question' && !isPressed && {
            boxShadow: {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }
          })
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={buttonState}
            initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center"
          >
            <Icon 
              className={cn(
                "text-white h-4 w-4",
                isPressed && 'animate-spin',
                !isPressed && animation,
                buttonState === 'active' && !isPressed && 'animate-pulse',
                buttonState === 'new-question' && !isPressed && [
                  extraClasses, 
                  'drop-shadow-md',
                  'transition-transform duration-300'
                ]
              )} 
              style={{
                // Enhanced icon effects for new-question state
                ...(buttonState === 'new-question' && {
                  filter: [
                    "drop-shadow(0 0 6px rgba(255, 255, 255, 1))",
                    "drop-shadow(0 0 12px rgba(16, 185, 129, 0.8))",
                    "drop-shadow(0 0 18px rgba(34, 197, 94, 0.6))"
                  ].join(" ")
                })
              }}
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Additional glow effect for new-question state */}
        {buttonState === 'new-question' && (
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400/30 via-green-400/30 to-blue-400/30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ zIndex: -1 }}
          />
        )}
      </motion.button>
    </div>
  );
}
