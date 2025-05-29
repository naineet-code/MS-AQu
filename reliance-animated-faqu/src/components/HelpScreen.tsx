import React from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      icon: <FileText className="w-5 h-5" />,
      title: "📄 PDF Viewer",
      color: "blue",
      description: "View the original documents and knowledge base",
      location: "Bottom left corner (blue button)",
      usage: "Click to open the complete PDF documents for detailed reading"
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: "🧠 AI Engine Info",
      color: "purple", 
      description: "Learn about the AI system powering your answers",
      location: "Bottom left corner (purple button)",
      usage: "Click to see technical details about the AI model and capabilities"
    },
    {
      icon: <HelpCircle className="w-5 h-5" />,
      title: "❓ Help Guide",
      color: "emerald",
      description: "This help screen you're viewing now",
      location: "Bottom left corner (green button)",
      usage: "Click anytime you need guidance on using the application"
    },
    {
      icon: <History className="w-5 h-5" />,
      title: "📜 Chat History",
      color: "blue",
      description: "View and manage your previous conversations",
      location: "Bottom right corner (standalone button)",
      usage: "Click to see all your past questions and answers. Click again or use the X to close."
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
      icon: <MessageSquare className="w-6 h-6" />,
      title: "💬 Smart Chat Interface",
      description: "Ask questions in natural language and get instant, intelligent answers from our knowledge base.",
      tips: [
        "Ask specific questions for better results: 'What is WSSI?' vs 'Tell me about planning'",
        "Follow up with 'Can you explain this simpler?' if the answer is too technical",
        "Use the suggestions provided to explore related topics"
      ]
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "🔍 Intelligent Search",
      description: "AI-powered search that understands context and finds the most relevant information.",
      tips: [
        "Search works with abbreviations: 'AOP', 'WSSI', 'GRN'",
        "Ask comparative questions: 'Difference between actual and projected sales'",
        "Request examples: 'Give me an example of WSSI planning process'"
      ]
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "📋 Detailed Responses",
      description: "Get comprehensive answers with citations, sources, and related information.",
      tips: [
        "Check the citations to verify information sources",
        "Click on page references to jump to specific sections",
        "Use the copy button to save important information"
      ]
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "📊 Response Analysis",
      description: "Understand reasoning, view relevant paragraphs, and explore pricing details.",
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
        <div className="relative flex items-center p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex-1 pr-20">
            🚀 How to Use Your FAQ Assistant - Complete Guide
          </DialogTitle>
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
              isDark ? 'text-blue-300' : 'text-blue-700'
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
                      isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
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
              isDark ? 'text-purple-300' : 'text-purple-700'
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
                  className={`p-4 rounded-lg border ${
                    isDark ? 'bg-gray-800/30 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      button.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900' :
                      button.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900' :
                      'bg-emerald-100 dark:bg-emerald-900'
                    }`}>
                      {button.icon}
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
                      <div className="space-y-1">
                        <p className={`text-xs font-medium ${
                          isDark ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          📍 Location: {button.location}
                        </p>
                        <p className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          💡 Usage: {button.usage}
                        </p>
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
                      <Badge key={questionIndex} variant="outline" className={`justify-start p-3 text-sm ${
                        isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}>
                        "💬 {question}"
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
              isDark ? 'text-orange-300' : 'text-orange-700'
            }`}>⭐ Key Features & Tips</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className={`p-4 rounded-lg ${
                    isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                  }`}
                >
                  <div className={`flex items-center gap-3 mb-3 ${
                    isDark ? 'text-orange-400' : 'text-orange-600'
                  }`}>
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
                        <span className={`mt-1 ${
                          isDark ? 'text-orange-400' : 'text-orange-600'
                        }`}>•</span>
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
              isDark ? 'text-yellow-300' : 'text-yellow-700'
            }`}>
              <Lightbulb className="w-6 h-6" />
              🏆 Pro Tips for Best Results
            </h3>
            <Card className={`p-6 ${
              isDark ? 'bg-gray-800/50' : 'bg-gradient-to-r from-yellow-50 to-orange-50'
            }`}>
              <CardContent className="p-0">
                <div className="grid gap-3">
                  {proTips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isDark ? 'bg-yellow-900' : 'bg-yellow-100'
                      }`}>
                        <span className={`text-sm font-medium ${
                          isDark ? 'text-yellow-300' : 'text-yellow-600'
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