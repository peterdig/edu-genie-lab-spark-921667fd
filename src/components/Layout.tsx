import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 overflow-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                AI-Powered Educator Companion
              </span>
              <ThemeToggle />
            </div>
          </div>
          <main className="p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
