
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { getNextModel } from "@/lib/openrouter";

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [defaultModel, setDefaultModel] = useState("qwen");
  
  useEffect(() => {
    // Check if dark mode is enabled
    const theme = localStorage.getItem("theme");
    setIsDarkMode(theme === "dark");
    
    // Get default model preference
    const model = localStorage.getItem("defaultModel") || "qwen";
    setDefaultModel(model);
  }, []);
  
  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    
    if (newValue) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };
  
  const handleSave = () => {
    setIsLoading(true);
    
    // Save model preference
    localStorage.setItem("defaultModel", defaultModel);
    
    // Simulate API request
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Settings saved successfully!");
    }, 1500);
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account and application preferences
            </p>
          </div>
          <DarkModeToggle />
        </div>
        
        <Alert className="bg-primary/5 border-primary/20">
          <AlertDescription>
            We've updated our AI models to ensure more reliable content generation. If you experience any issues, try switching models in the AI Settings tab.
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="api">AI Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account details and profile settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue="Teacher User" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue="teacher@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" placeholder="Tell us about yourself..." />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password to secure your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button>Update Password</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Customize your app experience.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about new features and resources.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark themes.
                    </p>
                  </div>
                  <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Lab Narration</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable AI voice narration for labs by default.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-save Content</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save your content as you work.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Preferences"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Settings</CardTitle>
                <CardDescription>
                  Configure your AI models and defaults.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Default AI Model</Label>
                  <div className="grid gap-2">
                    <div 
                      className={`flex items-center justify-between border p-3 rounded-md cursor-pointer ${defaultModel === 'qwen' ? 'bg-primary/10 border-primary' : ''}`}
                      onClick={() => setDefaultModel('qwen')}
                    >
                      <div>
                        <p className="font-medium">Claude Haiku</p>
                        <p className="text-xs text-muted-foreground">Fast, reliable, balanced option</p>
                      </div>
                      <Switch checked={defaultModel === 'qwen'} />
                    </div>
                    <div 
                      className={`flex items-center justify-between border p-3 rounded-md cursor-pointer ${defaultModel === 'mistral' ? 'bg-primary/10 border-primary' : ''}`}
                      onClick={() => setDefaultModel('mistral')}
                    >
                      <div>
                        <p className="font-medium">Mistral</p>
                        <p className="text-xs text-muted-foreground">Great for detailed lesson plans</p>
                      </div>
                      <Switch checked={defaultModel === 'mistral'} />
                    </div>
                    <div 
                      className={`flex items-center justify-between border p-3 rounded-md cursor-pointer ${defaultModel === 'deepseek' ? 'bg-primary/10 border-primary' : ''}`}
                      onClick={() => setDefaultModel('deepseek')}
                    >
                      <div>
                        <p className="font-medium">DeepSeek</p>
                        <p className="text-xs text-muted-foreground">Best for code and technical content</p>
                      </div>
                      <Switch checked={defaultModel === 'deepseek'} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="openai-key">Additional AI Settings</Label>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto Retry Failed Generations</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically try a different model if generation fails
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Model Fallback Order</Label>
                        <p className="text-sm text-muted-foreground">
                          If primary model fails, try in this order
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">1. Claude</span>
                        <span className="text-sm">→</span>
                        <span className="text-sm">2. Mistral</span>
                        <span className="text-sm">→</span>
                        <span className="text-sm">3. DeepSeek</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save AI Settings"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
