import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "@/hooks/useTheme";
import { marked } from 'marked';
import { aiFormatter } from '@/utils/aiFormatter';
import { BACKEND_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { createRoot } from 'react-dom/client';

// Configure marked for enhanced rendering
marked.setOptions({
  breaks: true,
  gfm: true
});

// Enhanced rich text renderer component
interface RichTextRendererProps {
  content: string;
  className?: string;
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, className = "" }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Process the content to handle various formatting
  const processContent = (text: string) => {
    // Split content into answer and references if "References:" is present
    const [answerPart, referencesPart] = text.split(/References:\s*/i);
    
    // First apply AI formatting to enhance plain text
    const aiFormattedAnswer = aiFormatter.formatAnswer(answerPart);
    
    // Convert marked to HTML
    let processed = marked.parse(aiFormattedAnswer) as string;
    
    // Add custom styling classes to elements
    processed = processed
      .replace(/<h1>/g, `<h1 class="text-3xl font-bold mb-4 ${isDark ? 'text-blue-300' : 'text-blue-700'}">`)
      .replace(/<h2>/g, `<h2 class="text-2xl font-semibold mb-3 ${isDark ? 'text-blue-300' : 'text-blue-700'}">`)
      .replace(/<h3>/g, `<h3 class="text-xl font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}">`)
      .replace(/<h4>/g, `<h4 class="text-lg font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}">`)
      .replace(/<h5>/g, `<h5 class="text-base font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}">`)
      .replace(/<h6>/g, `<h6 class="text-sm font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}">`)
      .replace(/<p>/g, `<p class="mb-3 leading-relaxed">`)
      .replace(/<ul>/g, `<ul class="mb-3 pl-6 list-disc space-y-1">`)
      .replace(/<ol>/g, `<ol class="mb-3 pl-6 list-decimal space-y-1">`)
      .replace(/<li>/g, `<li class="leading-relaxed">`)
      .replace(/<blockquote>/g, `<blockquote class="border-l-4 ${isDark ? 'border-blue-400 bg-gray-800' : 'border-blue-500 bg-blue-50'} pl-4 py-2 my-3 italic">`)
      .replace(/<code>/g, `<code class="px-2 py-1 rounded text-sm ${isDark ? 'bg-gray-800 text-green-400' : 'bg-gray-100 text-green-700'} font-mono">`)
      .replace(/<pre>/g, `<pre class="mb-3 p-4 rounded-lg overflow-x-auto ${isDark ? 'bg-gray-900 text-green-400' : 'bg-gray-100 text-green-700'}">`)
      .replace(/<table>/g, `<table class="mb-3 w-full border-collapse ${isDark ? 'border-gray-600' : 'border-gray-300'}">`)
      .replace(/<th>/g, `<th class="border ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-100'} px-3 py-2 text-left font-semibold">`)
      .replace(/<td>/g, `<td class="border ${isDark ? 'border-gray-600' : 'border-gray-300'} px-3 py-2">`)
      .replace(/<strong>/g, `<strong class="font-bold ${isDark ? 'text-yellow-300' : 'text-yellow-600'}">`)
      .replace(/<em>/g, `<em class="italic ${isDark ? 'text-purple-300' : 'text-purple-600'}">`)
      .replace(/<a /g, `<a class="text-blue-500 hover:text-blue-600 underline transition-colors" `);

    // If there are references, format them separately
    if (referencesPart) {
      const references = referencesPart
        .split(/(?<=\.")\s*(?=")/) // Split on quotes with proper spacing
        .filter(ref => ref.trim()) // Remove empty references
        .map(ref => ref.trim());

      if (references.length > 0) {
        processed += `
          <div class="mt-8 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}">
            <h3 class="text-xl font-semibold mb-4 ${isDark ? 'text-blue-300' : 'text-blue-700'}">References:</h3>
            <ul class="space-y-3">
              ${references.map(ref => `
                <li class="flex items-start">
                  <span class="text-lg mr-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}">•</span>
                  <span class="text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}">${ref}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }
    }
    
    return processed;
  };

  return (
    <div 
      className={`prose prose-lg max-w-none ${className} ${
        isDark ? 'prose-invert' : ''
      }`}
      dangerouslySetInnerHTML={{ __html: processContent(content) }}
    />
  );
};

