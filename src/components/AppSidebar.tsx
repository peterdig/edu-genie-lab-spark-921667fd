import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  Book, 
  Calendar, 
  Home, 
  LogOut, 
  User, 
  FolderOpen, 
  PanelLeft, 
  Users, 
  FileSpreadsheet,
  BarChart,
  FileText,
  Accessibility as AccessibilityIcon,
  Share2,
  X,
  MessageSquare,
  Link
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
  useSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext.jsx";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
}

const NavItem = ({ icon: Icon, label, to }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const { isMobile, setOpenMobile } = useSidebar();
  
  const handleClick = () => {
    // Close mobile sidebar when item is clicked
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink 
          to={to} 
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
            isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
          onClick={handleClick}
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

export function AppSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
            <Book className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg">EduCompanion</h2>
            <p className="text-xs text-muted-foreground">AI-Powered Education</p>
          </div>
        </div>
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setOpenMobile(false)}
            className="lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </SidebarHeader>
      
      <SidebarContent className="overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem icon={Home} label="Dashboard" to="/dashboard" />
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
              <NavItem icon={MessageSquare} label="Collaborative Workspace" to="/collaborative-workspace" />
              <NavItem icon={Link} label="Integrations" to="/integrations" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 mt-auto">
        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2" 
          size="sm"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
