import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react";

interface BackendConnectionErrorProps {
  onRetry: () => void;
  isRetrying: boolean;
  publicIpWorking: boolean;
  localhostWorking: boolean;
  lastChecked: Date | null;
}

const BackendConnectionError: React.FC<BackendConnectionErrorProps> = ({
  onRetry,
  isRetrying,
  publicIpWorking,
  localhostWorking,
  lastChecked
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className={`rounded-2xl backdrop-blur-xl border shadow-2xl p-8 ${
        isDark 
          ? 'bg-gradient-to-br from-red-900/30 to-orange-900/30 border-red-500/20' 
          : 'bg-gradient-to-br from-red-50/80 to-orange-50/80 border-red-500/20'
      }`}>
        {/* Error Icon and Title */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{
              background: isDark 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 101, 101, 0.1))'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(245, 101, 101, 0.05))'
            }}
          >
            <AlertTriangle className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          </motion.div>
          
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
            Backend Connection Failed
          </h2>
          
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Unable to connect to any backend server
          </p>
        </div>

        {/* Connection Status Details */}
        <div className="space-y-4 mb-6">
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'
          }`}>
            <h3 className={`font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Connection Status
            </h3>
            
            <div className="space-y-2">
              {/* Public IP Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {publicIpWorking ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Public Backend (57.154.209.147:8000)
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  publicIpWorking 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {publicIpWorking ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Localhost Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {localhostWorking ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Local Backend (localhost:8000)
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  localhostWorking 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {localhostWorking ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {lastChecked && (
              <p className={`text-xs mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Last checked: {formatTime(lastChecked)}
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        <div className={`p-4 rounded-xl mb-6 ${
          isDark 
            ? 'bg-yellow-900/20 border border-yellow-500/20' 
            : 'bg-yellow-50/80 border border-yellow-300/30'
        }`}>
          <h4 className={`font-medium mb-2 ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
            What does this mean?
          </h4>
          <ul className={`text-sm space-y-1 ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`}>
            <li>• The AI backend services are currently unavailable</li>
            <li>• Both public and local servers failed to respond</li>
            <li>• You can try refreshing the connection or contact support</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            className={`min-w-[140px] rounded-full font-medium transition-all duration-300 ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500/30'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-400/30'
            }`}
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Connection
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className={`min-w-[140px] rounded-full font-medium transition-all duration-300 ${
              isDark
                ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Refresh Page
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            If the problem persists, please check your internet connection or contact the system administrator.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default BackendConnectionError; 