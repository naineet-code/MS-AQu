import React from "react";
// import { useTheme } from "@/hooks/useTheme"; (no longer needed for 'u' styling)
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

interface PageTitleProps {
  isVisible: boolean;
}

const PageTitle: React.FC<PageTitleProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      className="relative text-center mb-10"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <div className="flex flex-row justify-center items-stretch gap-2 relative w-full">
        <div className="flex flex-col justify-start">
          <sup className="text-xs md:text-sm text-gray-400 font-medium mr-2 mt-1">Increff</sup>
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/90 drop-shadow-2xl">
            FAQ
          </h1>
        </div>
        <div className="flex flex-col justify-end">
          <span className="text-xs md:text-base text-gray-400 font-medium ml-2">for Reliance</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PageTitle;
