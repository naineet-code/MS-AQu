import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "@/hooks/useTheme";
import { marked } from 'marked';

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
        className={`px-6 py-4 text-base leading-relaxed rounded-b-xl ${isDark ? 'text-white' : 'text-zinc-800'}`}
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
        {/* Render children as markdown if string, else as is */}
        {typeof children === 'string' ? (
          <span dangerouslySetInnerHTML={{ __html: marked.parse(children) }} />
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
    <div 
      className="p-6 rounded-xl border-l-4 transition-all duration-300 hover:shadow-lg"
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
      <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Answer:</h3>
      <div className={`${isDark ? "text-white" : "text-zinc-800"} prose prose-lg max-w-none`}
        dangerouslySetInnerHTML={{ __html: marked.parse(content || '') }}
      />
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
                    {paragraphs.map((p: any) => {
                      // Link page number to PDF
                      const match = p.pages.match(/\d+/);
                      const pageNum = match ? match[0] : null;
                      // Build full backend URL for PDF page link
                      const pdfLink = pageNum ? `http://57.154.209.147:6001/pdf/algo.pdf#page=${pageNum}` : null;
                      // Render paragraph text as markdown
                      return (
                        <div key={p.id} className="mb-4 text-base leading-relaxed">
                          {pdfLink ? (
                            <a
                              href={pdfLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold underline text-cyan-500 hover:text-cyan-400 dark:text-cyan-400 dark:hover:text-cyan-300 transition-all duration-300 hover:scale-105"
                            >
                              {p.pages}
                            </a>
                          ) : (
                            <span className="font-semibold">{p.pages}</span>
                          )}
                          {': '}
                          <span dangerouslySetInnerHTML={{ __html: marked.parse(p.text || '') }} />
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
                        const pdfLink = startPage ? `http://57.154.209.147:6001/pdf/algo.pdf#page=${startPage}` : null;
                        
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
                                className="font-medium text-emerald-500 hover:text-emerald-400 dark:text-emerald-400 dark:hover:text-emerald-300 underline transition-all duration-300 hover:scale-105"
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
