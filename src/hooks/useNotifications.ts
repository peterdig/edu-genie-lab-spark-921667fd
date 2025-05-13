import { useState, useEffect, useCallback } from 'react';
import { Notification, NotificationType } from '@/types/notifications';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// Mock notifications for demonstration purposes
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New lesson template available',
    message: 'Check out our new Math Inquiry template for your next lesson',
    type: 'info',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    link: '/lessons',
    icon: 'BookOpen'
  },
  {
    id: '2',
    title: 'Assessment completed',
    message: 'Your "Algebra Functions" assessment has been generated successfully',
    type: 'success',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    link: '/my-library',
    icon: 'CheckCircle'
  },
  {
    id: '3',
    title: 'System maintenance',
    message: 'EduGenie will be undergoing scheduled maintenance on Sunday at 2 AM EST',
    type: 'warning',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    link: '/help',
    icon: 'AlertTriangle'
  }
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from localStorage on initial render
  useEffect(() => {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications);
        setNotifications(parsedNotifications);
        setUnreadCount(
          parsedNotifications.filter((n: Notification) => !n.isRead).length
        );
      } catch (error) {
        console.error('Failed to parse stored notifications:', error);
        setNotifications(mockNotifications);
        setUnreadCount(
          mockNotifications.filter((n: Notification) => !n.isRead).length
        );
      }
    } else {
      // Use mock data for first-time users
      setNotifications(mockNotifications);
      setUnreadCount(
        mockNotifications.filter((n: Notification) => !n.isRead).length
      );
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Add a new notification
  const addNotification = useCallback((
    title: string,
    message: string,
    type: NotificationType = 'info',
    link?: string,
    icon?: string,
    showToast: boolean = true
  ) => {
    const newNotification: Notification = {
      id: uuidv4(),
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
      isRead: false,
      link,
      icon
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Optionally show a toast notification
    if (showToast) {
      toast({
        title: title,
        description: message
      });
    }

    return newNotification.id;
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setUnreadCount(0);
  }, []);

  // Remove a notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      const isUnread = notification && !notification.isRead;
      
      if (isUnread) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      
      return prev.filter(notification => notification.id !== id);
    });
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('notifications');
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications
  };
} 