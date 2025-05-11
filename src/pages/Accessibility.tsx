import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAccessibilitySettings } from "@/hooks/useAccessibilitySettings";
import { AlertCircle, Check, FileUp, FileDown, RefreshCw, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Accessibility = () => {
  const { toast } = useToast();
  const {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    detectSystemPreferences,
    isUsingFallback
  } = useAccessibilitySettings();
  
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState("text");
  const [previewText, setPreviewText] = useState(
    "This is a preview text to demonstrate how the accessibility settings affect the display of content. You can adjust the settings on the left and see the changes reflected here in real-time."
  );

  // Handle file import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        await importSettings(content);
        toast({
          title: "Settings Imported",
          description: "Your accessibility settings have been successfully imported.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import settings. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the file input
    if (event.target) {
      event.target.value = '';
    }
  };

  // Handle export
  const handleExport = () => {
    exportSettings();
    toast({
      title: "Settings Exported",
      description: "Your accessibility settings have been exported as a JSON file.",
    });
  };

  // Handle reset
  const handleReset = async () => {
    await resetSettings();
    toast({
      title: "Settings Reset",
      description: "Your accessibility settings have been reset to default values.",
    });
  };

  // Handle system detection
  const handleDetectSystem = async () => {
    await detectSystemPreferences();
    toast({
      title: "System Preferences Detected",
      description: "Settings have been updated based on your system preferences.",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load accessibility settings. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Accessibility Settings</h1>
              <p className="text-muted-foreground">
                Customize your experience to meet your accessibility needs
              </p>
            </div>
            <div className="flex space-x-2 mt-4 md:mt-0">
              <Button variant="outline" size="sm" onClick={handleDetectSystem}>
                <Zap className="mr-2 h-4 w-4" />
                Auto-Detect
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef?.click()}>
                <FileUp className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <FileDown className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
                ref={(ref) => setFileInputRef(ref)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>
                    Adjust these settings to improve your experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-4 mb-4">
                      <TabsTrigger value="text">Text</TabsTrigger>
                      <TabsTrigger value="visual">Visual</TabsTrigger>
                      <TabsTrigger value="motion">Motion & Navigation</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="text" className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="fontSize" className="text-base">Font Size</Label>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm">Small</span>
                            <Select 
                              value={settings.fontSize} 
                              onValueChange={(value) => updateSettings({ fontSize: value })}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                                <SelectItem value="x-large">Extra Large</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-sm">Extra Large</span>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <Label htmlFor="fontFamily" className="text-base">Font Family</Label>
                          <Select 
                            value={settings.fontFamily} 
                            onValueChange={(value) => updateSettings({ fontFamily: value })}
                          >
                            <SelectTrigger className="w-full mt-2">
                              <SelectValue placeholder="Select font" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="dyslexic-friendly">Dyslexic Friendly</SelectItem>
                              <SelectItem value="sans-serif">Sans Serif</SelectItem>
                              <SelectItem value="serif">Serif</SelectItem>
                              <SelectItem value="monospace">Monospace</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <Label htmlFor="lineHeight" className="text-base">Line Height</Label>
                          <Select 
                            value={settings.lineHeight} 
                            onValueChange={(value) => updateSettings({ lineHeight: value })}
                          >
                            <SelectTrigger className="w-full mt-2">
                              <SelectValue placeholder="Select line height" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="increased">Increased</SelectItem>
                              <SelectItem value="double">Double</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <Label htmlFor="textAlign" className="text-base">Text Alignment</Label>
                          <Select 
                            value={settings.textAlign} 
                            onValueChange={(value) => updateSettings({ textAlign: value })}
                          >
                            <SelectTrigger className="w-full mt-2">
                              <SelectValue placeholder="Select text alignment" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                              <SelectItem value="justify">Justify</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="textSpacing" className="text-base">Increased Text Spacing</Label>
                            <p className="text-sm text-muted-foreground">
                              Increase spacing between letters and words
                            </p>
                          </div>
                          <Switch 
                            id="textSpacing" 
                            checked={settings.textSpacing === 'increased'} 
                            onCheckedChange={(checked) => 
                              updateSettings({ textSpacing: checked ? 'increased' : 'normal' })
                            }
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="highlightLinks" className="text-base">Highlight Links</Label>
                            <p className="text-sm text-muted-foreground">
                              Make links more visible with underline and bold text
                            </p>
                          </div>
                          <Switch 
                            id="highlightLinks" 
                            checked={settings.highlightLinks} 
                            onCheckedChange={(checked) => 
                              updateSettings({ highlightLinks: checked })
                            }
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="visual" className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="contrast" className="text-base">Contrast</Label>
                          <Select 
                            value={settings.contrast} 
                            onValueChange={(value) => updateSettings({ contrast: value })}
                          >
                            <SelectTrigger className="w-full mt-2">
                              <SelectValue placeholder="Select contrast" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <Label htmlFor="colorBlindMode" className="text-base">Color Blind Mode</Label>
                          <Select 
                            value={settings.colorBlindMode} 
                            onValueChange={(value) => updateSettings({ colorBlindMode: value })}
                          >
                            <SelectTrigger className="w-full mt-2">
                              <SelectValue placeholder="Select color blind mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="protanopia">Protanopia (Red-Blind)</SelectItem>
                              <SelectItem value="deuteranopia">Deuteranopia (Green-Blind)</SelectItem>
                              <SelectItem value="tritanopia">Tritanopia (Blue-Blind)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="focusIndicators" className="text-base">Enhanced Focus Indicators</Label>
                            <p className="text-sm text-muted-foreground">
                              Make focused elements more visible
                            </p>
                          </div>
                          <Switch 
                            id="focusIndicators" 
                            checked={settings.focusIndicators} 
                            onCheckedChange={(checked) => 
                              updateSettings({ focusIndicators: checked })
                            }
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="readingRuler" className="text-base">Reading Ruler</Label>
                            <p className="text-sm text-muted-foreground">
                              Show a reading guide that follows your cursor
                            </p>
                          </div>
                          <Switch 
                            id="readingRuler" 
                            checked={settings.readingRuler} 
                            onCheckedChange={(checked) => 
                              updateSettings({ readingRuler: checked })
                            }
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="motion" className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="reducedMotion" className="text-base">Reduced Motion</Label>
                            <p className="text-sm text-muted-foreground">
                              Minimize animations and transitions
                            </p>
                          </div>
                          <Switch 
                            id="reducedMotion" 
                            checked={settings.reducedMotion} 
                            onCheckedChange={(checked) => 
                              updateSettings({ reducedMotion: checked })
                            }
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="autoPlay" className="text-base">Auto-Play Media</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow videos and animations to play automatically
                            </p>
                          </div>
                          <Switch 
                            id="autoPlay" 
                            checked={settings.autoPlay} 
                            onCheckedChange={(checked) => 
                              updateSettings({ autoPlay: checked })
                            }
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="keyboardNavigation" className="text-base">Enhanced Keyboard Navigation</Label>
                            <p className="text-sm text-muted-foreground">
                              Improve navigation with keyboard shortcuts
                            </p>
                          </div>
                          <Switch 
                            id="keyboardNavigation" 
                            checked={settings.keyboardNavigation} 
                            onCheckedChange={(checked) => 
                              updateSettings({ keyboardNavigation: checked })
                            }
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="advanced" className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="screenReader" className="text-base">Screen Reader Support</Label>
                            <p className="text-sm text-muted-foreground">
                              Optimize content for screen readers
                            </p>
                          </div>
                          <Switch 
                            id="screenReader" 
                            checked={settings.screenReader} 
                            onCheckedChange={(checked) => 
                              updateSettings({ screenReader: checked })
                            }
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="textToSpeech" className="text-base">Text-to-Speech</Label>
                            <p className="text-sm text-muted-foreground">
                              Enable text-to-speech functionality
                            </p>
                          </div>
                          <Switch 
                            id="textToSpeech" 
                            checked={settings.textToSpeech} 
                            onCheckedChange={(checked) => 
                              updateSettings({ textToSpeech: checked })
                            }
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    {isUsingFallback ? 
                      "Using localStorage for settings storage" : 
                      "Settings are saved to your account"}
                  </p>
                  {settings !== undefined && (
                    <div className="flex items-center text-sm text-green-600">
                      <Check className="h-4 w-4 mr-1" />
                      Settings saved
                    </div>
                  )}
                </CardFooter>
              </Card>
            </div>
            
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    See how your settings affect content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md">
                      <h3 className="text-lg font-medium mb-2">Sample Content</h3>
                      <p>{previewText}</p>
                      <div className="mt-4">
                        <a href="#" className="text-blue-600">This is a sample link</a>
                      </div>
                    </div>
                    
                    <textarea
                      className="w-full h-24 p-2 border rounded-md"
                      value={previewText}
                      onChange={(e) => setPreviewText(e.target.value)}
                      placeholder="Edit this text to test your settings"
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Help & Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>What are accessibility settings?</AccordionTrigger>
                      <AccordionContent>
                        Accessibility settings help make the application more usable for people with different needs, 
                        including visual, motor, or cognitive disabilities.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>How are my settings saved?</AccordionTrigger>
                      <AccordionContent>
                        {isUsingFallback ? 
                          "Your settings are currently saved in your browser's local storage. To save them to your account, please configure Supabase in the .env file." : 
                          "Your settings are saved to your account and will be available on any device you use."}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Can I export my settings?</AccordionTrigger>
                      <AccordionContent>
                        Yes, you can export your settings as a JSON file and import them on another device or share them with others.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Accessibility; 