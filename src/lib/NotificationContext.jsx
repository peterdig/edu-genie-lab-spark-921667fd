import React, { createContext, useContext } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

// Create the context with a default value
export const NotificationsContext = createContext(undefined);

// Create a provider component
export function NotificationsProvider({ children }) {
  const notificationsData = useNotifications();

  return (
    <NotificationsContext.Provider value={notificationsData}>
      {children}
    </NotificationsContext.Provider>
  );
}

// Custom hook to use the notifications context
export function useNotificationsContext() {
  const context = useContext(NotificationsContext);
  
  if (context === undefined) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  }
  
  return context;
} 