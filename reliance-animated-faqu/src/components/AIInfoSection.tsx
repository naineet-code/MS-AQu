import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

interface AIInfoSectionProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIInfoSection: React.FC<AIInfoSectionProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [pricing, setPricing] = useState<Record<string, {name: string; input: number; cachedInput: number; output: number}>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // Using the correct pricing data for all models
    const pricingData = {
      "gpt-4.1": {
        name: "GPT-4.1",
        input: 2.00,
        cachedInput: 0.50,
        output: 8.00
      },
      "ai-4.1-mini": {
        name: "GPT-4.1-mini",
        input: 0.40,
        cachedInput: 0.10,
        output: 1.60
      },
      "ai-4.1-nano": {
        name: "GPT-4.1-nano",
        input: 0.10,
        cachedInput: 0.03,
        output: 0.40
      }
    };
    setPricing(pricingData);
    setLoading(false);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] p-0 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            AQu Intelligent Engine
          </DialogTitle>
          <DialogClose asChild>
            <Button size="icon" variant="ghost" aria-label="Close AI Info" className="h-8 w-8 ml-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              <span className="sr-only">Close</span>
              ×
            </Button>
          </DialogClose>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 max-h-[calc(90vh-8rem)]">
          {/* About */}
          <section>
            <h2 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">About</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>AQu Intelligent Engine</strong> is a production-grade RAG (Retrieval-Augmented Generation) system that combines NLTK-based text processing with a multi-model pipeline for optimal performance and cost efficiency. The system is designed for enterprise-grade reliability, with comprehensive error handling and detailed cost tracking.
            </p>
          </section>

          {/* Core Features */}
          <section>
            <h2 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">Core Features</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li><strong>NLTK-based Text Processing:</strong> Advanced text cleanup, sentence tokenization, and paragraph identification using NLTK's punkt and wordnet</li>
              <li><strong>Multi-Model Pipeline:</strong> GPT-4.1 for analysis, GPT-4.1-mini for relevance scoring</li>
              <li><strong>Smart Chunking:</strong> Page-aware paragraph identification with unique IDs (page_paragraph format)</li>
              <li><strong>Relevance Scoring:</strong> Batch processing (10 paragraphs per batch) with detailed reasoning</li>
              <li><strong>Cost Optimization:</strong> Cached input processing and token usage tracking with tiktoken</li>
              <li><strong>Error Recovery:</strong> Comprehensive fallback mechanisms and logging</li>
            </ul>
          </section>

          {/* Architecture Overview */}
          <section>
            <h2 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">Architecture Overview</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li><strong>Text Processing:</strong> NLTK-based cleanup with sentence tokenization and paragraph identification</li>
              <li><strong>Paragraph Management:</strong> Unique IDs (page_paragraph format) with metadata tracking (word count, sentence count)</li>
              <li><strong>Relevance Scoring:</strong> Batch processing (10 paragraphs per batch) with detailed reasoning and quality checks</li>
              <li><strong>Answer Generation:</strong> Top 5 paragraphs used for context with confidence scoring and citations</li>
              <li><strong>Cost Tracking:</strong> Per-model token usage and cost calculation using tiktoken</li>
              <li><strong>Error Handling:</strong> Comprehensive logging and fallback mechanisms</li>
            </ul>
          </section>

          {/* Model Details */}
          <section>
            <h2 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">Model Details</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left border border-gray-200 dark:border-gray-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-2 py-1 font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Model</th>
                    <th className="px-2 py-1 font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Input ($/M tokens)</th>
                    <th className="px-2 py-1 font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Cached Input</th>
                    <th className="px-2 py-1 font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Output</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="p-4 text-center text-sm text-gray-400">Loading pricing...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={4} className="p-4 text-center text-sm text-red-400">{error}</td></tr>
                  ) : Object.values(pricing).length > 0 ? (
                    (Object.values(pricing) as {name: string; input: number; cachedInput: number; output: number}[]).map((m) => (
                      <tr key={m.name} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-2 py-1 text-gray-800 dark:text-gray-200 whitespace-nowrap">{m.name}</td>
                        <td className="px-2 py-1 text-gray-700 dark:text-gray-300">{m.input.toFixed(2)}</td>
                        <td className="px-2 py-1 text-gray-700 dark:text-gray-300">{m.cachedInput.toFixed(2)}</td>
                        <td className="px-2 py-1 text-gray-700 dark:text-gray-300">{m.output.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="p-4 text-center text-sm text-gray-400">No pricing data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">Pricing is per 1 million tokens. Model selection is automatic based on query complexity and cost optimization.</p>
          </section>

          {/* Processing Pipeline */}
          <section>
            <h2 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">Processing Pipeline</h2>
            <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li><strong>Text Cleanup (NLTK):</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Sentence tokenization using NLTK's punkt</li>
                  <li>Word tokenization and stopword removal</li>
                  <li>Page marker preservation and standardization</li>
                  <li>Whitespace normalization and encoding fixes</li>
                </ul>
              </li>
              <li><strong>Paragraph Identification:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Double newline-based paragraph splitting</li>
                  <li>Page number extraction and tracking</li>
                  <li>Paragraph quality checks (length, content, alpha ratio)</li>
                  <li>Unique ID assignment (page_paragraph format)</li>
                </ul>
              </li>
              <li><strong>Relevance Scoring (GPT-4.1-mini):</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Batch processing (10 paragraphs per batch)</li>
                  <li>Detailed scoring (0.0-1.0) with reasoning</li>
                  <li>Quality checks and error handling</li>
                  <li>Score-based paragraph ranking</li>
                </ul>
              </li>
              <li><strong>Answer Generation (GPT-4.1):</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Top 5 paragraphs used for context</li>
                  <li>Comprehensive answer with reasoning</li>
                  <li>Source citation with paragraph IDs</li>
                  <li>Confidence level assessment</li>
                </ul>
              </li>
            </ol>
          </section>

          {/* Cost Calculation */}
          <section>
            <h2 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">Cost Calculation</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li><strong>Token Counting:</strong> Using tiktoken's cl100k_base encoding for accurate token calculation</li>
              <li><strong>Input Costs:</strong> Based on prompt tokens × model input rate</li>
              <li><strong>Cached Input:</strong> 75% discount for previously processed text</li>
              <li><strong>Output Costs:</strong> Based on completion tokens × model output rate</li>
              <li><strong>Cost Tracking:</strong> Per-model token usage and cost breakdown</li>
              <li><strong>Optimization:</strong> Smart caching and model selection</li>
            </ul>
          </section>

          {/* Performance & Security */}
          <section>
            <h2 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">Performance & Security</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li><strong>Processing Time:</strong> Average &lt;2 seconds for complete answers</li>
              <li><strong>Batch Processing:</strong> 10 paragraphs per batch for optimal performance</li>
              <li><strong>Error Recovery:</strong> Automatic fallback with detailed logging</li>
              <li><strong>Data Privacy:</strong> In-memory processing with no persistence</li>
              <li><strong>Monitoring:</strong> Comprehensive logging and performance tracking</li>
              <li><strong>Security:</strong> Enterprise-grade encryption and access controls</li>
            </ul>
          </section>

          {/* Technical Stack */}
          <section>
            <h2 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">Technical Stack</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li><strong>Backend:</strong> FastAPI with async support</li>
              <li><strong>Frontend:</strong> React 18 with TypeScript</li>
              <li><strong>AI:</strong> Azure OpenAI GPT-4.1 family</li>
              <li><strong>Processing:</strong> NLTK for text analysis</li>
              <li><strong>Styling:</strong> Tailwind CSS with custom components</li>
              <li><strong>Documentation:</strong> Comprehensive API documentation</li>
            </ul>
          </section>

          {/* Version & Build Info */}
          <section>
            <h2 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">Version & Build Info</h2>
            <p className="text-xs text-gray-500">AQu Intelligent Engine v1.0.0 &mdash; Last updated: 2024-04-14</p>
          </section>
        </div>
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 text-center">
          &copy; 2025 Increff Technologies Pvt. Ltd.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIInfoSection; 