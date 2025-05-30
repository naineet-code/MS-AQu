import React from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { MessageSquare, Search, FileText, BarChart3, Lightbulb, Zap, X, HelpCircle, Brain, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

interface HelpScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpScreen: React.FC<HelpScreenProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const navigationButtons = [
    {
      title: "View FAQs",
      description: "Browse frequently asked questions with instant answers",
      icon: <FileText className="w-5 h-5" />,
      shortcut: "Ctrl+F",
      color: "text-sky-600 dark:text-sky-400",
      bgColor: "bg-sky-50 dark:bg-sky-900/20",
      borderColor: "border-sky-200 dark:border-sky-800"
    },
    {
      title: "AI Models",
      description: "Learn about our GPT-4o models and capabilities",
      icon: <Brain className="w-5 h-5" />,
      shortcut: "Ctrl+M",
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-900/20",
      borderColor: "border-violet-200 dark:border-violet-800"
    },
    {
      title: "Get Help",
      description: "Access this help guide anytime",
      icon: <HelpCircle className="w-5 h-5" />,
      shortcut: "Ctrl+H",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      borderColor: "border-emerald-200 dark:border-emerald-800"
    },
    {
      title: "History",
      description: "Review your previous questions and answers",
      icon: <History className="w-5 h-5" />,
      shortcut: "Ctrl+Y",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      borderColor: "border-amber-200 dark:border-amber-800"
    }
  ];

  const exampleQuestions = [
    {
      category: "Basic Definitions",
      icon: "📚",
      questions: [
        "What is WSSI?",
        "What is AOP?",
        "What does GRN stand for?",
        "Explain ASP in retail planning"
      ]
    },
    {
      category: "How-It-Works",
      icon: "⚙️", 
      questions: [
        "How does WSSI guide decisions using past, present & future data?",
        "How is inventory data allocated across WSSI sales channels?",
        "How does WSSI determine the sales channel for a style?",
        "How is discount% calculated for actual and projected sales?"
      ]
    },
    {
      category: "Technical Details",
      icon: "🔧",
      questions: [
        "What role does the Retail Week Calendar play in WSSI?",
        "What factors determine COGS in projected periods?",
        "How do shelf life and lead time affect style flow in WSSI?",
        "In what cases would a style be excluded from WSSI planning?"
      ]
    }
  ];

  const features = [
    {
      step: 1,
      title: "Ask a Question",
      description: "Type your question in the input field",
      icon: <MessageSquare className="w-6 h-6" />,
      color: "text-sky-600",
      bgColor: "bg-sky-50 dark:bg-sky-900/20",
      tips: [
        "Ask specific questions for better results: 'What is WSSI?' vs 'Tell me about planning'",
        "Follow up with 'Can you explain this simpler?' if the answer is too technical",
        "Use the suggestions provided to explore related topics"
      ]
    },
    {
      step: 2,
      title: "Smart Suggestions",
      description: "Click on suggested questions or type your own",
      icon: <Search className="w-6 h-6" />,
      color: "text-violet-600",
      bgColor: "bg-violet-50 dark:bg-violet-900/20",
      tips: [
        "Search works with abbreviations: 'AOP', 'WSSI', 'GRN'",
        "Ask comparative questions: 'Difference between actual and projected sales'",
        "Request examples: 'Give me an example of WSSI planning process'"
      ]
    },
    {
      step: 3,
      title: "Instant Answers",
      description: "Get comprehensive responses from our AI",
      icon: <FileText className="w-6 h-6" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      tips: [
        "Check the citations to verify information sources",
        "Click on page references to jump to specific sections",
        "Use the copy button to save important information"
      ]
    },
    {
      step: 4,
      title: "Learn More",
      description: "Explore FAQs, guides, and technical details",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      tips: [
        "Expand sections to see the AI's reasoning process",
        "Review relevant paragraphs for deeper context",
        "Check pricing information for token usage details"
      ]
    }
  ];

  const quickStartSteps = [
    {
      step: "1",
      title: "Ask Your Question",
      description: "Type your question in the search box. Start with basics like 'What is WSSI?' or 'Explain AOP'.",
      icon: "💭"
    },
    {
      step: "2", 
      title: "Review the Answer",
      description: "Read the AI's response, which includes reasoning, relevant sources, and citations.",
      icon: "📖"
    },
    {
      step: "3",
      title: "Explore Further", 
      description: "Use follow-up questions, check citations, or explore suggested related topics.",
      icon: "🔍"
    },
    {
      step: "4",
      title: "Save & Reference",
      description: "Use the copy button for important info and check chat history for past conversations.",
      icon: "💾"
    }
  ];

  const proTips = [
    "🎯 Be specific in your questions for the most accurate answers",
    "📝 Keep track of important information using the copy buttons",
    "🔄 Use 'New Question' to start fresh conversations on different topics",
    "📚 Check the PDF viewer for complete document context when needed",
    "💡 Ask for explanations in simpler terms if the answer is too technical",
    "🕒 Your chat history is automatically saved for easy reference"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[95vh] p-0 gap-0">
        {/* Header */}
        <div className="relative flex items-center p-4 border-b bg-gradient-to-r from-sky-50 to-violet-50 dark:from-gray-900 dark:to-gray-800">
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex-1 pr-20">
            🚀 How to Use Your FAQ Assistant - Complete Guide
          </DialogTitle>
          {/* Hidden description for accessibility */}
          <DialogDescription className="sr-only">
            Comprehensive help guide showing how to use the FAQ assistant effectively. Includes quick start steps, control buttons guide, example questions, and pro tips.
          </DialogDescription>
          <DialogClose asChild>
            <Button size="icon" variant="ghost" aria-label="Close Help" className="h-8 w-8 ml-2">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Quick Start Guide */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${
              isDark ? 'text-sky-300' : 'text-sky-700'
            }`}>
              <Zap className="w-6 h-6" />
              🚀 Quick Start in 4 Steps
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {quickStartSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className={`p-4 rounded-lg border-2 ${
                    isDark ? 'bg-gray-800/50 border-gray-600' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isDark ? 'bg-sky-900 text-sky-300' : 'bg-sky-100 text-sky-700'
                    }`}>
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold mb-2 ${
                        isDark ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {step.icon} {step.title}
                      </h4>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Navigation Buttons Guide */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${
              isDark ? 'text-violet-300' : 'text-violet-700'
            }`}>
              🎮 Control Buttons Guide
            </h3>
            <div className="grid gap-4">
              {navigationButtons.map((button, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`p-4 rounded-lg border ${button.borderColor} ${button.bgColor}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${button.bgColor}`}>
                      <div className={button.color}>
                        {button.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold text-lg mb-2 ${
                        isDark ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {button.title}
                      </h4>
                      <p className={`text-sm mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {button.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant={"secondary" as any} className="text-xs">
                          {button.shortcut}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Example Questions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${
              isDark ? 'text-emerald-300' : 'text-emerald-700'
            }`}>
              💡 Try These Example Questions
            </h3>
            <div className="grid gap-6">
              {exampleQuestions.map((category, categoryIndex) => (
                <motion.div
                  key={categoryIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + categoryIndex * 0.1 }}
                  className={`p-4 rounded-lg ${
                    isDark ? 'bg-gray-800/40' : 'bg-gray-50'
                  }`}
                >
                  <h4 className={`font-semibold text-lg mb-3 ${
                    isDark ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    {category.icon} {category.category}
                  </h4>
                  <div className="grid gap-2">
                    {category.questions.map((question, questionIndex) => (
                      <Badge key={questionIndex} variant={"outline" as any} className={`justify-start p-3 text-sm ${
                        isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}>
                        💬 {question}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Key Features */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className={`text-2xl font-bold mb-6 ${
              isDark ? 'text-amber-300' : 'text-amber-700'
            }`}>⭐ Key Features & Tips</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className={`p-4 rounded-lg ${feature.bgColor}`}
                >
                  <div className={`flex items-center gap-3 mb-3 ${feature.color}`}>
                    {feature.icon}
                    <h4 className={`font-semibold ${
                      isDark ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {feature.title}
                    </h4>
                  </div>
                  <p className={`text-sm mb-3 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {feature.description}
                  </p>
                  <div className="space-y-2">
                    {feature.tips.map((tip, tipIndex) => (
                      <div key={tipIndex} className={`text-sm flex items-start gap-2 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <span className={feature.color}>•</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Pro Tips */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <h3 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${
              isDark ? 'text-amber-300' : 'text-amber-700'
            }`}>
              <Lightbulb className="w-6 h-6" />
              🏆 Pro Tips for Best Results
            </h3>
            <Card className={`p-6 ${
              isDark ? 'bg-gray-800/50' : 'bg-gradient-to-r from-amber-50 to-orange-50'
            }`}>
              <CardContent className="p-0">
                <div className="grid gap-3">
                  {proTips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isDark ? 'bg-amber-900' : 'bg-amber-100'
                      }`}>
                        <span className={`text-sm font-medium ${
                          isDark ? 'text-amber-300' : 'text-amber-600'
                        }`}>{index + 1}</span>
                      </div>
                      <p className={`text-sm ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Support Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="text-center pt-6 border-t border-gray-300 dark:border-gray-700"
          >
            <h3 className={`text-lg font-semibold mb-3 ${
              isDark ? 'text-gray-200' : 'text-gray-800'
            }`}>
              🤝 Need More Help?
            </h3>
            <p className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Remember: This AI assistant has been trained on your specific business documents. 
              The more specific your questions, the better the answers you'll receive!
            </p>
          </motion.section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpScreen; 