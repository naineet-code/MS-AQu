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
      <div className={`${bgColorClass} hover:bg-purple-900/80 transition-colors`}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left">
          <span className="font-medium text-lg">{title}</span>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className={`px-6 py-4 text-base leading-relaxed ${isDark ? 'bg-purple-900/20 text-white' : 'bg-purple-900/20 text-zinc-800'}`}>
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
    <div className={`p-4 bg-amber-50 border-l-4 border-amber-400 ${isDark ? 'bg-gray-800' : ''}`}>
      <h3 className="text-lg font-semibold mb-2">Answer:</h3>
      <div className={isDark ? "text-white" : "text-zinc-800"}
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