interface CollapsibleSectionProps {
  title: string;
  bgColorClass: string;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  bgColorClass,
  children
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Get content to copy based on children type
  const getContentToCopy = () => {
    if (typeof children === 'string') return children;
    if (Array.isArray(children)) {
      return children.map((child: any) => {
        if (child.props?.text) return child.props.text;
        if (child.props?.children) return child.props.children;
        return '';
      }).join('\n\n');
    }
    return '';
  };

  return (
    <Collapsible className="w-full">
      <div className={`${bgColorClass} hover:bg-purple-900/80 transition-colors relative`}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left">
          <span className="font-medium text-lg">{title}</span>
          <div className="flex items-center gap-2">
            <CopyButton text={getContentToCopy()} variant="section" />
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
          </div>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className={`px-6 py-4 text-base leading-relaxed ${isDark ? 'bg-purple-900/20 text-white' : 'bg-purple-900/20 text-zinc-800'}`}>
        {typeof children === 'string' ? (
          <RichTextRenderer content={children} />
        ) : children}
      </CollapsibleContent>
    </Collapsible>
  );
};

interface AnswerSectionProps {
  content: string;
}

export const AnswerSection: React.FC<AnswerSectionProps> = ({ content }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className={`p-8 rounded-3xl backdrop-blur-xl border ${isDark ? 'border-white/20' : 'border-black/10'} shadow-2xl`}
        style={{
          background: isDark 
            ? 'rgba(30, 41, 59, 0.3)'
            : 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          boxShadow: isDark
            ? '0 8px 32px 0 rgba(31, 38, 135, 0.25), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset'
            : '0 8px 32px 0 rgba(31, 38, 135, 0.10), 0 1.5px 8px 0 rgba(0,0,0,0.04) inset',
          border: isDark ? '1.5px solid rgba(255,255,255,0.18)' : '1.5px solid rgba(0,0,0,0.08)',
        }}
      >
        <div className="space-y-4">
          {/* Answer Heading */}
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>Answer</h3>
            <button
              onClick={handleCopy}
              className={`p-2 h-auto rounded-md transition-all duration-200 focus:outline-none ${
                isDark 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-white/10' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-purple-100/60'
              }`}
              title={copied ? 'Copied!' : 'Copy to clipboard'}
              style={{ lineHeight: 0 }}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              )}
            </button>
          </div>
          {/* Answer Content */}
          <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}
            style={{ fontSize: '1.05rem', lineHeight: '1.7' }}
          >
            <div 
              className={`font-normal leading-relaxed ${isDark ? 'text-gray-100' : 'text-gray-800'}`}
              dangerouslySetInnerHTML={{ 
                __html: content.replace(
                  /<strong class=\"font-bold text-yellow-600\">WSSI<\/strong>/g,
                  '<strong class="font-semibold text-blue-500">WSSI</strong>'
                )
              }} 
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

interface ResponseCardProps {
  data: any;
}

// Helper to get unique page numbers from a string like "Page 1, 2, 3" or "Page 1-3"
function getUniquePages(pageStr: string | number[]): number[] {
  if (!pageStr) return [];
  if (Array.isArray(pageStr)) {
    return Array.from(new Set(pageStr.map(p => Number(p)).filter(n => !isNaN(n))));
  }
  // Remove 'Page' or 'Pages', then split on commas or dashes
  pageStr = pageStr.replace(/Page(s)?/i, '').replace(/-/g, ',');
  return Array.from(
    new Set(
      pageStr
        .split(',')
        .map(p => parseInt(p.trim(), 10))
        .filter(n => !isNaN(n))
    )
  );
}

