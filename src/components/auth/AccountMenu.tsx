import { useAuth } from "@/lib/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  User,
  LogOut,
  Settings,
  UserCog,
  School,
  HelpCircle,
  Network,
  AlertCircle,
  Loader2,
  ChevronDown,
  Bell
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useNotificationsContext } from "@/lib/NotificationContext";

interface AccountMenuProps {
  className?: string;
}

export function AccountMenu({ className }: AccountMenuProps) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { unreadCount } = useNotificationsContext();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Calculate user initials when user changes
  const userInitials = useMemo(() => {
    if (!user?.full_name) return "U";
    return user.full_name
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }, [user?.full_name]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success("You have been logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Failed to log out. Please try again.");
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" className={className} disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Button variant="outline" size="sm" className={className} onClick={() => navigate("/login")}>
        <User className="mr-2 h-4 w-4" />
        Sign in
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/notifications")}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
      
      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={`flex items-center gap-2 ${className}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url || ""} alt={user?.full_name || "User"} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium leading-none">{user.full_name || "User"}</span>
              <span className="text-xs text-muted-foreground">{user.role || "User"}</span>
            </div>
            <ChevronDown className="hidden md:block h-4 w-4 ml-1 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => navigate("/settings?tab=profile")}>
              <UserCog className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings?tab=preferences")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Preferences</span>
            </DropdownMenuItem>
            {user.role === "admin" && (
              <DropdownMenuItem onClick={() => navigate("/admin")}>
                <School className="mr-2 h-4 w-4" />
                <span>Admin Dashboard</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => navigate("/help")}>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help & Resources</span>
            </DropdownMenuItem>
            {user.isLocalOnly && (
              <DropdownMenuItem onClick={() => navigate("/settings?tab=account")}>
                <Network className="mr-2 h-4 w-4" />
                <span className="flex items-center gap-2">
                  <span>Using Offline Mode</span>
                  <Badge variant="outline" className="ml-auto text-xs py-0">offline</Badge>
                </span>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleLogout} 
            disabled={isLoggingOut}
            className="text-destructive focus:text-destructive"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Logging out...</span>
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 