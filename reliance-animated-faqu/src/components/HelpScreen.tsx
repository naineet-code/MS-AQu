import React from "react";
import { motion } from "motion/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Search, FileText, BarChart3, Lightbulb, Zap } from "lucide-react";

interface HelpScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpScreen: React.FC<HelpScreenProps> = ({ isOpen, onClose }) => {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            How to Use FAQ Assistant
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Getting Started */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Getting Started
            </h3>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">
                  Welcome to your intelligent FAQ assistant! This platform uses AI to provide instant answers 
                  to your questions by searching through comprehensive knowledge bases. Simply type your question 
                  in the chat interface to get started.
                </p>
                <div className="grid gap-2">
                  <Badge variant="outline" className="justify-start">
                    💬 "What are the primary goals of the WSSI module in planning?"
                  </Badge>
                  <Badge variant="outline" className="justify-start">
                    📚 "Why split the Annual Operating Plan (AOP) into weekly segments?"
                  </Badge>
                  <Badge variant="outline" className="justify-start">
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
          >
            <h3 className="text-lg font-semibold mb-4">Key Features</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className="text-blue-600">{feature.icon}</div>
                        {feature.title}
                      </CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {feature.tips.map((tip, tipIndex) => (
                          <div key={tipIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-purple-600 mt-1">•</span>
                            {tip}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Quick Tips */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              Pro Tips
            </h3>
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-3">
                  {quickTips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{tip}</p>
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
            className="text-center pt-4 border-t"
          >
            <p className="text-sm text-muted-foreground">
              Need more help? Contact our support team or check the documentation for advanced features.
            </p>
          </motion.section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpScreen;