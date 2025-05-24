
import React from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ProfessionalSearchLoader } from "@/components/ui/professional-search-loader";
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
        className={`w-full rounded-2xl p-6 mb-4 transition-all duration-300 hover:shadow-xl ${
          isDark 
            ? 'text-white' 
            : 'text-zinc-800'
        }`}
        style={{
          background: isDark 
            ? 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,69,196,0.12) 50%, rgba(219,39,119,0.10) 100%)'
            : 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,69,196,0.06) 50%, rgba(219,39,119,0.05) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: isDark ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid rgba(255,255,255,0.25)',
          boxShadow: isDark 
            ? '0 12px 32px 0 rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
            : '0 12px 32px 0 rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.4)'
        }}
      >
        <div className="flex justify-between items-center">
          <p className={`text-xl font-semibold mb-0 ${isDark ? 'text-white' : 'text-zinc-800'}`}>
            {question}
          </p>
          
          <Button
            onClick={onNewQuestion}
            variant="outline"
            size="lg"
            className={`rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg px-6 py-3 min-h-[48px] w-auto min-w-[160px] ${
              isDark 
                ? 'text-white hover:text-purple-200' 
                : 'text-zinc-800 hover:text-purple-700'
            }`}
            style={{
              background: isDark 
                ? 'linear-gradient(135deg, rgba(139,69,196,0.2) 0%, rgba(99,102,241,0.15) 100%)'
                : 'linear-gradient(135deg, rgba(139,69,196,0.1) 0%, rgba(99,102,241,0.08) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.3)',
              pointerEvents: 'auto'
            }}
          >
            <ArrowLeft className="h-5 w-5 mr-2 pointer-events-none" />
            <span className="text-base font-medium pointer-events-none">New Question</span>
          </Button>
        </div>
        
        <Separator 
          className={`my-4 ${isDark ? 'bg-gradient-to-r from-purple-400/30 to-blue-400/30' : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20'}`} 
          style={{ height: '2px' }}
        />
      </div>

      {/* Response Content */}
      {loading ? (
        <ProfessionalSearchLoader isSearching={loading} />
      ) : (
        <ResponseCard data={responseData} />
      )}
    </motion.div>
  );
};

export default QuestionResponseSection;
