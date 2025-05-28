import { useState } from 'react';

interface UseBackendApiReturn {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  responseData: any;
  setResponseData: (data: any) => void;
  error: string | null;
  setError: (error: string | null) => void;
  handleSubmitQuestion: (question: string, backendUrl: string | null) => Promise<void>;
}

export const useBackendApi = (): UseBackendApiReturn => {
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitQuestion = async (question: string, backendUrl: string | null) => {
    if (!backendUrl) {
      setError('Backend URL not loaded');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: question,
          category: 'reliance'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || `Server error: ${response.status} ${response.statusText}`);
      }

      setResponseData(data);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    setLoading,
    responseData,
    setResponseData,
    error,
    setError,
    handleSubmitQuestion
  };
}; 