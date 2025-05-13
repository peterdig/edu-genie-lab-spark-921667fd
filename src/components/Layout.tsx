import React, { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { AccountMenu } from './auth/AccountMenu';
import { SidebarProvider, useSidebar } from './ui/sidebar';
import { ThemeToggle } from './ui/theme-toggle';
import { Separator } from './ui/separator';
import { Menu, PanelLeft } from 'lucide-react';
import { Button } from './ui/button';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <LayoutContent children={children} />
    </SidebarProvider>
  );
}

// Separate component to use the useSidebar hook
function LayoutContent({ children }: LayoutProps) {
  const { toggleSidebar, isMobile } = useSidebar();
  
  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col w-full">
        <header className="flex h-14 items-center border-b px-4 lg:px-6 bg-background/90 backdrop-blur-sm sticky top-0 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            className="mr-2 hover:bg-primary/10 hover:text-primary"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Separator orientation="vertical" className="h-6" />
            <AccountMenu />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-6 lg:py-8 overflow-y-auto scrollbar-none smooth-scroll">
          {children}
        </main>
      </div>
    </div>
  );
}
