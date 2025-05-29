import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, Copy, Check, HelpCircle, Loader2, FileText, Brain, DollarSign, Quote, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { marked } from 'marked';
import { aiFormatter } from '@/utils/aiFormatter';
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
    reasoning?: string;  // Made optional since it might not exist
    verification?: string;  // Made optional since it might not exist
    relevant_paragraphs?: Array<{
      text: string;
      page: number | number[];
    }>;
    citations?: Array<{
      text: string;
      page: number | number[];
    }>;
    // Support both old and new model structure
    models?: {
      reasoning: string;
      answer: string;
      verification: string;
    };
    model?: string;  // New backend response structure
    usage?: {
      total_tokens?: number;
      reasoning_tokens?: number;
      answer_tokens?: number;
      verification_tokens?: number;
    };
    costs?: Array<{
      model: string;
      // Support both camelCase and snake_case field names
      inputTokens?: number;
      input_tokens?: number;
      outputTokens?: number;
      output_tokens?: number;
      totalTokens?: number;
      total_tokens?: number;
      inputCost?: number;
      input_cost?: number;
      outputCost?: number;
      output_cost?: number;
      totalCost?: number;
      total_cost?: number;
    }>;
    supporting_extracts?: Array<{
      text: string;
    }>;
    // Additional fields that might exist in backend response
    success?: boolean;
    timestamp?: number;
  };
  backendUrl: string | null;
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
const RichTextRenderer: React.FC<{ content: string; backendUrl?: string | null }> = React.memo(({ content, backendUrl }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const processedContent = React.useMemo(() => {
    const aiFormattedAnswer = aiFormatter.formatAnswer(content);
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
      .replace(/<a /g, `<a class="text-blue-500 hover:text-blue-600 underline transition-colors" `);
    
    // Add hyperlink for page numbers only if backendUrl is available
    if (backendUrl) {
      try {
        // Comprehensive regex to catch any page references in various formats
        // This will match patterns like: "page 3", "pages 18-19", "on page 5", "(page 7)", etc.
        processed = processed.replace(/\b(?:on\s+)?(?:page|pages|Page|Pages)\s+(\d{1,4}(?:-\d{1,4})?(?:,\s*\d{1,4}(?:-\d{1,4})?)*)\b(?![^<]*?>)/gi, (match, pageNumbers) => {
          // Extract the prefix (everything before the page numbers)
          const prefix = match.replace(pageNumbers, '').trim();
          // Split page numbers by comma
          const pages = pageNumbers.split(/,\s*/).filter(p => p.trim());
          const pageLinks = pages.map(pageRange => {
            const cleanPage = pageRange.trim();
            if (/^\d{1,4}-\d{1,4}$/.test(cleanPage)) {
              const [start] = cleanPage.split('-');
              return `<a href="${backendUrl}/pdf/reliance/reliance_faq.pdf#page=${start}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-600 underline transition-colors">${cleanPage}</a>`;
            }
            if (/^\d{1,4}$/.test(cleanPage)) {
              return `<a href="${backendUrl}/pdf/reliance/reliance_faq.pdf#page=${cleanPage}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-600 underline transition-colors">${cleanPage}</a>`;
            }
            return cleanPage;
          }).join(', ');
          return `${prefix} ${pageLinks}`;
        });

        // Handle page references in parentheses like "(page 3)" or "(pages 18-19)"
        processed = processed.replace(/\((?:page|pages)\s+(\d{1,4}(?:-\d{1,4})?(?:,\s*\d{1,4}(?:-\d{1,4})?)*)\)/gi, (match, pageNumbers) => {
          const pages = pageNumbers.split(/,\s*/).filter(p => p.trim());
          const pageLinks = pages.map(pageRange => {
            const cleanPage = pageRange.trim();
            if (/^\d{1,4}-\d{1,4}$/.test(cleanPage)) {
              const [start] = cleanPage.split('-');
              return `<a href="${backendUrl}/pdf/reliance/reliance_faq.pdf#page=${start}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-600 underline transition-colors">${cleanPage}</a>`;
            }
            if (/^\d{1,4}$/.test(cleanPage)) {
              return `<a href="${backendUrl}/pdf/reliance/reliance_faq.pdf#page=${cleanPage}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-600 underline transition-colors">${cleanPage}</a>`;
            }
            return cleanPage;
          }).join(', ');
          const isPlural = pages.length > 1 || pages.some(p => p.includes('-'));
          return `(page${isPlural ? 's' : ''} ${pageLinks})`;
        });

        // Handle square bracket format [Page X]
        processed = processed.replace(/\[Page (\d{1,4})\]/g, (match, page) => 
          `<a href="${backendUrl}/pdf/reliance/reliance_faq.pdf#page=${page}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-600 underline transition-colors">[Page ${page}]</a>`
        );
      } catch (e) {
        // If anything goes wrong, just return the processed text as is
        console.error('Page link regex error:', e);
      }
    }
    
    return processed;
  }, [content, backendUrl, isDark]);

  return (
    <div 
      className="prose prose-sm max-w-none"
      style={{ lineHeight: '1.7' }}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
});

// Format page numbers helper
const formatPageNumbers = (pages: number[] | number | undefined) => {
  if (!pages) return "Page 1";
  if (Array.isArray(pages)) {
    return `Pages ${pages.join(', ')}`;
  }
  return `Page ${pages}`;
};

// Citation Page Link Component
const CitationPageLink: React.FC<{ 
  pages: number[] | number | undefined; 
  backendUrl: string | null; 
  isDark: boolean;
}> = ({ pages, backendUrl, isDark }) => {
  if (!pages || !backendUrl) {
    // Fallback to plain text if no backend URL
    return <span>{formatPageNumbers(pages)}</span>;
  }

  const linkClass = `text-blue-500 hover:text-blue-600 underline transition-colors cursor-pointer`;

  if (Array.isArray(pages)) {
    if (pages.length === 1) {
      return (
        <a 
          href={`${backendUrl}/pdf/reliance/reliance_faq.pdf#page=${pages[0]}`}
          target="_blank" 
          rel="noopener noreferrer"
          className={linkClass}
        >
          Page {pages[0]}
        </a>
      );
    } else {
      return (
        <span>
          Pages {pages.map((page, index) => (
            <span key={page}>
              <a 
                href={`${backendUrl}/pdf/reliance/reliance_faq.pdf#page=${page}`}
                target="_blank" 
                rel="noopener noreferrer"
                className={linkClass}
              >
                {page}
              </a>
              {index < pages.length - 1 ? ', ' : ''}
            </span>
          ))}
        </span>
      );
    }
  } else {
    return (
      <a 
        href={`${backendUrl}/pdf/reliance/reliance_faq.pdf#page=${pages}`}
        target="_blank" 
        rel="noopener noreferrer"
        className={linkClass}
      >
        Page {pages}
      </a>
    );
  }
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
const ResponseCard: React.FC<ResponseCardProps> = ({ data, backendUrl }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [expandedSections, setExpandedSections] = useState({
    answer: true,
    reasoning: false,
    verification: false,
    citations: false,
    costs: false
  });

  // Debug logging
  console.log('🎯 ResponseCard render with data:', {
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : [],
    hasAnswer: data?.answer ? 'YES' : 'NO',
    hasReasoning: data?.reasoning ? 'YES' : 'NO',
    hasModel: data?.model ? 'YES' : 'NO',
    hasModels: data?.models ? 'YES' : 'NO',
    hasCitations: data?.citations?.length > 0 ? `YES (${data.citations.length})` : 'NO',
    hasCosts: data?.costs?.length > 0 ? `YES (${data.costs.length})` : 'NO',
    backendUrl,
    rawData: data
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
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
  if (!data || !data.answer) {
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

  // Safely access model information with fallbacks
  const getModelInfo = (type: 'answer' | 'reasoning' | 'verification') => {
    // Handle both old structure (data.models) and new structure (data.model)
    if (data.models && typeof data.models === 'object') {
      return data.models[type] || 'Unknown model';
    }
    
    // For new backend response structure where model is a string
    if (data.model && typeof data.model === 'string') {
      return data.model;
    }
    
    return 'Unknown model';
  };

  // Safe access for citations with fallback
  const citations = data.citations || [];

  // Safe access for costs with fallback
  const costs = data.costs || [];

  // Safe access for usage with fallbacks
  const usage = data.usage || {
    total_tokens: 0,
    reasoning_tokens: 0,
    answer_tokens: 0,
    verification_tokens: 0
  };

  return (
    <Card className={`w-full ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <CardContent className="p-6 space-y-6 max-h-[calc(90vh-12rem)] overflow-y-auto">
        {/* Answer Section */}
        <Collapsible
          open={expandedSections.answer}
          onOpenChange={() => toggleSection('answer')}
        >
          <SectionHeader
            title="Answer"
            icon={<Brain className="h-5 w-5" />}
            isExpanded={expandedSections.answer}
            onToggle={() => toggleSection('answer')}
            copyText={data.answer}
            level="primary"
            description={`Generated using ${getModelInfo('answer')}`}
          />
          <CollapsibleContent>
            <ContentContainer>
              <RichTextRenderer content={data.answer} backendUrl={backendUrl} />
            </ContentContainer>
          </CollapsibleContent>
        </Collapsible>

        {/* Reasoning Section - only show if reasoning exists */}
        {data.reasoning && (
          <Collapsible
            open={expandedSections.reasoning}
            onOpenChange={() => toggleSection('reasoning')}
          >
            <SectionHeader
              title="Reasoning"
              icon={<HelpCircle className="h-5 w-5" />}
              isExpanded={expandedSections.reasoning}
              onToggle={() => toggleSection('reasoning')}
              copyText={data.reasoning}
              level="secondary"
              description={`Generated using ${getModelInfo('reasoning')}`}
            />
            <CollapsibleContent>
              <ContentContainer level="secondary">
                <RichTextRenderer content={data.reasoning} backendUrl={backendUrl} />
              </ContentContainer>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Verification Section - only show if verification exists */}
        {data.verification && (
          <Collapsible
            open={expandedSections.verification}
            onOpenChange={() => toggleSection('verification')}
          >
            <SectionHeader
              title="Verification"
              icon={<Check className="h-5 w-5" />}
              isExpanded={expandedSections.verification}
              onToggle={() => toggleSection('verification')}
              copyText={data.verification}
              level="secondary"
              description={`Generated using ${getModelInfo('verification')}`}
            />
            <CollapsibleContent>
              <ContentContainer level="secondary">
                <RichTextRenderer content={data.verification} backendUrl={backendUrl} />
              </ContentContainer>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Citations Section - only show if citations exist */}
        {citations.length > 0 && (
          <Collapsible
            open={expandedSections.citations}
            onOpenChange={() => toggleSection('citations')}
          >
            <SectionHeader
              title="Citations"
              icon={<Quote className="h-5 w-5" />}
              isExpanded={expandedSections.citations}
              onToggle={() => toggleSection('citations')}
              level="secondary"
            />
            <CollapsibleContent>
              <ContentContainer level="secondary">
                <div className="space-y-4">
                  {citations.map((citation, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <BookOpen className={`h-5 w-5 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {citation.text}
                          </p>
                          <div className={`text-xs mt-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <CitationPageLink 
                              pages={citation.page} 
                              backendUrl={backendUrl} 
                              isDark={isDark} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ContentContainer>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Costs Section - only show if costs exist */}
        {costs.length > 0 && (
          <Collapsible
            open={expandedSections.costs}
            onOpenChange={() => toggleSection('costs')}
          >
            <SectionHeader
              title="Cost Breakdown"
              icon={<DollarSign className="h-5 w-5" />}
              isExpanded={expandedSections.costs}
              onToggle={() => toggleSection('costs')}
              level="secondary"
            />
            <CollapsibleContent>
              <ContentContainer level="secondary">
                <div className="space-y-4">
                  {/* Calculate totals */}
                  {(() => {
                    const totalTokens = costs.reduce((sum, cost) => 
                      sum + (cost.totalTokens || cost.total_tokens || 0), 0
                    );
                    const totalCost = costs.reduce((sum, cost) => 
                      sum + (cost.totalCost || cost.total_cost || 0), 0
                    );
                    
                    return (
                      <>
                        {/* Totals Summary */}
                        <div
                          className={`p-4 rounded-lg border-2 ${
                            isDark 
                              ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/50' 
                              : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className={`text-base font-semibold ${
                              isDark ? 'text-gray-100' : 'text-gray-800'
                            }`}>
                              Total Usage & Cost
                            </h4>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${
                                isDark ? 'text-green-400' : 'text-green-600'
                              }`}>
                                ${totalCost.toFixed(3)}
                              </p>
                              <p className={`text-sm ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                {totalTokens.toLocaleString()} tokens
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Individual Model Costs */}
                        {costs.map((cost, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg ${
                              isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <Brain className={`h-5 w-5 ${
                                  isDark ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                              </div>
                              <div className="flex-1">
                                <h4 className={`text-sm font-medium ${
                                  isDark ? 'text-gray-200' : 'text-gray-800'
                                }`}>
                                  {cost.model}
                                </h4>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <div>
                                    <p className={`text-xs ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      Input Tokens: {(cost.inputTokens || cost.input_tokens || 0).toLocaleString()}
                                    </p>
                                    <p className={`text-xs ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      Output Tokens: {(cost.outputTokens || cost.output_tokens || 0).toLocaleString()}
                                    </p>
                                    <p className={`text-xs ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      Total Tokens: {(cost.totalTokens || cost.total_tokens || 0).toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className={`text-xs ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      Input Cost: ${(cost.inputCost || cost.input_cost || 0).toFixed(3)}
                                    </p>
                                    <p className={`text-xs ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      Output Cost: ${(cost.outputCost || cost.output_cost || 0).toFixed(3)}
                                    </p>
                                    <p className={`text-xs ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      Total Cost: ${(cost.totalCost || cost.total_cost || 0).toFixed(3)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </ContentContainer>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};

export default ResponseCard;