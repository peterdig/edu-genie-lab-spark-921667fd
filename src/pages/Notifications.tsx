import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useNotificationsContext } from "@/lib/NotificationContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { 
  Bell, 
  CheckCircle, 
  Trash2, 
  RefreshCw, 
  ChevronRight, 
  AlertTriangle, 
  Info, 
  X, 
  CheckCheck,
  BookOpen,
  FileText,
  HelpCircle,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Notification, NotificationType } from "@/types/notifications";

export default function Notifications() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    clearAllNotifications
  } = useNotificationsContext();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  // Filter notifications based on the selected tab
  const filteredNotifications = useMemo(() => {
    switch(filter) {
      case "unread":
        return notifications.filter(notification => !notification.isRead);
      case "read":
        return notifications.filter(notification => notification.isRead);
      default:
        return notifications;
    }
  }, [notifications, filter]);

  // Get icon component based on notification type or specified icon
  const getNotificationIcon = (notification: Notification) => {
    // First check if notification has a specified icon
    if (notification.icon) {
      switch (notification.icon) {
        case 'BookOpen': return <BookOpen className="h-5 w-5" />;
        case 'FileText': return <FileText className="h-5 w-5" />;
        case 'CheckCircle': return <CheckCircle className="h-5 w-5" />;
        case 'AlertTriangle': return <AlertTriangle className="h-5 w-5" />;
        case 'Settings': return <Settings className="h-5 w-5" />;
        case 'HelpCircle': return <HelpCircle className="h-5 w-5" />;
      }
    }
    
    // Otherwise, use the notification type to determine icon
    switch (notification.type) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <X className="h-5 w-5 text-red-500" />;
      case "system":
        return <Bell className="h-5 w-5 text-purple-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Handler for clicking on a notification
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigate to linked page if available
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
              <p className="text-muted-foreground">
                {unreadCount === 0 
                  ? "You're all caught up!" 
                  : `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                }
              </p>
            </div>
            <div className="flex items-center gap-2 pt-4 md:pt-0">
              <Button 
                variant="outline" 
                size="sm"
                disabled={unreadCount === 0}
                onClick={markAllAsRead}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={notifications.length === 0}
                onClick={clearAllNotifications}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear all
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as "all" | "unread" | "read")}>
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="all" className="flex items-center gap-2">
                  All
                  <Badge variant="secondary">{notifications.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex items-center gap-2">
                  Unread
                  <Badge variant="secondary">{unreadCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="read">Read</TabsTrigger>
              </TabsList>
              <Button variant="ghost" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Refresh</span>
              </Button>
            </div>

            <TabsContent value="all">
              <NotificationsList 
                notifications={filteredNotifications}
                getNotificationIcon={getNotificationIcon}
                onNotificationClick={handleNotificationClick}
                onRemove={removeNotification}
              />
            </TabsContent>

            <TabsContent value="unread">
              <NotificationsList 
                notifications={filteredNotifications}
                getNotificationIcon={getNotificationIcon}
                onNotificationClick={handleNotificationClick}
                onRemove={removeNotification}
              />
            </TabsContent>

            <TabsContent value="read">
              <NotificationsList 
                notifications={filteredNotifications}
                getNotificationIcon={getNotificationIcon}
                onNotificationClick={handleNotificationClick}
                onRemove={removeNotification}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

interface NotificationsListProps {
  notifications: Notification[];
  getNotificationIcon: (notification: Notification) => JSX.Element;
  onNotificationClick: (notification: Notification) => void;
  onRemove: (id: string) => void;
}

function NotificationsList({ 
  notifications, 
  getNotificationIcon, 
  onNotificationClick, 
  onRemove 
}: NotificationsListProps) {
  if (notifications.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="flex flex-col items-center justify-center py-6">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No notifications to display</p>
          <p className="text-muted-foreground">You're all caught up!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <ScrollArea className="h-[600px]">
        <ul className="divide-y">
          {notifications.map(notification => (
            <li 
              key={notification.id} 
              className={cn(
                "p-4 hover:bg-muted/50 transition-colors cursor-pointer relative",
                !notification.isRead && "bg-primary/5"
              )}
            >
              <div 
                className="flex gap-4" 
                onClick={() => onNotificationClick(notification)}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium truncate pr-8">
                      {notification.title}
                      {!notification.isRead && (
                        <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary"></span>
                      )}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  {notification.link && (
                    <div className="flex items-center mt-2 text-xs text-primary">
                      <span>View details</span>
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 absolute top-3 right-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(notification.id);
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove notification</span>
              </Button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </Card>
  );
} 