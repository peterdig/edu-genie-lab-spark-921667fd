import React from 'react';
import { 
  AlertCircle, 
  Volume2, 
  Type, 
  ZoomIn, 
  RotateCcw,
  PanelRightClose
} from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AccessibilityIconButtonProps {
  label: string;
  icon: React.ReactNode;
}

const AccessibilityIconButton = ({ label, icon }: AccessibilityIconButtonProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10 rounded-full" 
            aria-label={label}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export function AccessibilitySettingsButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
          aria-label="Accessibility Settings"
        >
          <AlertCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Accessibility Settings</DialogTitle>
          <DialogDescription>
            Customize your experience to make the application more accessible.
          </DialogDescription>
        </DialogHeader>
        
        <AccessibilitySettingsContent />
        
        <DialogFooter>
          <Button type="submit" className="w-full">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AccessibilitySettingsContent() {
  const { settings, updateSettings, resetSettings } = useAccessibility();

  return (
    <div className="grid gap-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Volume2 className="h-5 w-5" />
          <div>
            <Label htmlFor="text-to-speech">Text to Speech</Label>
            <p className="text-sm text-muted-foreground">Enable text-to-speech functionality</p>
          </div>
        </div>
        <Switch 
          id="text-to-speech"
          checked={settings.textToSpeechEnabled}
          onCheckedChange={(checked) => updateSettings({ textToSpeechEnabled: checked })}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Type className="h-5 w-5" />
          <div>
            <Label htmlFor="large-text">Large Text</Label>
            <p className="text-sm text-muted-foreground">Increase text size throughout the app</p>
          </div>
        </div>
        <Switch 
          id="large-text"
          checked={settings.largeText}
          onCheckedChange={(checked) => updateSettings({ largeText: checked })}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-4">
          <ZoomIn className="h-5 w-5" />
          <div>
            <Label htmlFor="font-size">Font Size</Label>
            <p className="text-sm text-muted-foreground">Adjust the size of text</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Slider
            id="font-size"
            min={0.8}
            max={1.6}
            step={0.1}
            value={[settings.fontSize]}
            onValueChange={([value]) => updateSettings({ fontSize: value })}
          />
          <span className="w-12 text-sm text-right">{Math.round(settings.fontSize * 100)}%</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <PanelRightClose className="h-5 w-5" />
          <div>
            <Label htmlFor="high-contrast">High Contrast</Label>
            <p className="text-sm text-muted-foreground">Enhance visual contrast for better readability</p>
          </div>
        </div>
        <Switch 
          id="high-contrast"
          checked={settings.highContrastMode}
          onCheckedChange={(checked) => updateSettings({ highContrastMode: checked })}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="h-5 w-5"
          >
            <path d="M15 4.55a8 8 0 0 0-7.93 0" />
            <path d="M15 19.45a8 8 0 0 1-7.93 0" />
            <line x1="2" y1="2" x2="22" y2="22" />
            <path d="M8 14.5 5 17" />
            <path d="M5 8v4h4" />
          </svg>
          <div>
            <Label htmlFor="reduced-motion">Reduced Motion</Label>
            <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
          </div>
        </div>
        <Switch 
          id="reduced-motion"
          checked={settings.reducedMotion}
          onCheckedChange={(checked) => updateSettings({ reducedMotion: checked })}
        />
      </div>
      
      <div className="pt-2">
        <Button variant="outline" onClick={resetSettings} className="w-full">
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
} 