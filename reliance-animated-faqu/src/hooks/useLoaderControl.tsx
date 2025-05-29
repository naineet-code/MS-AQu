import { useState, useCallback } from 'react';

export const useLoaderControl = () => {
  const [shouldShowLoader, setShouldShowLoader] = useState(true);

  const temporarilyDisableLoader = useCallback(() => {
    setShouldShowLoader(false);
    // Set it back to true after a short delay
    setTimeout(() => {
      setShouldShowLoader(true);
    }, 100);
  }, []);

  return {
    shouldShowLoader,
    temporarilyDisableLoader
  };
}; 