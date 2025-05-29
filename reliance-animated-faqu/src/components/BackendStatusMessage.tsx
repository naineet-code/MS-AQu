import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MovingBorderCard } from "@/components/ui/moving-border-card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Clock } from "lucide-react";

interface BackendStatusMessageProps {
  isHealthy: boolean;
  isChecking: boolean;
  error: string | null;
  lastChecked: Date | null;
  onRetry: () => void;
}

const BackendStatusMessage: React.FC<BackendStatusMessageProps> = ({
  isHealthy,
  isChecking,
  error,
  lastChecked,
  onRetry
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const getStatusInfo = () => {
    if (isChecking) {
      return {
        icon: <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />,
        title: "Checking Backend Connection",
        message: "Please wait while we verify the connection to our AI service...",
        actionText: null,
        bgColor: isDark ? 'bg-blue-900/20' : 'bg-blue-50/80',
        borderColor: 'border-blue-500/30'
      };
    }

    if (!isHealthy) {
      return {
        icon: <WifiOff className="h-8 w-8 text-red-500" />,
        title: "Backend Service Unavailable",
        message: error || "Unable to connect to the AI service. Please check if the backend server is running and try again.",
        actionText: "Retry Connection",
        bgColor: isDark ? 'bg-red-900/20' : 'bg-red-50/80',
        borderColor: 'border-red-500/30'
      };
    }

    return {
      icon: <Wifi className="h-8 w-8 text-green-500" />,
      title: "Backend Service Connected",
      message: "Connection to AI service is healthy and ready to answer your questions.",
      actionText: null,
      bgColor: isDark ? 'bg-green-900/20' : 'bg-green-50/80',
      borderColor: 'border-green-500/30'
    };
  };

  const status = getStatusInfo();

  const formatLastChecked = () => {
    if (!lastChecked) return null;
    
    const now = new Date();
    const diffMs = now.getTime() - lastChecked.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    }
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  };

  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <MovingBorderCard
        borderRadius="1.5rem"
        duration={5000}
        className={`transition-all duration-500 ${
          isDark 
            ? 'bg-zinc-900/30 border-white/10' 
            : 'bg-white/20 border-white/20'
        } shadow-2xl`}
      >
        <Card className="bg-transparent border-0 shadow-none rounded-3xl">
          <CardContent className="p-8 rounded-3xl">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Status Icon */}
              <div className={`
                flex items-center justify-center w-20 h-20 rounded-full 
                ${status.bgColor} ${status.borderColor} border-2
                backdrop-blur-sm
              `}>
                {status.icon}
              </div>

              {/* Status Title */}
              <h3 className={`
                text-2xl font-bold tracking-tight
                ${isDark ? 'text-white' : 'text-gray-900'}
              `}>
                {status.title}
              </h3>

              {/* Status Message */}
              <p className={`
                text-lg leading-relaxed max-w-md
                ${isDark ? 'text-gray-300' : 'text-gray-700'}
              `}>
                {status.message}
              </p>

              {/* Last Checked Time */}
              {lastChecked && (
                <div className={`
                  flex items-center gap-2 px-3 py-1 rounded-full text-sm
                  ${isDark ? 'bg-white/10 text-gray-400' : 'bg-black/10 text-gray-600'}
                `}>
                  <Clock className="h-4 w-4" />
                  <span>Last checked: {formatLastChecked()}</span>
                </div>
              )}

              {/* Action Button */}
              {status.actionText && (
                <Button
                  onClick={onRetry}
                  disabled={isChecking}
                  className={`
                    px-6 py-3 text-base font-medium rounded-full
                    transition-all duration-300 transform hover:scale-105
                    ${isDark 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    shadow-lg hover:shadow-xl
                  `}
                >
                  {isChecking ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2" />
                      {status.actionText}
                    </>
                  )}
                </Button>
              )}

              {/* Backend Info */}
              <div className={`
                text-xs px-4 py-2 rounded-lg
                ${isDark ? 'bg-white/5 text-gray-500' : 'bg-black/5 text-gray-600'}
              `}>
                <p>Backend service provides AI-powered question answering</p>
                <p>Ensure the backend server is running on the correct port</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </MovingBorderCard>
    </motion.div>
  );
};

export default BackendStatusMessage; 