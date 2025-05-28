import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, Copy, Check, HelpCircle, Loader2, FileText, Brain, DollarSign, Quote, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "@/hooks/useTheme";
import { marked } from 'marked';
import { aiFormatter } from '@/utils/aiFormatter';
import { BACKEND_URL } from "@/config";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// Configure marked for enhanced rendering
marked.setOptions({
  breaks: true,
  gfm: true
});

interface ResponseCardProps {
  data: {
    answer: string;
    reasoning: string;
    relevant_paragraphs: Array<{
      text: string;
      page: number | number[];
    }>;
    citations: Array<{
      text: string;
      page: number | number[];
    }>;
    model: string;
    usage: {
      total_tokens: number;
      answer_tokens: number;
      reasoning_tokens: number;
    };
    costs: Array<{
      model: string;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      inputCost: number;
      outputCost: number;
      totalCost: number;
    }>;
    supporting_extracts: Array<{
      text: string;
    }>;
  };
}

// Copy Button Component
const CopyButton: React.FC<{ text: string; size?: 'sm' | 'md'; variant?: 'ghost' | 'secondary' }> = ({ 
  text, 
  size = 'md',
  variant = 'ghost'
}) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback for insecure context
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-8 w-8'
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className={`${sizeClasses[size]} ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          onClick={handleCopy}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Check className={`h-4 w-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Copy className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{copied ? 'Copied!' : 'Copy to clipboard'}</p>
      </TooltipContent>
    </Tooltip>
  );
};