// Helper to render unique page numbers as clickable links
function renderUniquePageLinks(pageStr: string) {
  const uniquePages = getUniquePages(pageStr);
  return uniquePages.map((page, idx) => (
    <a
      key={page + idx}
      href={`${BACKEND_URL}/pdf/reliance/reliance_faq.pdf#page=${page}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 hover:text-blue-700 underline mx-1"
      aria-label={`Open PDF at page ${page}`}
    >
      {page}
    </a>
  ));
}

function renderPageLinksLine(pages: Set<string>) {
  const sortedPages = Array.from(pages).sort((a, b) => Number(a) - Number(b));
  return (
    <span>
      Page{' '}
      {sortedPages.map((page, idx) => (
        <span key={page}>
          <a
            href={`${BACKEND_URL}/pdf/reliance/reliance_faq.pdf#page=${page}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline"
            aria-label={`Open PDF at page ${page}`}
          >
            {page}
          </a>
          {idx < sortedPages.length - 1 && ', '}
        </span>
      ))}
    </span>
  );
}

function isPageText(text: string) {
  // Matches 'Page 1', 'Page 1, 2, 3', 'Page 13, 14, 15, 16', etc.
  return /^Page(\s+\d+(,\s*\d+)*)$/.test(text.trim());
}

function truncateText(text: string, maxLength = 120) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

function groupCitationsByIndividualPage(citations: any[]) {
  // Map: page number -> Set of unique paragraph texts
  const grouped: Record<string, Set<string>> = {};
  citations.forEach((citation) => {
    // Skip if text is just 'Page ...'
    if (citation.text && /^Page(\s+\d+(,\s*\d+)*)$/.test(citation.text.trim())) return;
    const pages = getUniquePages(citation.page || citation.text || '');
    pages.forEach((page) => {
      if (!grouped[page]) grouped[page] = new Set();
      if (citation.text) grouped[page].add(citation.text);
    });
  });
  // Return sorted by page number
  return Object.entries(grouped).sort((a, b) => Number(a[0]) - Number(b[0]));
}

function groupCitationsByPageRange(citations: any[]) {
  // Group by unique set of page numbers
  const grouped: Record<string, { pages: number[], texts: string[] }> = {};
  citations.forEach((citation) => {
    // Skip if text is just 'Page ...'
    if (citation.text && /^Page(\s+\d+(,\s*\d+)*)$/.test(citation.text.trim())) return;
    const pages = getUniquePages(citation.page || '');
    if (pages.length === 0) return;
    const sortedPages = pages.sort((a, b) => a - b);
    const key = sortedPages.join(',');
    if (!grouped[key]) {
      grouped[key] = { pages: sortedPages, texts: [] };
    }
    // Avoid duplicate paragraphs
    if (citation.text && !grouped[key].texts.includes(citation.text)) {
      grouped[key].texts.push(citation.text);
    }
  });
  // Return sorted by first page number
  return Object.values(grouped).sort((a, b) => a.pages[0] - b.pages[0]);
}

function renderPageRangeHeading(pages: number[]) {
  if (pages.length === 1) {
    return `Page ${pages[0]}`;
  } else if (pages.length > 1) {
    return `Pages ${pages[0]}–${pages[pages.length - 1]}`;
  }
  return '';
}

const ShowMoreLess: React.FC<{ text: string; maxLength?: number }> = ({ text, maxLength = 120 }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  if (text.length <= maxLength) return <span>{text}</span>;
  return (
    <span>
      {expanded ? text : text.slice(0, maxLength) + '...'}{' '}
      <button
        className="text-blue-500 hover:underline text-xs ml-1"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </span>
  );
};

// Add this new component before the ResponseCard component
interface TokenUsageProps {
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost: {
    input_cost: number;
    output_cost: number;
    total_cost: number;
  };
  model: string;
}

