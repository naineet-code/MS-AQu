import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, Copy } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "@/hooks/useTheme";
import { marked } from 'marked';
import { aiFormatter } from '@/utils/aiFormatter';
import { BACKEND_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Configure marked for enhanced rendering
marked.setOptions({
  breaks: true,
  gfm: true
});

// Enhanced rich text renderer component
interface RichTextRendererProps {
  content: string;
  className?: string;
  isPreFormatted?: boolean;
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, className = "", isPreFormatted = false }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Process the content to handle various formatting
  const processContent = (text: string): string => {
    // Use pre-formatted content or apply formatting if needed
    const formattedText = isPreFormatted ? text : aiFormatter.formatAnswer(text);
    
    // Convert marked to HTML
    let processed = marked.parse(formattedText) as string;
    
    // Add custom styling classes to elements with merchandising theme colors
    processed = processed
      .replace(/<h1>/g, `<h1 class="text-3xl font-bold mb-4 ${isDark ? 'text-cyan-300' : 'text-cyan-700'}">`)
      .replace(/<h2>/g, `<h2 class="text-2xl font-semibold mb-3 ${isDark ? 'text-cyan-300' : 'text-cyan-700'}">`)
      .replace(/<h3>/g, `<h3 class="text-xl font-semibold mb-2 ${isDark ? 'text-cyan-300' : 'text-cyan-700'}">`)
      .replace(/<h4>/g, `<h4 class="text-lg font-semibold mb-2 ${isDark ? 'text-cyan-300' : 'text-cyan-700'}">`)
      .replace(/<h5>/g, `<h5 class="text-base font-semibold mb-2 ${isDark ? 'text-cyan-300' : 'text-cyan-700'}">`)
      .replace(/<h6>/g, `<h6 class="text-sm font-semibold mb-2 ${isDark ? 'text-cyan-300' : 'text-cyan-700'}">`)
      .replace(/<p>/g, `<p class="mb-3 leading-relaxed">`)
      .replace(/<ul>/g, `<ul class="mb-3 pl-6 list-disc space-y-1">`)
      .replace(/<ol>/g, `<ol class="mb-3 pl-6 list-decimal space-y-1">`)
      .replace(/<li>/g, `<li class="leading-relaxed">`)
      .replace(/<blockquote>/g, `<blockquote class="border-l-4 ${isDark ? 'border-emerald-400 bg-gray-800' : 'border-emerald-500 bg-emerald-50'} pl-4 py-2 my-3 italic">`)
      .replace(/<code>/g, `<code class="px-2 py-1 rounded text-sm ${isDark ? 'bg-gray-800 text-emerald-400' : 'bg-gray-100 text-emerald-700'} font-mono">`)
      .replace(/<pre>/g, `<pre class="mb-3 p-4 rounded-lg overflow-x-auto ${isDark ? 'bg-gray-900 text-emerald-400' : 'bg-gray-100 text-emerald-700'}">`)
      .replace(/<table>/g, `<table class="mb-3 w-full border-collapse ${isDark ? 'border-gray-600' : 'border-gray-300'}">`)
      .replace(/<th>/g, `<th class="border ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-100'} px-3 py-2 text-left font-semibold">`)
      .replace(/<td>/g, `<td class="border ${isDark ? 'border-gray-600' : 'border-gray-300'} px-3 py-2">`)
      .replace(/<strong>/g, `<strong class="font-bold ${isDark ? 'text-amber-300' : 'text-amber-600'}">`)
      .replace(/<em>/g, `<em class="italic ${isDark ? 'text-purple-300' : 'text-purple-600'}">`)
      .replace(/<a /g, `<a class="text-cyan-500 hover:text-cyan-600 underline transition-colors" `);
    
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

// Add copy button component
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy text");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={handleCopy}
    >
      <Copy className="h-4 w-4" />
    </Button>
  );
};

