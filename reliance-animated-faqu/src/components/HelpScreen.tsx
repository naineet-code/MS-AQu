import React from "react";
import { motion } from "motion/react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Search, FileText, BarChart3, Lightbulb, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

interface HelpScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpScreen: React.FC<HelpScreenProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const features = [
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "AI-Powered FAQ Chat",
      description: "Ask questions about any topic and get instant, intelligent answers from our knowledge base.",
      tips: ["How does WSSI guide decisions using past, present & future data?", "What role does the Retail Week Calendar play in WSSI?", "What two input types does WSSI require and how do they differ?"]
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Smart Document Search",
      description: "Search through comprehensive documentation with AI-powered understanding of context.",
      tips: ["What does the GRN date represent in inventory planning?", "In what cases would a style be excluded from WSSI planning?", "How is ASP calculated for projected weeks in WSSI?"]
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Document Analysis",
      description: "Get insights and summaries from uploaded documents and knowledge bases.",
      tips: ["What factors determine COGS in projected periods?", "How is discount% calculated for actual and projected sales?", "Why use last year's performance in current planning?"]
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Knowledge Analytics",
      description: "Track your questions and discover patterns in the information you're seeking.",
      tips: ["How does WSSI determine the sales channel for a style?", "How do shelf life and lead time affect style flow in WSSI?", "How does WSSI support stock planning via 'Weeks of Cover'?"]
    }
  ];

  const quickTips = [
    "Start with clear, specific questions for the best results",
    "Use the chat history to track your previous conversations",
    "Ask for explanations if answers are unclear",
    "Take advantage of follow-up questions for deeper understanding",
    "Save important information for future reference"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] h-[90vh] p-0 gap-0">
        {/* Header with Title and Controls */}
        <div className="relative flex items-center p-4 border-b bg-gray-50 dark:bg-gray-900">
          <DialogTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex-1 pr-20">
            How to Use FAQ Assistant
          </DialogTitle>
          <DialogClose asChild>
            <Button size="icon" variant="ghost" aria-label="Close Help" className="h-8 w-8 ml-2">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Getting Started */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              isDark ? 'text-blue-200' : 'text-blue-700'
            }`}>
              <Zap className="w-5 h-5" />
              Getting Started
            </h3>
            <Card className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-50/50'
            }`}>
              <CardContent className="p-0">
                <p className={`text-sm mb-4 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Welcome to your intelligent FAQ assistant! This platform uses AI to provide instant answers 
                  to your questions by searching through comprehensive knowledge bases. Simply type your question 
                  in the chat interface to get started.
                </p>
                <div className="grid gap-2">
                  <Badge variant="outline" className={`justify-start ${
                    isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
                  }`}>
                    💬 "What are the primary goals of the WSSI module in planning?"
                  </Badge>
                  <Badge variant="outline" className={`justify-start ${
                    isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
                  }`}>
                    📚 "Why split the Annual Operating Plan (AOP) into weekly segments?"
                  </Badge>
                  <Badge variant="outline" className={`justify-start ${
                    isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
                  }`}>
                    🔍 "How is inventory data allocated across WSSI sales channels?"
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Features */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h3 className={`text-lg font-semibold mb-4 ${
              isDark ? 'text-blue-200' : 'text-blue-700'
            }`}>Key Features</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`p-4 rounded-lg ${
                    isDark ? 'bg-gray-700/50' : 'bg-gray-50/50'
                  }`}
                >
                  <div className={`flex items-center gap-3 mb-2 ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {feature.icon}
                    <h3 className={`font-semibold ${
                      isDark ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {feature.title}
                    </h3>
                  </div>
                  <p className={`text-sm mb-3 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {feature.description}
                  </p>
                  <div className="space-y-1">
                    {feature.tips.map((tip, tipIndex) => (
                      <div key={tipIndex} className={`text-sm flex items-start gap-2 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <span className={`mt-1 ${
                          isDark ? 'text-purple-400' : 'text-purple-600'
                        }`}>•</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Quick Tips */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-6"
          >
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
              isDark ? 'text-blue-200' : 'text-blue-700'
            }`}>
              <Lightbulb className="w-5 h-5" />
              Pro Tips
            </h3>
            <Card className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-50/50'
            }`}>
              <CardContent className="p-0">
                <div className="grid gap-3">
                  {quickTips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isDark ? 'bg-blue-900' : 'bg-blue-100'
                      }`}>
                        <span className={`text-sm font-medium ${
                          isDark ? 'text-blue-300' : 'text-blue-600'
                        }`}>{index + 1}</span>
                      </div>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Support */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center pt-4 border-t border-gray-700/30"
          >
            <p className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Need more help? Contact our support team or check the documentation for advanced features.
            </p>
          </motion.section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpScreen;