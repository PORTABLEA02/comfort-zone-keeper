import { useState, useEffect, useCallback, useMemo } from 'react';

export function useRouter() {
  const [hash, setHash] = useState(() => {
    return window.location.hash.slice(1) || 'dashboard';
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
    
    const handleHashChange = () => {
      const newHash = window.location.hash.slice(1);
      setHash(newHash || 'dashboard');
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Parse le hash pour extraire le path et les query params
  const { currentPath, queryParams } = useMemo(() => {
    const [path, queryString] = hash.split('?');
    const params: Record<string, string> = {};
    
    if (queryString) {
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }
    
    return {
      currentPath: path || 'dashboard',
      queryParams: params
    };
  }, [hash]);

  const navigate = useCallback((path: string) => {
    window.location.hash = path;
    // setHash sera appelé par le listener hashchange
  }, []);

  return {
    currentPath,
    queryParams,
    navigate,
    isInitialized
  };
}
