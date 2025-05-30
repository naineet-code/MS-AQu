import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MultiStepLoader } from '@/components/ui/multi-step-loader';
import { getRandomInitSteps, getAllInitSteps } from '@/data/initializationSteps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/hooks/useTheme';
import { RichTextRenderer } from './ResponseSection';

const EnhancementDemo = () => {
  const [showLoader, setShowLoader] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState(getRandomInitSteps());
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Sample text with page references for testing hyperlinks
  const sampleTextWithPages = `
# Enhanced FAQ System Improvements

## Loader Enhancements
Our intelligent FAQ system now features:
- Enhanced randomization of loading messages from a pool of ${getAllInitSteps().length} funny messages
- Beautiful animated loader with progress indicators and particle effects
- Better visual feedback during system initialization

## Hyperlink Functionality
Page references are now automatically hyperlinked! Examples:
- Single page reference: "Please see page 15 for more details"
- Page range reference: "Information can be found on pages 18-22"
- Multiple pages: "Check pages 5, 8, and 12-15 for comprehensive coverage"
- Parenthetical references: "(page 7)" or "(pages 10-12)"
- Square bracket format: "[Page 25]"

## Technical Improvements
- Fixed hyperlink processing in both typed and static content
- Enhanced randomization algorithm using Fisher-Yates shuffle
- Improved visual styling with better animations and effects
- Better error handling and fallback mechanisms

All page references should now be clickable and link to the appropriate PDF pages when a backend URL is available.
  `;

  const handleStartLoader = () => {
    // Generate new random loading steps each time
    setLoadingSteps(getRandomInitSteps(6)); // Show 6 steps for demo
    setShowLoader(true);
    
    // Auto-hide after 10 seconds for demo
    setTimeout(() => {
      setShowLoader(false);
    }, 10000);
  };

  const backendUrl = 'http://57.154.209.147:8000'; // Demo backend URL

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <CardHeader>
          <CardTitle className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            🚀 AQu FAQ System Enhancements Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Loader Demo Section */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Enhanced Multi-Step Loader
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              The loader now features improved randomization from {getAllInitSteps().length} messages, 
              better animations, progress indicators, and animated background effects.
            </p>
            <Button 
              onClick={handleStartLoader}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={showLoader}
            >
              {showLoader ? 'Loading...' : 'Demo Enhanced Loader'}
            </Button>
          </div>

          {/* Hyperlink Demo Section */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Fixed Hyperlink Functionality
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Page references in answers are now properly hyperlinked. The content below demonstrates 
              various page reference formats that should be clickable:
            </p>
            
            <Card className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'} p-4`}>
              <RichTextRenderer 
                content={sampleTextWithPages} 
                backendUrl={backendUrl}
              />
            </Card>
          </div>

          {/* Summary */}
          <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-700/50' : 'bg-blue-50 border border-blue-200'}`}>
            <h4 className={`font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              ✅ Issues Resolved
            </h4>
            <ul className={`text-sm space-y-1 ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>
              <li>• Page references in answers are now properly hyperlinked</li>
              <li>• Loader shows enhanced randomization from union of all messages</li>
              <li>• Improved visual styling and animations throughout</li>
              <li>• Better user experience with progress indicators</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Step Loader Overlay */}
      <MultiStepLoader
        loading={showLoader}
        loadingStates={loadingSteps}
        duration={1200}
        loop={false}
      />
    </div>
  );
};

export default EnhancementDemo; 