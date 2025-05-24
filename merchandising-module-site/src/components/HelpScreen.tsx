import React from "react";
import { motion } from "motion/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Search, TrendingUp, BarChart3, Lightbulb, Zap } from "lucide-react";

interface HelpScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpScreen: React.FC<HelpScreenProps> = ({ isOpen, onClose }) => {
  const features = [
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "AI-Powered Chat",
      description: "Ask questions about merchandising strategies, inventory optimization, and size curve analysis.",
      tips: ["Why do sizes sell differently in online vs retail stores?", "How does historical sales data improve accuracy?", "How does the system handle sudden size trends?"]
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "Smart Search",
      description: "Search through your merchandising data and get instant insights with natural language queries.",
      tips: ["What is the minimum data needed for size analysis?", "How do outlier sales affect inventory planning?", "What data is used to calculate size proportions?"]
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Trend Analysis",
      description: "Get real-time analysis of fashion trends and their impact on your inventory decisions.",
      tips: ["How is customer demand used to decide inventory?", "What's a good way to avoid stocking wrong sizes?", "Why adjust inventory based on sales channels?"]
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Size Optimization",
      description: "Optimize your size curves based on historical data and predictive algorithms.",
      tips: ["What is a Pivotal Row and why does it matter?", "Why set a Minimum Order Quantity (MOQ)?", "How does this system help avoid stockouts?"]
    }
  ];

  const quickTips = [
    "Start with broad questions and then get more specific",
    "Use the chat history to track your analysis sessions",
    "Ask for explanations of recommendations",
    "Request visual data representations when needed",
    "Save important insights for future reference"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            How to Use Merchandising Algorithms
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
                  Welcome to your AI-powered merchandising assistant! This platform helps you make data-driven decisions 
                  about inventory, sizing, and trend analysis. Simply type your questions in the chat interface to get started.
                </p>
                <div className="grid gap-2">
                  <Badge variant="outline" className="justify-start">
                    💬 "What does the Ideal Size Set (ISS) mean in retail?"
                  </Badge>
                  <Badge variant="outline" className="justify-start">
                    📊 "How do you calculate the right size mix for products?"
                  </Badge>
                  <Badge variant="outline" className="justify-start">
                    🎯 "What is Rate of Sale (ROS) and why is it important?"
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
                            <span className="text-green-600 mt-1">•</span>
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