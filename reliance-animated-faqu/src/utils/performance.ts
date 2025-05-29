import React from 'react';

// Performance monitoring utilities
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url?: string;
  userAgent?: string;
}

interface VitalMetrics {
  CLS?: number;  // Cumulative Layout Shift
  FCP?: number;  // First Contentful Paint
  LCP?: number;  // Largest Contentful Paint
  FID?: number;  // First Input Delay
  TTFB?: number; // Time to First Byte
}

// Extend PerformanceEntry for better type safety
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private vitals: VitalMetrics = {};

  constructor() {
    this.initializeVitalsTracking();
    this.trackNavigationTiming();
  }

  private initializeVitalsTracking() {
    // Track Web Vitals if supported
    if ('web-vital' in window) {
      return;
    }

    // Fallback tracking for core metrics
    this.trackLCP();
    this.trackFCP();
    this.trackCLS();
    this.trackFID();
  }

  private trackNavigationTiming() {
    if (!('performance' in window) || !performance.getEntriesByType) {
      return;
    }

    // Wait for page load to complete
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          this.addMetric('TTFB', navigation.responseStart - navigation.requestStart);
          this.addMetric('DOM_LOAD', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
          this.addMetric('WINDOW_LOAD', navigation.loadEventEnd - navigation.loadEventStart);
          this.addMetric('DNS_LOOKUP', navigation.domainLookupEnd - navigation.domainLookupStart);
        }
      }, 0);
    });
  }

  private trackLCP() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.vitals.LCP = lastEntry.startTime;
        this.addMetric('LCP', lastEntry.startTime);
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP tracking not supported:', e);
    }
  }

  private trackFCP() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.vitals.FCP = fcpEntry.startTime;
          this.addMetric('FCP', fcpEntry.startTime);
        }
      });
      
      observer.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('FCP tracking not supported:', e);
    }
  }

  private trackCLS() {
    if (!('PerformanceObserver' in window)) return;

    try {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.vitals.CLS = clsValue;
        this.addMetric('CLS', clsValue);
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS tracking not supported:', e);
    }
  }

  private trackFID() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstInput = entries[0] as PerformanceEventTiming;
        if (firstInput && 'processingStart' in firstInput) {
          const fid = firstInput.processingStart - firstInput.startTime;
          this.vitals.FID = fid;
          this.addMetric('FID', fid);
        }
      });
      
      observer.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID tracking not supported:', e);
    }
  }

  private addMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    this.metrics.push(metric);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance: ${name} = ${value.toFixed(2)}ms`);
    }
  }

  // Public API
  public trackCustomMetric(name: string, value: number) {
    this.addMetric(name, value);
  }

  public startTimer(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      this.addMetric(name, endTime - startTime);
    };
  }

  public trackUserInteraction(action: string, target?: string) {
    this.addMetric(`USER_${action.toUpperCase()}`, performance.now());
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`👆 User Interaction: ${action}${target ? ` on ${target}` : ''}`);
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getVitals(): VitalMetrics {
    return { ...this.vitals };
  }

  public getSummary() {
    const summary = {
      total_metrics: this.metrics.length,
      vitals: this.vitals,
      latest_metrics: this.metrics.slice(-10),
      performance_score: this.calculatePerformanceScore()
    };
    
    return summary;
  }

  private calculatePerformanceScore(): number {
    let score = 100;
    
    // Penalize slow metrics
    if (this.vitals.LCP && this.vitals.LCP > 2500) score -= 20;
    if (this.vitals.FCP && this.vitals.FCP > 1800) score -= 15;
    if (this.vitals.CLS && this.vitals.CLS > 0.1) score -= 15;
    if (this.vitals.FID && this.vitals.FID > 100) score -= 10;
    
    return Math.max(0, score);
  }

  public reportToConsole() {
    console.group('📊 Performance Summary');
    console.table(this.getVitals());
    console.log('Performance Score:', this.calculatePerformanceScore());
    console.groupEnd();
  }
}

// Create global instance
export const performanceMonitor = new PerformanceMonitor();

// Export utilities
export const trackCustomMetric = (name: string, value: number) => 
  performanceMonitor.trackCustomMetric(name, value);

export const startTimer = (name: string) => 
  performanceMonitor.startTimer(name);

export const trackUserInteraction = (action: string, target?: string) => 
  performanceMonitor.trackUserInteraction(action, target);

export const getPerformanceSummary = () => 
  performanceMonitor.getSummary();

// Automated tracking for React components
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo((props: P) => {
    const renderTimer = React.useRef<(() => void) | null>(null);
    
    React.useLayoutEffect(() => {
      renderTimer.current = startTimer(`RENDER_${componentName}`);
    });
    
    React.useEffect(() => {
      if (renderTimer.current) {
        renderTimer.current();
        renderTimer.current = null;
      }
    });
    
    return React.createElement(Component, props);
  });
};

// Hook for component-level performance tracking
export const usePerformanceTracking = (componentName: string) => {
  const renderStartTime = React.useRef<number>(performance.now());
  
  React.useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    trackCustomMetric(`COMPONENT_RENDER_${componentName}`, renderTime);
  });
  
  const trackInteraction = React.useCallback((action: string) => {
    trackUserInteraction(action, componentName);
  }, [componentName]);
  
  return { trackInteraction };
}; 