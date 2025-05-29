import React from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  backendUrl: string | null;
}

const QuestionResponseSection: React.FC<QuestionResponseSectionProps> = ({
  question,
  isVisible,
  onNewQuestion,
  loading,
  responseData,
  backendUrl
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  console.log('🔍 QuestionResponseSection render:', { 
    question, 
    isVisible, 
    loading, 
    responseData, 
    backendUrl,
    hasResponseData: !!responseData,
    responseDataKeys: responseData ? Object.keys(responseData) : []
  });

  if (!isVisible) return null;

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.98 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      style={{ position: 'relative', zIndex: 30 }}
    >
      {/* Question Header with Back Button */}
      <motion.div
        layoutId="question-header"
        className={`w-full backdrop-blur-md rounded-lg p-6 mb-4 shadow-lg ${
          isDark 
            ? 'bg-zinc-900/30 border border-white/10' 
            : 'bg-white/20 border border-white/20'
        }`}
        initial={{ borderRadius: 24 }}
        animate={{ borderRadius: 24 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex justify-between items-center">
          <motion.p 
            className={`text-xl font-semibold mb-0 ${isDark ? 'text-white' : 'text-zinc-800'}`}
            layoutId="question-text"
            initial={{ scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {question}
          </motion.p>
          <motion.div layoutId="new-question-btn">
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
          </motion.div>
        </div>
        <Separator className={`my-4 ${isDark ? 'bg-white/20' : 'bg-black/20'}`} />
      </motion.div>

      {/* Response Content as a bottom drawer */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="w-full flex justify-center items-center"
            style={{ minHeight: 220 }}
          >
            <FunnySearchLoader isSearching={loading} />
          </motion.div>
        ) : (
          <motion.div
            key="drawer"
            initial={{ opacity: 0, y: 80, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.98 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="w-full"
            style={{
              boxShadow: isDark
                ? '0 12px 32px 0 rgba(31, 38, 135, 0.25), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset'
                : '0 12px 32px 0 rgba(31, 38, 135, 0.10), 0 1.5px 8px 0 rgba(0,0,0,0.04) inset',
              borderRadius: 24,
              background: isDark
                ? 'linear-gradient(120deg, rgba(30,41,59,0.95) 60%, rgba(59,130,246,0.10) 100%)'
                : 'linear-gradient(120deg, rgba(255,255,255,0.95) 60%, rgba(199,210,254,0.10) 100%)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              marginBottom: 32,
              padding: 0,
            }}
          >
            <ResponseCard data={responseData} backendUrl={backendUrl} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuestionResponseSection;