// Update CollapsibleSection to include copy button
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  bgColorClass,
  children
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Collapsible className="w-full">
      <div 
        className="transition-all duration-300 hover:shadow-lg rounded-t-xl overflow-hidden"
        style={{
          background: isDark 
            ? 'linear-gradient(135deg, rgba(139,69,196,0.25) 0%, rgba(99,102,241,0.20) 100%)'
            : 'linear-gradient(135deg, rgba(139,69,196,0.15) 0%, rgba(99,102,241,0.12) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.25)'
        }}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-white/5 transition-colors">
          <span className={`font-semibold text-lg ${isDark ? 'text-purple-200' : 'text-purple-800'}`}>{title}</span>
          <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isDark ? 'text-purple-300' : 'text-purple-600'}`} />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent 
        className={`px-6 py-4 text-base leading-relaxed rounded-b-xl ${isDark ? 'text-white' : 'text-zinc-800'} relative group`}
        style={{
          background: isDark 
            ? 'linear-gradient(135deg, rgba(139,69,196,0.08) 0%, rgba(99,102,241,0.06) 100%)'
            : 'linear-gradient(135deg, rgba(139,69,196,0.05) 0%, rgba(99,102,241,0.04) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.2)',
          borderTop: 'none'
        }}
      >
        {typeof children === 'string' ? (
          <>
            <CopyButton text={children} />
            <RichTextRenderer content={children} />
          </>
        ) : children}
      </CollapsibleContent>
    </Collapsible>
  );
};

interface AnswerSectionProps {
  content: string;
  isPreFormatted?: boolean;
}

// Update AnswerSection to include copy button
export const AnswerSection: React.FC<AnswerSectionProps> = ({ content, isPreFormatted = false }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div 
      className="p-6 rounded-xl border-l-4 transition-all duration-300 hover:shadow-lg relative group"
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(16,185,129,0.12) 50%, rgba(6,182,212,0.10) 100%)'
          : 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(16,185,129,0.06) 50%, rgba(6,182,212,0.05) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderLeftColor: isDark ? '#10b981' : '#059669',
        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.2)',
        borderLeft: isDark ? '4px solid #10b981' : '4px solid #059669'
      }}
    >
      <CopyButton text={content} />
      <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Answer:</h3>
      <div className={`${isDark ? "text-white" : "text-zinc-800"}`}>
        <RichTextRenderer content={content || ''} isPreFormatted={isPreFormatted} />
      </div>
    </div>
  );
};

interface ResponseCardProps {
  data: any;
}

const ResponseCard: React.FC<ResponseCardProps> = ({ data }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!data) return null;

  const hasError = data.error;
  const paragraphs = data.relevant_paragraphs || [];
  const citations = data.citations || [];
  const hasAnswer = data.answer && data.answer !== "N/A";

  // Format citations for display
  const formattedCitations = citations.map((citation: any) => ({
    id: citation.id,
    section: citation.section || `Section ${citation.id}`,
    text: citation.text || '',
    page: citation.page || ''
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
    >
      <Card 
        className={`border shadow-2xl ${isDark ? 'text-white' : 'text-zinc-800'} overflow-hidden rounded-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]`}
        style={{
          background: isDark 
            ? 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,69,196,0.06) 30%, rgba(219,39,119,0.05) 60%, rgba(239,68,68,0.04) 100%)'
            : 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,69,196,0.03) 30%, rgba(219,39,119,0.025) 60%, rgba(239,68,68,0.02) 100%)',
          border: isDark ? '1.5px solid rgba(255,255,255,0.2)' : '1.5px solid rgba(255,255,255,0.3)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: isDark 
            ? '0 25px 50px 0 rgba(99,102,241,0.15), 0 8px 16px 0 rgba(139,69,196,0.10), inset 0 1px 0 rgba(255,255,255,0.15)'
            : '0 25px 50px 0 rgba(99,102,241,0.08), 0 8px 16px 0 rgba(139,69,196,0.05), inset 0 1px 0 rgba(255,255,255,0.6)'
        }}>
        <CardContent className="p-4">
          <div className="flex flex-col gap-6">
            {hasError && (
              <div className={`p-4 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{data.error}</div>
            )}

            {data.reasoning && (
              <CollapsibleSection title="Reasoning" bgColorClass="bg-purple-900/60">
                {data.reasoning}
              </CollapsibleSection>
            )}

            {paragraphs.length > 0 && (
              <CollapsibleSection title="Relevant Paragraphs" bgColorClass="bg-purple-900/60">
                {paragraphs.map((p: any) => (
                  <div key={p.id} className="mb-4 text-base leading-relaxed">
                    <span className="font-semibold">{p.pages}</span>
                    {': '}
                    <RichTextRenderer content={p.text || ''} className="inline" />
                  </div>
                ))}
              </CollapsibleSection>
            )}

            {formattedCitations.length > 0 && (
              <CollapsibleSection title="Citations" bgColorClass="bg-purple-900/60">
                <div className="space-y-4">
                  {formattedCitations.map((citation: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-white/5 relative group">
                      <CopyButton text={`${citation.section}\n${citation.text}`} />
                      <h4 className={`font-semibold mb-2 ${isDark ? 'text-purple-200' : 'text-purple-800'}`}>
                        {citation.section}
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {citation.text}
                      </p>
                      {citation.page && (
                        <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Page: {citation.page}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {hasAnswer ? (
              <AnswerSection 
                content={data.answer} 
                isPreFormatted={data.formattedAnswer ? true : false} 
              />
            ) : (
              <div className={`p-6 rounded-xl border-l-4 ${isDark ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-600'}`}>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  Answer Not Generated
                </h3>
                <p className={`${isDark ? 'text-red-300' : 'text-red-700'}`}>
                  The system was unable to generate an answer based on the provided information. 
                  You can review the relevant paragraphs and citations above to understand the available information.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ResponseCard;
