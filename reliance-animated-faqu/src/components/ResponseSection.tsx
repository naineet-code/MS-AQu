import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "@/hooks/useTheme";
import { marked } from 'marked';
import { aiFormatter } from '@/utils/aiFormatter';

// Configure marked for enhanced rendering
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false
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
    // First apply AI formatting to enhance plain text
    const aiFormatted = aiFormatter.formatAnswer(text);
    
    // Convert marked to HTML
    let processed = marked.parse(aiFormatted);
    
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

  return (
    <Collapsible className="w-full">
      <div className={`${bgColorClass} hover:bg-purple-900/80 transition-colors`}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left">
          <span className="font-medium text-lg">{title}</span>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className={`px-6 py-4 text-base leading-relaxed ${isDark ? 'bg-purple-900/20 text-white' : 'bg-purple-900/20 text-zinc-800'}`}>
        {/* Render children as rich text if string, else as is */}
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
  
  return (
    <div className={`p-4 bg-amber-50 border-l-4 border-amber-400 ${isDark ? 'bg-gray-800' : ''}`}>
      <h3 className="text-lg font-semibold mb-2">Answer:</h3>
      <div className={isDark ? "text-white" : "text-zinc-800"}>
        <RichTextRenderer content={content || ''} />
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
    >
      <Card className={`backdrop-blur-xl border ${isDark ? 'border-white/20 bg-black/40' : 'border-black/10 bg-white/40'} shadow-2xl ${isDark ? 'text-white' : 'text-zinc-800'} overflow-hidden`}>
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
                    {paragraphs.map((p: any) => {
                      // Link page number to PDF
                      const match = p.pages.match(/\d+/);
                      const pageNum = match ? match[0] : null;
                      // Build full backend URL for PDF page link
                      const pdfLink = pageNum ? `http://57.154.209.147:6001/pdf/source.pdf#page=${pageNum}` : null;
                      // Render paragraph text as markdown
                      return (
                        <div key={p.id} className="mb-4 text-base leading-relaxed">
                          {pdfLink ? (
                            <a
                              href={pdfLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold underline text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            >
                              {p.pages}
                            </a>
                          ) : (
                            <span className="font-semibold">{p.pages}</span>
                          )}
                          {': '}
                          <RichTextRenderer content={p.text || ''} className="inline" />
                        </div>
                      );
                    })}
                  </CollapsibleSection>
                )}

                {citations.length > 0 && (
                  <CollapsibleSection title="Citations" bgColorClass="bg-purple-900/60">
                    <div className="space-y-2">
                      {citations.map((citationId: string, idx: number) => {
                        // Find the corresponding paragraph to get page info
                        const citedParagraph = paragraphs.find((p: any) => p.id === citationId);
                        if (!citedParagraph) {
                          return (
                            <p key={idx} className={`text-sm italic ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Citation {citationId}
                            </p>
                          );
                        }
                        
                        // Extract page range
                        const pageMatch = citedParagraph.pages.match(/(\d+)(?:-(\d+))?/);
                        const startPage = pageMatch ? pageMatch[1] : null;
                        const endPage = pageMatch ? pageMatch[2] : null;
                        const pageRange = endPage ? `${startPage}-${endPage}` : startPage;
                        
                        // Create PDF link to start page
                        const pdfLink = startPage ? `http://57.154.209.147:6001/pdf/source.pdf#page=${startPage}` : null;
                        
                        return (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <span className={`italic ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Section {citationId}:
                            </span>
                            {pdfLink ? (
                              <a
                                href={pdfLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 underline transition-colors"
                              >
                                Page {pageRange}
                              </a>
                            ) : (
                              <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Page {pageRange || 'N/A'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleSection>
                )}


                {/* Answer Section: show answer or N/A */}
                <AnswerSection content={data.answer || "N/A"} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ResponseCard;
