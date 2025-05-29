import { useState, useEffect, useCallback } from 'react';
import { refreshBackendUrl } from '@/config';

interface BackendHealthState {
  isHealthy: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  error: string | null;
}

const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const INITIAL_RETRY_INTERVAL = 5000; // 5 seconds for initial checks

export const useBackendHealth = (backendUrl: string | null) => {
  const [healthState, setHealthState] = useState<BackendHealthState>({
    isHealthy: false,
    isChecking: true,
    lastChecked: null,
    error: null
  });

  const checkBackendHealth = useCallback(async (shouldRefreshUrl = false): Promise<boolean> => {
    if (!backendUrl) {
      setHealthState(prev => ({
        ...prev,
        isHealthy: false,
        isChecking: false,
        error: 'Backend URL not configured'
      }));
      return false;
    }

    // If requested, refresh the backend URL to trigger fallback logic
    let currentUrl = backendUrl;
    if (shouldRefreshUrl) {
      try {
        console.log('🔄 Refreshing backend URL due to health check failure...');
        currentUrl = await refreshBackendUrl();
        console.log('🔄 New backend URL after refresh:', currentUrl);
      } catch (error) {
        console.error('❌ Failed to refresh backend URL:', error);
      }
    }

    try {
      setHealthState(prev => ({ ...prev, isChecking: true, error: null }));
      
      // Try to hit the health endpoint first, fall back to api/ai-status
      const healthEndpoints = ['/health', '/api/ai-status', '/api/pdfs'];
      let lastError: Error | null = null;
      
      for (const endpoint of healthEndpoints) {
        try {
          const response = await fetch(`${currentUrl}${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            // Add timeout
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          
          if (response.ok) {
            console.log(`✅ Health check successful for ${currentUrl}${endpoint}`);
            setHealthState({
              isHealthy: true,
              isChecking: false,
              lastChecked: new Date(),
              error: null
            });
            return true;
          }
        } catch (err) {
          lastError = err as Error;
          console.warn(`❌ Health check failed for ${currentUrl}${endpoint}:`, err);
          continue; // Try next endpoint
        }
      }
      
      // If we get here, all endpoints failed
      throw lastError || new Error('All health check endpoints failed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ All health checks failed:', errorMessage);
      setHealthState({
        isHealthy: false,
        isChecking: false,
        lastChecked: new Date(),
        error: errorMessage
      });
      return false;
    }
  }, [backendUrl]);

  // Initial health check
  useEffect(() => {
    if (backendUrl) {
      checkBackendHealth();
    }
  }, [backendUrl, checkBackendHealth]);

  // Periodic health checks
  useEffect(() => {
    if (!backendUrl) return;

    const interval = setInterval(() => {
      checkBackendHealth();
    }, healthState.isHealthy ? HEALTH_CHECK_INTERVAL : INITIAL_RETRY_INTERVAL);

    return () => clearInterval(interval);
  }, [backendUrl, checkBackendHealth, healthState.isHealthy]);

  const retryHealthCheck = useCallback(() => {
    checkBackendHealth();
  }, [checkBackendHealth]);

  const retryWithUrlRefresh = useCallback(() => {
    checkBackendHealth(true);
  }, [checkBackendHealth]);

  return {
    ...healthState,
    retryHealthCheck,
    retryWithUrlRefresh
  };
}; 