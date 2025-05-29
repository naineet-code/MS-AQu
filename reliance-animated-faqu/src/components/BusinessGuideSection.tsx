import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  X, 
  Lightbulb, 
  Target, 
  TrendingUp, 
  Users, 
  Building, 
  CheckCircle, 
  Star,
  MessageSquare,
  FileText,
  Search,
  BarChart3,
  Clock,
  DollarSign,
  Shield,
  Rocket,
  Zap,
  Trophy,
  Briefcase,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Heart,
  Sparkles
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface BusinessGuideSectionProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  content: {
    overview: string;
    keyPoints: string[];
    useCases: { title: string; description: string; industry: string }[];
    tips: string[];
    benefits: string[];
  };
}

export function BusinessGuideSection({ isOpen, onClose }: BusinessGuideSectionProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeSection, setActiveSection] = useState<string>('getting-started');

  const guideSections: GuideSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Rocket className="w-5 h-5" />,
      color: 'blue',
      description: 'Quick start guide to AQu',
      content: {
        overview: 'AQu makes it easy to find answers from your documents. Simply ask questions in plain English and get instant, accurate responses with source citations.',
        keyPoints: [
          'Ask questions naturally - no special training needed',
          'Get answers instantly from your documents',
          'See exactly where information comes from',
          'Available 24/7 for your team'
        ],
        useCases: [
          {
            title: 'New Employee Questions',
            description: 'Help new hires find policies and procedures quickly.',
            industry: 'HR & Onboarding'
          },
          {
            title: 'Customer Support',
            description: 'Answer customer questions using your knowledge base.',
            industry: 'Customer Service'
          },
          {
            title: 'Quick Research',
            description: 'Find specific information from large document collections.',
            industry: 'Research & Analysis'
          }
        ],
        tips: [
          'Start with simple questions to get familiar',
          'Be specific for better results',
          'Check the citations to learn more',
          'Save useful answers for your team'
        ],
        benefits: [
          'Save time searching through documents',
          'Get consistent, accurate answers',
          'Share knowledge across your team',
          'Access information anytime'
        ]
      }
    },
    {
      id: 'why-aqu',
      title: 'Why Choose AQu',
      icon: <Trophy className="w-5 h-5" />,
      color: 'emerald',
      description: 'Advantages over general AI tools',
      content: {
        overview: 'Unlike ChatGPT or other general AI tools, AQu is trained specifically on your documents. This means more accurate answers and complete transparency about sources.',
        keyPoints: [
          'Trained on YOUR specific documents and data',
          'Every answer includes source citations',
          'No made-up or incorrect information',
          'Your data stays secure and private'
        ],
        useCases: [
          {
            title: 'Company Policies',
            description: 'Get answers about your specific policies and procedures.',
            industry: 'Internal Operations'
          },
          {
            title: 'Technical Documentation',
            description: 'Find information in your technical manuals and guides.',
            industry: 'Technical Support'
          },
          {
            title: 'Legal Documents',
            description: 'Search through contracts and legal documents safely.',
            industry: 'Legal & Compliance'
          }
        ],
        tips: [
          'Use AQu for company-specific questions',
          'Always check citations for verification',
          'Combine with general AI for creative tasks',
          'Trust AQu for factual information'
        ],
        benefits: [
          'Higher accuracy for your specific content',
          'Complete source transparency',
          'Better data security and privacy',
          'Designed for business use cases'
        ]
      }
    },
    {
      id: 'advanced-uses',
      title: 'Advanced Applications',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'purple',
      description: 'Beyond basic questions and answers',
      content: {
        overview: 'AQu can help with complex analysis, strategic planning, and cross-document insights. Think of it as your intelligent research assistant.',
        keyPoints: [
          'Analyze information across multiple documents',
          'Support strategic decision making',
          'Create comprehensive reports and summaries',
          'Find connections between different topics'
        ],
        useCases: [
          {
            title: 'Strategic Planning',
            description: 'Analyze market research and internal data for planning.',
            industry: 'Executive & Strategy'
          },
          {
            title: 'Project Research',
            description: 'Gather information from multiple sources for projects.',
            industry: 'Project Management'
          },
          {
            title: 'Training Materials',
            description: 'Create learning content from existing documentation.',
            industry: 'Training & Development'
          }
        ],
        tips: [
          'Ask complex, multi-part questions',
          'Request summaries and analysis',
          'Use for meeting preparation',
          'Create knowledge templates'
        ],
        benefits: [
          'Faster research and analysis',
          'Better informed decisions',
          'Consistent knowledge sharing',
          'Improved team productivity'
        ]
      }
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      icon: <Star className="w-5 h-5" />,
      color: 'orange',
      description: 'Tips for getting the most value',
      content: {
        overview: 'Follow these proven practices to maximize your success with AQu. These tips come from organizations that have successfully implemented AQu.',
        keyPoints: [
          'Write clear, specific questions for better results',
          'Use citations to dive deeper into topics',
          'Share useful queries with your team',
          'Regularly update your document base'
        ],
        useCases: [
          {
            title: 'Team Knowledge Base',
            description: 'Build a shared library of useful questions and answers.',
            industry: 'Knowledge Management'
          },
          {
            title: 'Training Programs',
            description: 'Use AQu to create consistent training materials.',
            industry: 'Learning & Development'
          },
          {
            title: 'Quality Assurance',
            description: 'Ensure consistent answers across your organization.',
            industry: 'Quality Management'
          }
        ],
        tips: [
          'Start with simple questions and build complexity',
          'Always verify important information',
          'Train your team on effective questioning',
          'Track which queries provide the most value'
        ],
        benefits: [
          'Faster adoption across your team',
          'More consistent results',
          'Better return on investment',
          'Improved knowledge retention'
        ]
      }
    }
  ];

  const activeContent = guideSections.find(section => section.id === activeSection)?.content;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[80vw] h-[88vh] p-0 gap-0 overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
        {/* Header */}
        <motion.div 
          className="relative px-6 py-4 border-b border-gray-200/30 dark:border-gray-700/30"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  User Guide
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Simple guide to using AQu effectively
                </p>
              </div>
            </div>
            <DialogClose asChild>
              <Button 
                className="rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-8 w-8 p-0 bg-transparent border-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </motion.div>

        <div className="flex flex-1 overflow-hidden">
          {/* Navigation Sidebar */}
          <motion.div 
            className="w-64 border-r border-gray-200/30 dark:border-gray-700/30 bg-gray-50/50 dark:bg-gray-800/30"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="p-4 border-b border-gray-200/30 dark:border-gray-700/30">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                Guide Sections
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose a topic to learn about
              </p>
            </div>
            
            <div className="p-3 space-y-1 overflow-y-auto flex-1">
              {guideSections.map((section) => {
                const isActive = activeSection === section.id;
                
                return (
                  <motion.button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50' 
                        : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-md ${
                        isActive 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {section.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium ${
                          isActive 
                            ? 'text-blue-900 dark:text-blue-100' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {section.title}
                        </h4>
                        <p className={`text-xs mt-1 ${
                          isActive 
                            ? 'text-blue-700 dark:text-blue-300' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeContent && (
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full overflow-y-auto"
                >
                  <div className="p-6 max-w-3xl">
                    {/* Section Header */}
                    <div className="mb-6">
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center gap-3 mb-4"
                      >
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                          <div className="text-blue-600 dark:text-blue-400">
                            {guideSections.find(s => s.id === activeSection)?.icon}
                          </div>
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {guideSections.find(s => s.id === activeSection)?.title}
                          </h2>
                        </div>
                      </motion.div>
                      <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                        {activeContent.overview}
                      </p>
                    </div>

                    {/* Key Points */}
                    <motion.section 
                      className="mb-6"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          Key Points
                        </h3>
                      </div>
                      
                      <div className="space-y-3">
                        {activeContent.keyPoints.map((point, index) => (
                          <motion.div
                            key={index}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            className="flex items-start gap-3 py-2"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {point}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.section>

                    {/* Use Cases */}
                    <motion.section 
                      className="mb-6"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Briefcase className="w-4 h-4 text-purple-500" />
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          Common Uses
                        </h3>
                      </div>
                      
                      <div className="space-y-4">
                        {activeContent.useCases.map((useCase, index) => (
                          <motion.div
                            key={index}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                            className="p-4 border border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:border-gray-300/50 dark:hover:border-gray-600/50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {useCase.title}
                              </h4>
                              <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md">
                                {useCase.industry}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                              {useCase.description}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.section>

                    {/* Tips */}
                    <motion.section 
                      className="mb-6"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="w-4 h-4 text-orange-500" />
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          Helpful Tips
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeContent.tips.map((tip, index) => (
                          <motion.div
                            key={index}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 + index * 0.05 }}
                            className="p-3 bg-orange-50/50 dark:bg-orange-900/10 rounded-lg border border-orange-200/30 dark:border-orange-800/30"
                          >
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {tip}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.section>

                    {/* Benefits */}
                    <motion.section 
                      className="mb-4"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Star className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          Benefits
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeContent.benefits.map((benefit, index) => (
                          <motion.div
                            key={index}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            className="flex items-start gap-2 py-2"
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {benefit}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.section>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 