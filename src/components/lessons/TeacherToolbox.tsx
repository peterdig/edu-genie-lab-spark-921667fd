
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Book, Calendar, Clock, Printer, Share2, SaveAll } from "lucide-react";

export function TeacherToolbox() {
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(5);
  const [remainingTime, setRemainingTime] = useState(5 * 60);
  const [reminderText, setReminderText] = useState("");
  const [reminders, setReminders] = useState<string[]>([]);
  
  // Handle timer start/stop
  const toggleTimer = () => {
    if (isTimerActive) {
      // Stop the timer
      setIsTimerActive(false);
      toast.info("Timer paused");
    } else {
      // Start the timer
      setIsTimerActive(true);
      setRemainingTime(timerDuration * 60);
      toast.success(`Timer started for ${timerDuration} minutes`);
      
      // Set up the interval
      const timerInterval = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            setIsTimerActive(false);
            toast.info("Time's up!", {
              duration: 5000,
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Clean up the interval
      return () => clearInterval(timerInterval);
    }
  };
  
  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Add a new reminder
  const addReminder = () => {
    if (reminderText.trim()) {
      setReminders([...reminders, reminderText]);
      setReminderText("");
      toast.success("Reminder added");
    }
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Teacher Toolbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Classroom Timer
            </h3>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="60"
                value={timerDuration}
                onChange={(e) => setTimerDuration(parseInt(e.target.value) || 5)}
                className="w-20"
                disabled={isTimerActive}
              />
              <span className="text-sm text-muted-foreground">minutes</span>
              <Button 
                onClick={toggleTimer} 
                variant={isTimerActive ? "destructive" : "default"}
                size="sm"
              >
                {isTimerActive ? "Stop" : "Start"}
              </Button>
            </div>
            {isTimerActive && (
              <div className="text-2xl font-bold text-center mt-2">
                {formatTime(remainingTime)}
              </div>
            )}
          </div>
          
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Quick Reminders
            </h3>
            <div className="flex gap-2">
              <Input
                value={reminderText}
                onChange={(e) => setReminderText(e.target.value)}
                placeholder="Add a quick reminder..."
                onKeyDown={(e) => e.key === "Enter" && addReminder()}
              />
              <Button onClick={addReminder} size="sm">Add</Button>
            </div>
            {reminders.length > 0 && (
              <ul className="mt-2 space-y-1">
                {reminders.map((reminder, index) => (
                  <li key={index} className="text-sm flex justify-between items-center">
                    <span>{reminder}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        setReminders(reminders.filter((_, i) => i !== index));
                      }}
                    >
                      ×
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Book className="h-4 w-4" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Printer className="h-3 w-3" />
                <span>Attendance</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Share2 className="h-3 w-3" />
                <span>Share Screen</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <SaveAll className="h-3 w-3" />
                <span>Collect Work</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Schedule</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
