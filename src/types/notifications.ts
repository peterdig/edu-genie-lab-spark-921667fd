export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  isRead: boolean;
  link?: string;
  icon?: string;
}

export type NotificationType = "info" | "success" | "warning" | "error" | "system";

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
} 