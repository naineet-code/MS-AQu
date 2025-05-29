import React, { Component, ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Type declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service (if available)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportError = () => {
    const errorDetails = {
      error: this.state.error?.toString(),
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    // Copy error details to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        alert('Error details copied to clipboard. Please share this with the development team.');
      })
      .catch(() => {
        console.error('Failed to copy error details:', errorDetails);
      });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl mx-auto"
          >
            <Card className="shadow-2xl border-red-200 dark:border-red-800">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-4"
                  >
                    <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </motion.div>
                  
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Oops! Something went wrong
                  </h1>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    We apologize for the inconvenience. An unexpected error occurred while processing your request.
                  </p>
                </div>

                <div className="space-y-4">
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <summary className="font-medium cursor-pointer text-gray-700 dark:text-gray-300">
                        Error Details (Development Mode)
                      </summary>
                      <div className="mt-3 text-sm font-mono text-red-600 dark:text-red-400 whitespace-pre-wrap">
                        {this.state.error.toString()}
                        {this.state.error.stack && (
                          <>
                            {'\n\nStack Trace:\n'}
                            {this.state.error.stack}
                          </>
                        )}
                      </div>
                    </details>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={this.handleRefresh}
                      className="flex items-center gap-2"
                      variant="default"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh Page
                    </Button>
                    
                    <Button
                      onClick={this.handleGoHome}
                      className="flex items-center gap-2"
                      variant="outline"
                    >
                      <Home className="h-4 w-4" />
                      Go Home
                    </Button>
                    
                    <Button
                      onClick={this.handleReportError}
                      className="flex items-center gap-2"
                      variant="secondary"
                    >
                      <Bug className="h-4 w-4" />
                      Report Issue
                    </Button>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Error ID: {Date.now().toString(36)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 