const TokenUsageSection: React.FC<TokenUsageProps> = ({ usage, cost, model }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isExpanded, setIsExpanded] = useState(false);

  // Model pricing information
  const modelPricing = {
    'ai-4.1-mini': {
      input: 0.00015,
      output: 0.0006,
      name: 'AI-4.1 Mini'
    },
    'ai-4.1-nano': {
      input: 0.0001,
      output: 0.0004,
      name: 'AI-4.1 Nano'
    }
  };

  const currentModel = modelPricing[model as keyof typeof modelPricing] || modelPricing['ai-4.1-mini'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Usage Details</p>
          <CollapsibleTrigger asChild>
            <button
              className={`p-1 rounded-full transition-all duration-300 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              />
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4 items-start">
              <div className="flex flex-col items-start md:items-center w-full">
                <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Token Usage</p>
                <div className={`text-sm space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                  style={{ minWidth: 160 }}>
                  <motion.p initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}>
                    Prompt Tokens: {usage.prompt_tokens.toLocaleString()}
                  </motion.p>
                  <motion.p initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}>
                    Completion Tokens: {usage.completion_tokens.toLocaleString()}
                  </motion.p>
                  <motion.p initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }} className="font-medium">
                    Total Tokens: {usage.total_tokens.toLocaleString()}
                  </motion.p>
                </div>
              </div>
              <div className="flex flex-col items-start md:items-center w-full">
                <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cost (USD)</p>
                <div className={`text-sm space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                  style={{ minWidth: 160 }}>
                  <motion.p initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}>
                    Input Cost: ${cost.input_cost.toFixed(3)}
                  </motion.p>
                  <motion.p initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}>
                    Output Cost: ${cost.output_cost.toFixed(3)}
                  </motion.p>
                  <motion.p initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }} className="font-medium">
                    Total Cost: ${cost.total_cost.toFixed(3)}
                  </motion.p>
                </div>
              </div>
            </div>
            {/* Model Pricing Information */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
              className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <p className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Model Pricing ({currentModel.name})</p>
              <div className={`text-sm space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                style={{ minWidth: 160 }}>
                <p>Input: ${currentModel.input.toFixed(4)} per 1K tokens</p>
                <p>Output: ${currentModel.output.toFixed(4)} per 1K tokens</p>
              </div>
            </motion.div>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
};

