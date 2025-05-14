import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification, NotificationType } from '@/types/notifications';

// Define the context value type
interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    title: string,
    message: string,
    type?: NotificationType,
    link?: string,
    icon?: string,
    showToast?: boolean
  ) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

// Create the context with a default value
export const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

// Provider props
interface NotificationsProviderProps {
  children: ReactNode;
}

// Create a provider component
export function NotificationsProvider({ children }: NotificationsProviderProps) {
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
    throw new Error(
      'useNotificationsContext must be used within a NotificationsProvider. ' +
      'Make sure the component is wrapped in NotificationsProvider.'
    );
  }
  
  return context;
} 