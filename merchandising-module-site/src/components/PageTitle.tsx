
import React from "react";
// import { useTheme } from "@/hooks/useTheme"; (no longer needed for 'u' styling)
import { motion } from "motion/react";

interface PageTitleProps {
  isVisible: boolean;
}

const PageTitle: React.FC<PageTitleProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <motion.div 
      className="text-center mb-10"
      initial={{ opacity: 1, height: "auto" }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <h1 className="text-5xl md:text-7xl font-bold">
        {/* Main Merchandising heading - Atlassian style */}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 drop-shadow-2xl align-baseline">
          Merchandising
        </span>
        {/* Subheading */}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600/70 to-green-500/50 text-sm md:text-lg ml-3 align-baseline drop-shadow-lg">
          Algorithms
        </span>
      </h1>
    </motion.div>
  );
};

export default PageTitle;
