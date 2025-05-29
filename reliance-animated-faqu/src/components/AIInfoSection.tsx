import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface PricingData {
  [key: string]: {
    name: string;
    input: number;
    cachedInput: number;
    output: number;
  };
}

export function AIInfoSection() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [pricing, setPricing] = React.useState<PricingData>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch("/api/pricing");
        if (!response.ok) {
          throw new Error('Failed to fetch pricing data');
        }
        const data = await response.json();
        setPricing(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pricing data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricing();
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className={`max-w-3xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <DialogHeader>
          <DialogTitle className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            AI System Information
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className={`p-3 text-left ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Model</th>
                    <th className={`p-3 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Input</th>
                    <th className={`p-3 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Cached</th>
                    <th className={`p-3 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Output</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-sm text-gray-400">
                        Loading pricing data...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-sm text-red-400">
                        {error}
                      </td>
                    </tr>
                  ) : Object.values(pricing).length > 0 ? (
                    Object.values(pricing).map((model) => (
                      <tr key={model.name} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className={`p-3 font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                          {model.name}
                        </td>
                        <td className={`p-3 text-right ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          ${model.input.toFixed(3)}
                        </td>
                        <td className={`p-3 text-right ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          ${model.cachedInput.toFixed(3)}
                        </td>
                        <td className={`p-3 text-right ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          ${model.output.toFixed(3)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-sm text-gray-400">
                        No pricing data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
        </div>
      </DialogContent>
    </Dialog>
  );
} 