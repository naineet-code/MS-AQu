import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { loadBackendUrl } from "@/config";

interface PricingData {
  [key: string]: {
    name: string;
    input: number;
    cachedInput: number;
    output: number;
  };
}

interface AIInfoSectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIInfoSection({ isOpen, onClose }: AIInfoSectionProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [pricing, setPricing] = React.useState<PricingData>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchPricing = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the proper backend URL
        const backendUrl = await loadBackendUrl();
        const response = await fetch(`${backendUrl}/api/pricing`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch pricing data`);
        }
        
        const data = await response.json();
        setPricing(data);
      } catch (err) {
        console.error('Pricing fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load pricing data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchPricing();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <DialogHeader>
          <DialogTitle className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            🧠 AQu AI System Information
          </DialogTitle>
          <DialogClose asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              aria-label="Close AI Info" 
              className="absolute right-4 top-4 h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-6 mt-4 pr-2">
          {/* About Section */}
          <section className="space-y-3">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              About Our AI System
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Our system uses a multi-model approach to provide accurate and efficient responses:
            </p>
            <ul className={`list-disc list-inside space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>Mini Model: Used for initial reasoning and query understanding</li>
              <li>Main Model: Generates comprehensive answers based on the reasoning</li>
              <li>Nano Model: Verifies the accuracy and relevance of the response</li>
            </ul>
          </section>

          {/* Core Features */}
          <section className="space-y-3">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Core Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <h4 className={`font-medium mb-2 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                  Multi-Model Architecture
                </h4>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Combines different AI models for optimal performance and accuracy
                </p>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <h4 className={`font-medium mb-2 ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                  Cost Optimization
                </h4>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Efficient token usage and model selection for cost-effective responses
                </p>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <h4 className={`font-medium mb-2 ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                  Quality Assurance
                </h4>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Multiple verification steps ensure accurate and reliable answers
                </p>
              </div>
            </div>
          </section>

          {/* Model Details */}
          <section className="space-y-3">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Model Details
            </h3>
            <div className="space-y-3">
              {isLoading ? (
                <div className={`p-4 rounded-lg text-center ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <p className="text-sm text-gray-400">Loading pricing data...</p>
                </div>
              ) : error ? (
                <div className={`p-4 rounded-lg text-center ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              ) : Object.values(pricing).length > 0 ? (
                Object.values(pricing).map((model) => (
                  <div
                    key={model.name}
                    className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                        }`}>
                          <span className={`text-xs font-semibold ${
                            isDark ? 'text-blue-300' : 'text-blue-600'
                          }`}>
                            {model.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium mb-2 ${
                          isDark ? 'text-blue-300' : 'text-blue-600'
                        }`}>
                          {model.name}
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center">
                            <p className={`text-xs ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Input
                            </p>
                            <p className={`text-sm font-medium ${
                              isDark ? 'text-gray-200' : 'text-gray-800'
                            }`}>
                              ${model.input.toFixed(3)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className={`text-xs ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Cached
                            </p>
                            <p className={`text-sm font-medium ${
                              isDark ? 'text-gray-200' : 'text-gray-800'
                            }`}>
                              ${model.cachedInput.toFixed(3)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className={`text-xs ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Output
                            </p>
                            <p className={`text-sm font-medium ${
                              isDark ? 'text-gray-200' : 'text-gray-800'
                            }`}>
                              ${model.output.toFixed(3)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`p-4 rounded-lg text-center ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <p className="text-sm text-gray-400">No pricing data available</p>
                </div>
              )}
            </div>
          </section>

          {/* Cost Calculation */}
          <section className="space-y-3">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Cost Calculation
            </h3>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Costs are calculated based on:
              </p>
              <ul className={`list-disc list-inside space-y-2 mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>Input tokens: The tokens used in your question and context</li>
                <li>Cached input: Previously processed context that can be reused</li>
                <li>Output tokens: The tokens in the AI's response</li>
                <li>Model-specific pricing: Each model has its own pricing structure</li>
              </ul>
            </div>
          </section>

          {/* Additional AQu Information */}
          <section className="space-y-3">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              About AQu (Adaptive Query Understanding)
            </h3>
            <div className={`p-4 rounded-lg border-l-4 border-purple-500 ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                AQu is Increff's intelligent query processing system that combines multiple AI models 
                to understand your questions, search relevant documentation, and provide accurate, 
                contextual answers with proper citations and reasoning.
              </p>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
} 