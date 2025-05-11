import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { BellRing, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RealTimeStatusProps {
  isRealTimeEnabled: boolean;
  toggleRealTime: () => void;
  lastUpdated?: string;
}

export function RealTimeStatus({
  isRealTimeEnabled,
  toggleRealTime,
  lastUpdated,
}: RealTimeStatusProps) {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Switch
          checked={isRealTimeEnabled}
          onCheckedChange={toggleRealTime}
          id="real-time-mode"
        />
        <label
          htmlFor="real-time-mode"
          className="text-sm font-medium cursor-pointer select-none"
        >
          Real-time Updates
        </label>
      </div>
      
      <Badge
        variant="outline"
        className={cn(
          "gap-1 px-2 py-1",
          isRealTimeEnabled && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
        )}
      >
        {isRealTimeEnabled ? (
          <>
            <span
              className={cn(
                "relative flex h-2 w-2",
              )}
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live</span>
          </>
        ) : (
          <>
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>Manual Refresh</span>
          </>
        )}
      </Badge>
      
      {lastUpdated && (
        <span className="text-xs text-muted-foreground flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Last update: {new Date(lastUpdated).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
} 