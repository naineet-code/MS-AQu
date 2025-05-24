
import React from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { FunnySearchLoader } from "@/components/ui/funny-search-loader";
import ResponseCard from "./ResponseSection";
import { useTheme } from "@/hooks/useTheme";

interface QuestionResponseSectionProps {
  question: string;
  isVisible: boolean;
  onNewQuestion: () => void;
  loading: boolean;
  responseData: any;
}

const QuestionResponseSection: React.FC<QuestionResponseSectionProps> = ({
  question,
  isVisible,
  onNewQuestion,
  loading,
  responseData
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!isVisible) return null;

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ 
        duration: 0.4, 
        ease: "easeInOut"
      }}
    >
      {/* Question Header with Back Button */}
      <div 
        className={`w-full backdrop-blur-md rounded-lg p-6 mb-4 ${
          isDark 
            ? 'bg-zinc-900/30 border border-white/10' 
            : 'bg-white/20 border border-white/20'
        }`}
      >
        <div className="flex justify-between items-center">
          <p className={`text-xl font-semibold mb-0 ${isDark ? 'text-white' : 'text-zinc-800'}`}>
            {question}
          </p>
          
          <Button
            onClick={onNewQuestion}
            variant="outline"
            size="lg"
            className={`rounded-full transition-all duration-300 px-6 py-3 min-h-[48px] w-auto min-w-[160px] ${
              isDark 
                ? 'bg-zinc-900/30 border-white/10 hover:bg-zinc-800/50 text-white' 
                : 'bg-white/20 border-white/20 hover:bg-white/40 text-zinc-800'
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            <ArrowLeft className="h-5 w-5 mr-2 pointer-events-none" />
            <span className="text-base font-medium pointer-events-none">New Question</span>
          </Button>
        </div>
        
        <Separator className={`my-4 ${isDark ? 'bg-white/20' : 'bg-black/20'}`} />
      </div>

      {/* Response Content */}
      {loading ? (
        <FunnySearchLoader isSearching={loading} />
      ) : (
        <ResponseCard data={responseData} />
      )}
    </motion.div>
  );
};

export default QuestionResponseSection;
