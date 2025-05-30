import { useState } from 'react';
import { refreshBackendUrl } from '@/config';

interface UseBackendApiReturn {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  responseData: any;
  setResponseData: (data: any) => void;
  error: string | null;
  setError: (error: string | null) => void;
  handleSubmitQuestion: (question: string, backendUrl: string | null, forceNoCache?: boolean) => Promise<any>;
  handleForceNoCache: (backendUrl: string | null) => Promise<void>;
}

export const useBackendApi = (): UseBackendApiReturn => {
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');

  const makeApiRequest = async (question: string, backendUrl: string, forceNoCache: boolean = false) => {
    const requestBody = {
      query: question,
      category: 'reliance',
      force_no_cache: forceNoCache
    };
    console.log('📤 Sending request to:', backendUrl, requestBody);

    const response = await fetch(`${backendUrl}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 Response status:', response.status);
    
    const data = await response.json();
    console.log('📋 Response data:', data);

    if (!response.ok) {
      throw new Error(data.detail || `Server error: ${response.status} ${response.statusText}`);
    }

    return data;
  };

  const handleSubmitQuestion = async (question: string, backendUrl: string | null, forceNoCache: boolean = false) => {
    console.log('🚀 handleSubmitQuestion called with:', { question, backendUrl, forceNoCache });
    
    if (!backendUrl) {
      console.error('❌ Backend URL not loaded');
      setError('Backend URL not loaded');
      return null;
    }

    setLoading(true);
    setError(null);
    setCurrentQuestion(question);
    
    try {
      // First attempt with current backend URL
      const data = await makeApiRequest(question, backendUrl, forceNoCache);
      console.log('✅ Raw backend response:', JSON.stringify(data, null, 2));
      console.log('✅ Backend response keys:', Object.keys(data));
      console.log('✅ Has answer?', !!data.answer);
      console.log('✅ Has reasoning?', !!data.reasoning);
      console.log('✅ Has model?', !!data.model);
      console.log('✅ Has models?', !!data.models);
      console.log('✅ Has citations?', !!data.citations);
      console.log('✅ Has costs?', !!data.costs);
      console.log('✅ Cache hit?', data.cache_hit);
      console.log('✅ Force no cache?', data.forced_no_cache);
      console.log('✅ Setting response data:', data);
      setResponseData(data);
      return data; // Return the data so it can be used immediately
    } catch (firstError: any) {
      console.warn('❌ First attempt failed:', firstError);
      
      try {
        // Second attempt: refresh backend URL and try again
        console.log('🔄 Refreshing backend URL and retrying...');
        const newBackendUrl = await refreshBackendUrl();
        
        if (newBackendUrl !== backendUrl) {
          console.log('🔄 Trying with new backend URL:', newBackendUrl);
          const data = await makeApiRequest(question, newBackendUrl, forceNoCache);
          console.log('✅ Raw backend response (retry):', JSON.stringify(data, null, 2));
          console.log('✅ Setting response data from retry:', data);
          setResponseData(data);
          return data; // Return the data so it can be used immediately
        } else {
          throw firstError; // Same URL, don't retry
        }
      } catch (secondError) {
        console.error('❌ Both attempts failed:', { firstError, secondError });
        const errorMessage = secondError instanceof Error ? secondError.message : 'An unexpected error occurred';
        setError(`Failed to connect to backend. Please check your connection and try again.`);
        return null;
      }
    } finally {
      setLoading(false);
      console.log('🏁 handleSubmitQuestion finished');
    }
  };

  const handleForceNoCache = async (backendUrl: string | null) => {
    if (currentQuestion && backendUrl) {
      console.log('🔄 Force no cache for question:', currentQuestion);
      await handleSubmitQuestion(currentQuestion, backendUrl, true);
    }
  };

  return {
    loading,
    setLoading,
    responseData,
    setResponseData,
    error,
    setError,
    handleSubmitQuestion,
    handleForceNoCache
  };
}; 