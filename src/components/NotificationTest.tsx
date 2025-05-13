import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNotificationsContext } from '@/lib/NotificationContext';
import { NotificationType } from '@/types/notifications';
import { toast } from 'sonner';

export function NotificationTest() {
  const { addNotification, unreadCount } = useNotificationsContext();
  const [title, setTitle] = useState('Test Notification');
  const [message, setMessage] = useState('This is a test notification message');
  const [type, setType] = useState<NotificationType>('info');
  const [link, setLink] = useState('/dashboard');
  const [icon, setIcon] = useState('none');

  const handleAddNotification = () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const iconValue = icon === 'none' ? undefined : icon;
    addNotification(title, message, type, link || undefined, iconValue);
    toast.success('Notification added successfully');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Add Test Notification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Notification message"
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(value) => setType(value as NotificationType)}>
            <SelectTrigger id="type">
              <SelectValue placeholder="Select notification type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="link">Link (optional)</Label>
          <Input
            id="link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/dashboard"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="icon">Icon (optional)</Label>
          <Select value={icon} onValueChange={setIcon}>
            <SelectTrigger id="icon">
              <SelectValue placeholder="Select icon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="BookOpen">Book</SelectItem>
              <SelectItem value="FileText">Document</SelectItem>
              <SelectItem value="CheckCircle">Check</SelectItem>
              <SelectItem value="AlertTriangle">Warning</SelectItem>
              <SelectItem value="Settings">Settings</SelectItem>
              <SelectItem value="HelpCircle">Help</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button onClick={handleAddNotification} className="w-full">
          Add Notification
        </Button>
      </CardFooter>
    </Card>
  );
} 