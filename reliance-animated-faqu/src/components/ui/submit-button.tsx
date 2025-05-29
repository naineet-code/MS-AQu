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
          animation: 'animate-bounce',
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
          "animate-[gradient_7s_ease_infinite]"
        )}
        style={{
          backgroundSize: "200% 200%",
        }}
        whileTap={{ scale: 0.85, rotate: rotation + 90 }}
        whileHover={{ scale: 1.1 }}
        animate={{ 
          scale: isPressed ? 0.85 : isDisabled ? 1 : 1,
          rotate: rotation,
        }}
        transition={{ 
          duration: 0.4,
          type: "spring",
          stiffness: 400,
          damping: 25
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
                buttonState === 'active' && !isPressed && 'animate-pulse'
              )} 
            />
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
