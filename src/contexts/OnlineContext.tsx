import React, { createContext, useContext, useState, useEffect } from 'react';

interface OnlineContextProps {
  isOnline: boolean;
}

const OnlineContext = createContext<OnlineContextProps>({
  isOnline: true,
});

export const useIsOnline = () => useContext(OnlineContext).isOnline;

export const OnlineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simpler connection status check that doesn't rely on API endpoints
    const checkConnection = () => {
      // Only use navigator.onLine for now to avoid ECONNREFUSED errors
      setIsOnline(navigator.onLine);
      
      // Log connection status for debugging
      console.log(`Connection status from navigator.onLine: ${navigator.onLine}`);
    };
    
    // Check connection immediately and then every minute
    checkConnection();
    const intervalId = setInterval(checkConnection, 60000); // Every minute

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <OnlineContext.Provider value={{ isOnline }}>
      {children}
    </OnlineContext.Provider>
  );
};

export default OnlineProvider; 