// Enhanced Section Header Component
const SectionHeader: React.FC<{
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  copyText?: string;
  level?: 'primary' | 'secondary';
  description?: string;
}> = ({ title, icon, isExpanded, onToggle, copyText, level = 'primary', description }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const levelStyles = {
    primary: {
      container: `p-4 rounded-xl backdrop-blur-xl border ${
        isDark 
          ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-white/20' 
          : 'bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-black/10'
      }`,
      title: `text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`,
      icon: `h-6 w-6 ${isDark ? 'text-blue-300' : 'text-blue-600'}`
    },
    secondary: {
      container: `p-3 rounded-lg backdrop-blur-md border ${
        isDark 
          ? 'bg-gray-800/40 border-white/10' 
          : 'bg-white/40 border-black/5'
      }`,
      title: `text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`,
      icon: `h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`
    }
  };

  const styles = levelStyles[level];

  return (
    <motion.div
      className={styles.container}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <motion.button
          onClick={onToggle}
          className="flex items-center gap-3 flex-1 text-left focus:outline-none"
          whileHover={{ x: 2 }}
          transition={{ duration: 0.2 }}
        >
          <div className={styles.icon}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className={styles.title}>{title}</h3>
            {description && (
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {description}
              </p>
            )}
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.button>
        
        {copyText && (
          <div className="ml-3">
            <CopyButton text={copyText} size="md" variant="secondary" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Enhanced Content Container
const ContentContainer: React.FC<{
  children: React.ReactNode;
  level?: 'primary' | 'secondary';
}> = ({ children, level = 'primary' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const levelStyles = {
    primary: `p-6 rounded-xl backdrop-blur-xl border ${
      isDark 
        ? 'bg-gray-900/20 border-white/10' 
        : 'bg-white/30 border-black/5'
    }`,
    secondary: `p-4 rounded-lg backdrop-blur-md border ${
      isDark 
        ? 'bg-gray-800/20 border-white/5' 
        : 'bg-white/20 border-black/3'
    }`
  };

  return (
    <motion.div
      className={levelStyles[level]}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        boxShadow: isDark
          ? '0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 1px 4px 0 rgba(255,255,255,0.05) inset'
          : '0 8px 32px 0 rgba(31, 38, 135, 0.08), 0 1px 4px 0 rgba(0,0,0,0.03) inset',
      }}
    >
      {children}
    </motion.div>
  );
};

// Rich Text Renderer with enhanced styling
const RichTextRenderer: React.FC<{ content: string }> = ({ content }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const processContent = (text: string) => {
    const aiFormattedAnswer = aiFormatter.formatAnswer(text);
    let processed = marked.parse(aiFormattedAnswer) as string;
    
    // Enhanced styling for different elements
    processed = processed
      .replace(/<h1>/g, `<h1 class="text-xl font-bold mb-4 ${isDark ? 'text-blue-300' : 'text-blue-700'}">`)
      .replace(/<h2>/g, `<h2 class="text-lg font-semibold mb-3 ${isDark ? 'text-blue-300' : 'text-blue-700'}">`)
      .replace(/<h3>/g, `<h3 class="text-base font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}">`)
      .replace(/<p>/g, `<p class="mb-3 leading-relaxed text-sm ${isDark ? 'text-gray-100' : 'text-gray-800'}">`)
      .replace(/<ul>/g, `<ul class="mb-3 pl-6 list-disc space-y-2 text-sm">`)
      .replace(/<ol>/g, `<ol class="mb-3 pl-6 list-decimal space-y-2 text-sm">`)
      .replace(/<li>/g, `<li class="leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'}">`)
      .replace(/<strong>/g, `<strong class="font-semibold ${isDark ? 'text-yellow-300' : 'text-yellow-600'}">`)
      .replace(/<em>/g, `<em class="italic ${isDark ? 'text-purple-300' : 'text-purple-600'}">`)
      .replace(/<code>/g, `<code class="px-2 py-1 rounded text-sm ${isDark ? 'bg-gray-800 text-green-400' : 'bg-gray-100 text-green-700'} font-mono">`)
      .replace(/<blockquote>/g, `<blockquote class="border-l-4 ${isDark ? 'border-blue-400 bg-gray-800/50' : 'border-blue-500 bg-blue-50/50'} pl-4 py-2 my-3 italic rounded-r-lg text-sm">`)
      .replace(/<a /g, `<a class="text-blue-500 hover:text-blue-600 underline transition-colors" `)
      // Add hyperlink for page numbers
      .replace(/\[Page (\d+)\]/g, (match, page) => 
        `<a href="${BACKEND_URL}/pdf/reliance/reliance_faq.pdf#page=${page}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-600 underline transition-colors">[Page ${page}]</a>`
      );
    
    return processed;
  };

  return (
    <div 
      className="prose prose-sm max-w-none"
      style={{ lineHeight: '1.7' }}
      dangerouslySetInnerHTML={{ __html: processContent(content) }}
    />
  );
};

// Format page numbers helper
const formatPageNumbers = (pages: number[] | number | undefined) => {
  if (!pages) return "Page 1";
  if (Array.isArray(pages)) {
    return `Pages ${pages.join(', ')}`;
  }
  return `Page ${pages}`;
};

// Add a new component for expandable paragraph text
const ExpandableText: React.FC<{ text: string; maxLength?: number }> = ({ text, maxLength = 200 }) => {
  const [expanded, setExpanded] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isTruncated = text.length > maxLength;
  const displayText = expanded ? text : text.slice(0, maxLength) + '...';

  const textColor = isDark ? 'text-gray-200' : 'text-gray-700';
  const buttonColor = isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700';

  return (
    <div className="flex flex-col min-h-[80px]">
      <p className={`text-sm leading-relaxed ${textColor} flex-1`}>{displayText}</p>
      {isTruncated && (
        <div className="flex justify-end mt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`text-sm font-medium ${buttonColor} whitespace-nowrap`}
          >
            {expanded ? 'Show Less' : 'Show More'}
          </button>
        </div>
      )}
    </div>
  );
};

// Main Response Card Component
const ResponseCard: React.FC<ResponseCardProps> = ({ data }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Section expansion states
  const [expandedSections, setExpandedSections] = useState({
    answer: true,
    reasoning: false,
    sources: false,
    cost: false
  });

  // Sub-section expansion states
  const [expandedSubSections, setExpandedSubSections] = useState({
    citations: false,
    relevantParagraphs: false,
    modelBreakdown: false,
    pricingReference: false
  });

  // Add state for dynamic pricing
  const [pricing, setPricing] = useState<Record<string, {name: string; input: number; cachedInput: number; output: number}>>({});

  useEffect(() => {
    fetch("/api/pricing")
      .then(res => res.json())
      .then(setPricing)
      .catch(() => setPricing({}));
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleSubSection = (subSection: keyof typeof expandedSubSections) => {
    setExpandedSubSections(prev => ({
      ...prev,
      [subSection]: !prev[subSection]
    }));
  };

  // Loading state
  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl mx-auto"
      >
        <ContentContainer>
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <Loader2 className={`h-8 w-8 animate-spin mx-auto mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Loading response...
              </p>
            </div>
          </div>
        </ContentContainer>
      </motion.div>
    );
  }

  // Error state
  if (!data.answer) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl mx-auto"
      >
        <ContentContainer>
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <p className={`text-lg ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                Unable to generate response. Please try again.
              </p>
            </div>
          </div>
        </ContentContainer>
      </motion.div>
    );
  }

  // Calculate total cost
  const totalCost = data.costs?.reduce((sum, cost) => sum + (cost.totalCost || 0), 0) || 0;
  const totalTokens = data.costs?.reduce((sum, cost) => sum + (cost.totalTokens || 0), 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto space-y-6"
    >
      {/* 1. ANSWER SECTION */}
      <div className="space-y-3">
        <SectionHeader
          title="Answer"
          icon={<FileText />}
          isExpanded={expandedSections.answer}
          onToggle={() => toggleSection('answer')}
          copyText={data.answer}
          description="AI-generated response to your question"
        />
        
        <AnimatePresence>
          {expandedSections.answer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ContentContainer>
                <RichTextRenderer content={data.answer} />
              </ContentContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. SUPPORTING EXTRACTS (PARAPHRASSED) SECTION */}
      {data.supporting_extracts && data.supporting_extracts.length > 0 && (
        <div className="space-y-3">
          <SectionHeader
            title="Supporting Extracts (Paraphrased)"
            icon={<Quote />}
            isExpanded={true}
            onToggle={() => {}}
            copyText={data.supporting_extracts.map((e: any) => e.text).join('\n\n')}
            description="Key paraphrased extracts supporting the answer"
          />
          <ContentContainer>
            <div className="space-y-2">
              {data.supporting_extracts.map((extract: any, idx: number) => (
                <RichTextRenderer key={idx} content={extract.text} />
              ))}
            </div>
          </ContentContainer>
        </div>
      )}

      {/* 3. AI REASONING SECTION */}
      {data.reasoning && (
        <div className="space-y-3">
          <SectionHeader
            title="AI Reasoning"
            icon={<Brain />}
            isExpanded={expandedSections.reasoning}
            onToggle={() => toggleSection('reasoning')}
            copyText={data.reasoning}
            description="How the AI arrived at this answer"
          />
          
          <AnimatePresence>
            {expandedSections.reasoning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ContentContainer>
                  <RichTextRenderer content={data.reasoning} />
                </ContentContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 4. SOURCES & REFERENCES SECTION */}
      {(data.citations?.length > 0 || data.relevant_paragraphs?.length > 0) && (
        <div className="space-y-3">
          <SectionHeader
            title="Sources & References"
            icon={<BookOpen />}
            isExpanded={expandedSections.sources}
            onToggle={() => toggleSection('sources')}
            description={`${data.citations?.length || 0} citations and ${data.relevant_paragraphs?.length || 0} relevant paragraphs`}
          />
          
          <AnimatePresence>
            {expandedSections.sources && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Citations Sub-section */}
                {data.citations && data.citations.length > 0 && (
                  <div className="space-y-2">
                    <SectionHeader
                      title={`Citations (${data.citations.length})`}
                      icon={<Quote />}
                      isExpanded={expandedSubSections.citations}
                      onToggle={() => toggleSubSection('citations')}
                      level="secondary"
                      copyText={data.citations.map(c => `${c.text} (${formatPageNumbers(c.page)})`).join('\n\n')}
                    />
                    
                    <AnimatePresence>
                      {expandedSubSections.citations && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ContentContainer level="secondary">
                            <div className="space-y-3">
                              {data.citations.map((citation, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className={`p-3 rounded-lg border ${
                                    isDark 
                                      ? 'bg-gray-800/30 border-white/5' 
                                      : 'bg-white/30 border-black/5'
                                  }`}
                                >
                                  <div className="flex justify-between items-start gap-3">
                                    <p className={`text-sm leading-relaxed flex-1 ${
                                      isDark ? 'text-gray-200' : 'text-gray-700'
                                    }`}>
                                      {citation.text}
                                    </p>
                                    <a
                                      href={`${BACKEND_URL}/pdf/reliance/reliance_faq.pdf#page=${citation.page}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                                        isDark 
                                          ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/20' 
                                          : 'text-blue-600 hover:text-blue-700 hover:bg-blue-100/50'
                                      }`}
                                    >
                                      {formatPageNumbers(citation.page)}
                                    </a>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </ContentContainer>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Relevant Paragraphs Sub-section */}
                {data.relevant_paragraphs && data.relevant_paragraphs.length > 0 && (
                  <div className="space-y-2">
                    <SectionHeader
                      title={`Relevant Paragraphs (${data.relevant_paragraphs.length})`}
                      icon={<FileText />}
                      isExpanded={expandedSubSections.relevantParagraphs}
                      onToggle={() => toggleSubSection('relevantParagraphs')}
                      level="secondary"
                      copyText={data.relevant_paragraphs.map((p, i) => `Paragraph ${i + 1} (${formatPageNumbers(p.page)}):\n${p.text}`).join('\n\n')}
                    />
                    
                    <AnimatePresence>
                      {expandedSubSections.relevantParagraphs && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ContentContainer level="secondary">
                            <div className="space-y-4">
                              {data.relevant_paragraphs.map((para, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className={`p-4 rounded-lg border ${
                                    isDark 
                                      ? 'bg-gray-800/30 border-white/5' 
                                      : 'bg-white/30 border-black/5'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <span className={`text-sm font-medium ${
                                      isDark ? 'text-blue-300' : 'text-blue-600'
                                    }`}>
                                      Paragraph {index + 1}
                                    </span>
                                    <a
                                      href={`${BACKEND_URL}/pdf/reliance/reliance_faq.pdf#page=${para.page}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                                        isDark 
                                          ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/20' 
                                          : 'text-blue-600 hover:text-blue-700 hover:bg-blue-100/50'
                                      }`}
                                    >
                                      {formatPageNumbers(para.page)}
                                    </a>
                                  </div>
                                  <ExpandableText text={para.text} />
                                </motion.div>
                              ))}
                            </div>
                          </ContentContainer>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 5. COST ANALYSIS SECTION */}
      {data.costs && data.costs.length > 0 && (
        <div className="space-y-3">
          <SectionHeader
            title="Cost Analysis"
            icon={<DollarSign />}
            isExpanded={expandedSections.cost}
            onToggle={() => toggleSection('cost')}
            description={`Total: $${totalCost.toFixed(6)} • ${totalTokens.toLocaleString()} tokens`}
          />
          
          <AnimatePresence>
            {expandedSections.cost && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Total Cost Summary */}
                <ContentContainer>
                  <div className={`p-4 rounded-xl border-2 ${
                    isDark 
                      ? 'bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-500/30' 
                      : 'bg-gradient-to-r from-green-50/80 to-blue-50/80 border-green-500/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`text-lg font-semibold ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                          Total Response Cost
                        </h4>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Combined cost for all models used
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                          ${totalCost.toFixed(6)}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {totalTokens.toLocaleString()} tokens
                        </div>
                      </div>
                    </div>
                  </div>
                </ContentContainer>

                {/* Model Breakdown */}
                <div className="space-y-4">
                  {data.costs.map((cost, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border ${
                        isDark 
                          ? 'bg-gray-800/30 border-white/10' 
                          : 'bg-white/30 border-black/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h5 className={`font-semibold text-lg ${
                          isDark ? 'text-blue-300' : 'text-blue-600'
                        }`}>
                          {cost.model || 'Unknown Model'}
                        </h5>
                        <span className={`text-lg font-bold ${
                          isDark ? 'text-green-400' : 'text-green-600'
                        }`}>
                          ${(cost.totalCost || 0).toFixed(6)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-3 rounded-lg ${
                          isDark ? 'bg-blue-900/20' : 'bg-blue-50/50'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-sm font-medium ${
                              isDark ? 'text-blue-300' : 'text-blue-600'
                            }`}>
                              Input Tokens
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Tokens from your question and context</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className={`text-xl font-bold ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {(cost.inputTokens || 0).toLocaleString()}
                          </div>
                          <div className={`text-sm ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            ${(cost.inputCost || 0).toFixed(6)}
                          </div>
                        </div>

                        <div className={`p-3 rounded-lg ${
                          isDark ? 'bg-purple-900/20' : 'bg-purple-50/50'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-sm font-medium ${
                              isDark ? 'text-purple-300' : 'text-purple-600'
                            }`}>
                              Output Tokens
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Tokens in the AI's response</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className={`text-xl font-bold ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {(cost.outputTokens || 0).toLocaleString()}
                          </div>
                          <div className={`text-sm ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            ${(cost.outputCost || 0).toFixed(6)}
                          </div>
                        </div>

                        <div className={`p-3 rounded-lg ${
                          isDark ? 'bg-green-900/20' : 'bg-green-50/50'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-sm font-medium ${
                              isDark ? 'text-green-300' : 'text-green-600'
                            }`}>
                              Total
                            </span>
                          </div>
                          <div className={`text-xl font-bold ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {(cost.totalTokens || 0).toLocaleString()}
                          </div>
                          <div className={`text-sm ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            tokens
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pricing Reference */}
                <div className="space-y-2">
                  <SectionHeader
                    title="Pricing Reference"
                    icon={<HelpCircle />}
                    isExpanded={expandedSubSections.pricingReference}
                    onToggle={() => toggleSubSection('pricingReference')}
                    level="secondary"
                    description="Current model pricing per 1M tokens"
                  />
                  
                  <AnimatePresence>
                    {expandedSubSections.pricingReference && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ContentContainer>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className={`border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                                  <th className={`p-3 text-left ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Model</th>
                                  <th className={`p-3 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Input</th>
                                  <th className={`p-3 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Cached</th>
                                  <th className={`p-3 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Output</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(Object.values(pricing) as {name: string; input: number; cachedInput: number; output: number}[]).length > 0 ? (
                                  (Object.values(pricing) as {name: string; input: number; cachedInput: number; output: number}[]).map((pricing, index) => (
                                    <motion.tr
                                      key={pricing.name}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: index * 0.1 }}
                                      className={`border-t ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}
                                    >
                                      <td className={`p-3 font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>{pricing.name}</td>
                                      <td className={`p-3 text-right ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>${pricing.input.toFixed(2)}</td>
                                      <td className={`p-3 text-right ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>${pricing.cachedInput.toFixed(2)}</td>
                                      <td className={`p-3 text-right ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>${pricing.output.toFixed(2)}</td>
                                    </motion.tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="p-4 text-center text-sm text-gray-400">No pricing data available.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          
                          <div className={`mt-4 p-3 rounded-lg text-sm ${isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50/50 text-blue-700'}`}>
                            <p className="font-medium mb-1">Pricing Notes:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                              <li>All prices are per 1 million tokens</li>
                              <li>Cached input refers to previously processed context that can be reused</li>
                              <li>Actual costs may vary based on usage patterns and model availability</li>
                            </ul>
                          </div>
                        </ContentContainer>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Model Information Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className={`text-center py-4 border-t ${
          isDark ? 'border-white/10 text-gray-400' : 'border-black/10 text-gray-600'
        }`}
      >
        <p className="text-sm">
          Powered by <span className="font-medium">{data.model || 'AI Model'}</span>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ResponseCard;
