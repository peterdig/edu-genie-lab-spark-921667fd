import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { Menu, PanelLeft } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

interface AppHeaderProps {
  toggleSidebar: () => void;
}

function AppHeader({ toggleSidebar }: AppHeaderProps) {
  const { isMobile } = useSidebar();
  
  return (
    <header className="h-14 flex items-center border-b px-4 md:px-6 bg-background/90 backdrop-blur-sm sticky top-0 z-10">
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
  );
}

export { AppHeader };
export default memo(AppHeader); 