const ResponseCard: React.FC<ResponseCardProps> = ({ data }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!data) return null;

  const hasError = data.error;
  const paragraphs = Array.isArray(data.relevant_paragraphs) ? data.relevant_paragraphs : [];
  const citations = Array.isArray(data.citations) ? data.citations : [];
  const hasAnswer = typeof data.answer === 'string' && data.answer !== "N/A";
  const hasReasoning = typeof data.reasoning === 'string' && data.reasoning.trim() !== "";
  const statusMessage = typeof data.status_message === 'string' ? data.status_message : null;

  // Common background styles for sections
  const sectionBackgroundStyle = {
    background: isDark 
      ? 'rgba(30, 41, 59, 0.3)'
      : 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  };

  // Process reasoning text to add line breaks before each section
  const processReasoning = (text: string) => {
    if (!text) return '';
    
    // First, replace all occurrences of chunk/chunks with section/sections
    let processedText = text
      .replace(/\bchunks\b/gi, 'sections')
      .replace(/\bchunk\b/gi, 'section')
      .replace(/\bChunks\b/g, 'Sections')
      .replace(/\bChunk\b/g, 'Section');
    
    // Then handle the section headers
    processedText = processedText.replace(/(?:^|\n)(?:this\s+)?(?:section|Section)\s*(\d+)(?:\s+is)?/gi, (match, num) => {
      // Convert the number to a string and increment it by 1
      const sectionNum = parseInt(num, 10) + 1;
      return `\n\n**Section ${sectionNum}:**`;
    });

    // Add styling to make sections more distinct
    processedText = processedText.replace(/\*\*(Section \d+):\*\*/g, (match, section) => {
      return `<span class="font-semibold ${isDark ? 'text-purple-300' : 'text-purple-700'}">${section}</span>`;
    });

    return processedText;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
    >
      <Card 
        className={`backdrop-blur-xl border ${isDark ? 'border-white/20' : 'border-black/10'} shadow-2xl ${isDark ? 'text-white' : 'text-zinc-800'} overflow-hidden`}
        style={{
          background: isDark 
            ? 'rgba(30, 41, 59, 0.3)'
            : 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderRadius: 24,
          boxShadow: isDark
            ? '0 12px 32px 0 rgba(31, 38, 135, 0.25), 0 1.5px 8px 0 rgba(255,255,255,0.08) inset'
            : '0 12px 32px 0 rgba(31, 38, 135, 0.10), 0 1.5px 8px 0 rgba(0,0,0,0.04) inset',
        }}
      >
        <CardContent className="p-6">
          <div className="flex flex-col gap-6">
            {/* Error Message */}
            {hasError && (
              <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
                {data.error}
              </div>
            )}

            {/* Answer Section */}
            {hasAnswer ? (
              <AnswerSection content={data.answer} />
            ) : (
              <div 
                className={`p-6 rounded-xl border-l-4 ${isDark ? 'border-red-500' : 'border-red-600'}`}
                style={sectionBackgroundStyle}
              >
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  Answer Not Generated
                </h3>
                <p className={`${isDark ? 'text-red-300' : 'text-red-700'}`}>
                  The system was unable to generate an answer based on the provided information. 
                  You can review the relevant paragraphs and citations above to understand the available information.
                </p>
              </div>
            )}

            {/* Reasoning Section */}
            {hasReasoning && (
              <CollapsibleSection title="Reasoning" bgColorClass="bg-purple-900/60">
                <div
                  className={`rounded-lg border ${isDark ? 'border-purple-800' : 'border-purple-300'} p-4 shadow-sm`}
                  style={sectionBackgroundStyle}
                >
                  <div
                    className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    style={{ fontFamily: 'inherit', fontSize: '1rem', lineHeight: '1.7' }}
                    dangerouslySetInnerHTML={{ __html: processReasoning(data.reasoning) }}
                  />
                </div>
              </CollapsibleSection>
            )}

            {/* Relevant Paragraphs Section */}
            {paragraphs.length > 0 && (
              <CollapsibleSection title="Relevant Paragraphs" bgColorClass="bg-purple-900/60">
                <div className="space-y-4">
                  {paragraphs.map((paragraph: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-lg border ${isDark ? 'border-purple-800' : 'border-purple-300'} relative group shadow-sm`}
                      style={sectionBackgroundStyle}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-semibold m-0 ${isDark ? 'text-purple-200' : 'text-purple-800'}`}>Section {idx + 1}</h4>
                        <CopyButton text={`${paragraph.text}`} variant="subsection" />
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <ShowMoreLess text={paragraph.text} />
                      </div>
                      {paragraph.pages && (
                        <div className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{renderUniquePageLinks(paragraph.pages)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Status Message at the bottom */}
            {statusMessage && (
              <div className={`text-sm mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'} italic text-right`}>
                {statusMessage}
              </div>
            )}

            {/* Token Usage and Cost Section */}
            {data.usage && data.cost && (
              <TokenUsageSection
                usage={data.usage}
                cost={data.cost}
                model={data.model || 'ai-4.1-mini'}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Update CopyButton to use the same style as the AnswerSection copy icon
const CopyButton: React.FC<{ text: string; customClass?: string; size?: 'sm' | 'md'; variant?: 'section' | 'subsection' }> = ({ text, customClass = '', size = 'md', variant = 'section' }) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Icon color and size logic
  let iconClass = '';
  if (variant === 'section') {
    iconClass = isDark ? 'text-purple-300' : 'text-purple-600';
  } else {
    iconClass = isDark ? 'text-purple-200' : 'text-purple-400';
  }
  const iconSizeClass = variant === 'subsection' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <button
      onClick={handleCopy}
      className={`p-2 h-auto rounded-md transition-all duration-200 focus:outline-none ${customClass} ${
        isDark 
          ? 'hover:bg-white/10' 
          : 'hover:bg-purple-100/60'
      }`}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      style={{ lineHeight: 0 }}
    >
      {copied ? (
        <Check className={`${iconSizeClass} ${iconClass}`} />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`${iconSizeClass} ${iconClass}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
      )}
    </button>
  );
};

export default ResponseCard;
