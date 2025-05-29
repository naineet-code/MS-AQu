const PUBLIC_IP_BACKEND = 'http://57.154.209.147:8000';
const LOCALHOST_BACKEND = 'http://localhost:8000';

// Store the current backend URL and connection status
let currentBackendUrl: string | null = null;
let connectionStatus: {
  publicIpWorking: boolean;
  localhostWorking: boolean;
  lastChecked: Date | null;
  bothFailed: boolean;
} = {
  publicIpWorking: false,
  localhostWorking: false,
  lastChecked: null,
  bothFailed: false
};

/**
 * Get environment variable with proper type safety
 */
const getEnvVar = (key: string): string | undefined => {
  if (typeof window !== 'undefined' && (window as any).__ENV) {
    return (window as any).__ENV[key];
  }
  // Type-safe access to import.meta.env
  return (import.meta as any).env?.[key];
};

/**
 * Test if a backend URL is accessible by trying a health check
 */
const testBackendConnection = async (url: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn(`Backend connection test failed for ${url}:`, error);
    return false;
  }
};

/**
 * Determine the best backend URL to use
 * First tries public IP, then falls back to localhost
 */
export const determineBackendUrl = async (): Promise<string> => {
  // Check if user provided environment variable override
  const envBackendUrl = getEnvVar('VITE_BACKEND_URL');
  if (envBackendUrl && envBackendUrl !== PUBLIC_IP_BACKEND && envBackendUrl !== LOCALHOST_BACKEND) {
    console.log('Using environment variable backend URL:', envBackendUrl);
    return envBackendUrl;
  }
  
  // Test public IP first
  console.log('Testing public IP backend:', PUBLIC_IP_BACKEND);
  const publicIpWorks = await testBackendConnection(PUBLIC_IP_BACKEND);
  connectionStatus.publicIpWorking = publicIpWorks;
  
  if (publicIpWorks) {
    console.log('✅ Public IP backend is accessible, using:', PUBLIC_IP_BACKEND);
    connectionStatus.bothFailed = false;
    connectionStatus.lastChecked = new Date();
    return PUBLIC_IP_BACKEND;
  }
  
  // Fall back to localhost
  console.log('❌ Public IP backend not accessible, testing localhost:', LOCALHOST_BACKEND);
  const localhostWorks = await testBackendConnection(LOCALHOST_BACKEND);
  connectionStatus.localhostWorking = localhostWorks;
  
  if (localhostWorks) {
    console.log('✅ Localhost backend is accessible, using:', LOCALHOST_BACKEND);
    connectionStatus.bothFailed = false;
    connectionStatus.lastChecked = new Date();
    return LOCALHOST_BACKEND;
  }
  
  // If neither works, mark both as failed and default to public IP
  connectionStatus.bothFailed = true;
  connectionStatus.lastChecked = new Date();
  console.error('❌ Both backends are inaccessible! Public IP and localhost failed.');
  console.warn('⚠️ Defaulting to public IP for external access attempts:', PUBLIC_IP_BACKEND);
  return PUBLIC_IP_BACKEND;
};

/**
 * Get current connection status
 */
export const getConnectionStatus = () => ({ ...connectionStatus });

/**
 * Load backend URL with caching and retry logic
 */
export const loadBackendUrl = async (): Promise<string> => {
  // Return cached URL if available and both didn't fail
  if (currentBackendUrl && !connectionStatus.bothFailed) {
    return currentBackendUrl;
  }
  
  // Determine and cache the backend URL
  currentBackendUrl = await determineBackendUrl();
  return currentBackendUrl;
};

/**
 * Force refresh of backend URL (useful for retry scenarios)
 */
export const refreshBackendUrl = async (): Promise<string> => {
  currentBackendUrl = null;
  // Reset connection status for fresh testing
  connectionStatus = {
    publicIpWorking: false,
    localhostWorking: false,
    lastChecked: null,
    bothFailed: false
  };
  return await loadBackendUrl();
};

// Legacy export for backward compatibility
export const BACKEND_URL = getEnvVar('VITE_BACKEND_URL') || PUBLIC_IP_BACKEND; 