import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Book, 
  Calendar, 
  Home, 
  LogOut, 
  Settings, 
  User, 
  FolderOpen, 
  PanelLeft, 
  Users, 
  FileSpreadsheet,
  BarChart,
  FileText,
  Accessibility as AccessibilityIcon,
  Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
}

const NavItem = ({ icon: Icon, label, to }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink 
          to={to} 
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
            isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

export function AppSidebar() {
  const [user] = useState({
    name: "Teacher User",
    avatar: "/placeholder.svg",
    role: "Teacher"
  });

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
            <Book className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg">EduCompanion</h2>
            <p className="text-xs text-muted-foreground">AI-Powered Education</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem icon={Home} label="Dashboard" to="/" />
              <NavItem icon={Book} label="Lessons" to="/lessons" />
              <NavItem icon={Calendar} label="Assessments" to="/assessments" />
              <NavItem icon={User} label="Labs" to="/labs" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>Organization</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem icon={FolderOpen} label="My Library" to="/my-library" />
              <NavItem icon={PanelLeft} label="Curriculum Planner" to="/curriculum-planner" />
              <NavItem icon={FileText} label="Templates" to="/templates" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem icon={Users} label="Differentiation" to="/differentiation" />
              <NavItem icon={FileSpreadsheet} label="Rubric Generator" to="/rubric-generator" />
              <NavItem icon={AccessibilityIcon} label="Accessibility" to="/accessibility" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>Insights & Collaboration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem icon={BarChart} label="Analytics" to="/analytics" />
              <NavItem icon={Share2} label="Collaboration" to="/collaboration" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-4 py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center overflow-hidden">
                  <User className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <NavItem icon={Settings} label="Settings" to="/settings" />
                <ThemeToggle />
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <Button variant="outline" className="w-full flex items-center gap-2" size="sm">
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
