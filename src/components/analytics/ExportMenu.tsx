import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, FileJson, FileSpreadsheet, Share } from "lucide-react";

interface ExportMenuProps {
  onExport: (format: 'csv' | 'json') => void;
  disabled?: boolean;
}

export function ExportMenu({ onExport, disabled = false }: ExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={disabled}>
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => onExport('csv')}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Export as CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onExport('json')}
          className="cursor-pointer"
        >
          <FileJson className="mr-2 h-4 w-4" />
          <span>Export as JSON</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Share className="mr-2 h-4 w-4" />
          <span>Share Dashboard</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 