
import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
// Replace arrow SVG with FontAwesome icon
import { Send } from "lucide-react";

interface SubmitButtonProps {
  isDisabled: boolean;
  isPressed: boolean;
}

export function SubmitButton({ isDisabled, isPressed }: SubmitButtonProps) {
  return (
    <motion.button
      disabled={isDisabled}
      type="submit"
      className="z-20 inline-flex items-center justify-center h-8 w-8 rounded-full disabled:bg-gray-100 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 dark:disabled:bg-zinc-800 transition duration-200 animate-[gradient_7s_ease_infinite] hover:shadow-lg backdrop-blur-sm dark:backdrop-blur-md pointer-events-auto"
      style={{
        backgroundSize: "200% 200%",
      }}
      whileTap={{ scale: 0.9 }}
      animate={{ 
        scale: isPressed ? 0.9 : isDisabled ? 1 : 1,
      }}
      transition={{ 
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
    >
      {/* Animated send icon */}
      <Send className={`text-white h-4 w-4 ${isPressed ? 'animate-spin' : 'hover:animate-bounce'}`} />
    </motion.button>
  );
}
