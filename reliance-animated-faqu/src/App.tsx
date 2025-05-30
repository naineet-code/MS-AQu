import React, { lazy, Suspense } from "react"; // Explicitly import React
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy load demo components for better performance
const AnimatedTooltipDemo = lazy(() => import("@/components/animated-tooltip-demo"));
const StickyBannerDemo = lazy(() => import("@/components/sticky-banner-demo"));
const SmoothCursorDemo = lazy(() => import("@/components/smooth-cursor-demo"));
const EnhancementDemo = lazy(() => import("@/components/EnhancementDemo"));
const BackgroundGradientAnimationDemo = lazy(() => import("@/components/background-gradient-animation-demo"));

// Loading component for lazy loaded routes
const LazyLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Create the query client outside of the component
const queryClient = new QueryClient();

const App = () => {
  return (
    <ErrorBoundary>
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route 
                  path="/tooltip-demo" 
                  element={
                    <Suspense fallback={<LazyLoadingSpinner />}>
                      <AnimatedTooltipDemo />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/cursor-demo" 
                  element={
                    <Suspense fallback={<LazyLoadingSpinner />}>
                      <SmoothCursorDemo />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/sticky-banner-demo" 
                  element={
                    <Suspense fallback={<LazyLoadingSpinner />}>
                      <StickyBannerDemo />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/enhancement-demo" 
                  element={
                    <Suspense fallback={<LazyLoadingSpinner />}>
                      <EnhancementDemo />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/background-gradient-animation-demo" 
                  element={
                    <Suspense fallback={<LazyLoadingSpinner />}>
                      <BackgroundGradientAnimationDemo />
                    </Suspense>
                  } 
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </React.StrictMode>
    </ErrorBoundary>
  );
};

export default App;
