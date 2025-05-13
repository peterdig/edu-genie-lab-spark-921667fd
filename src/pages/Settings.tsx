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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/AuthContext.jsx";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2, AlertCircle, Info, Shield } from "lucide-react";
import { useLocation, Navigate } from "react-router-dom";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { PasswordUpdateForm } from "@/components/auth/PasswordUpdateForm";
import { AvatarUpload } from "@/components/auth/AvatarUpload";
import { NotificationTest } from "@/components/NotificationTest";

// Define schemas for form validation
const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  bio: z.string().optional(),
  job_title: z.string().optional(),
  school: z.string().optional()
});

const passwordSchema = z.object({
  current_password: z.string().min(6, "Password must be at least 6 characters"),
  new_password: z.string().min(8, "New password must be at least 8 characters"),
  confirm_password: z.string().min(8, "Password must be at least 8 characters")
}).refine(data => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function Settings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [defaultModel, setDefaultModel] = useState("qwen");
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const location = useLocation();
  
  // Get the tab from URL query params if available
  const getTabFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'profile';
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromUrl());
  
  useEffect(() => {
    // Update active tab when URL changes
    setActiveTab(getTabFromUrl());
  }, [location]);
  
  useEffect(() => {
    // Check if dark mode is enabled
    const theme = localStorage.getItem("theme");
    setIsDarkMode(theme === "dark");
    
    // Get default model preference
    const model = localStorage.getItem("defaultModel") || "qwen";
    setDefaultModel(model);
    
    // Fetch avatar URL if user is logged in
    if (user) {
      const fetchAvatar = async () => {
        try {
          if (!user.isLocalOnly) {
            const { data, error } = await supabase
              .from('profiles')
              .select('avatar_url')
              .eq('id', user.id)
              .single();
              
            if (data && !error) {
              setAvatarUrl(data.avatar_url);
            }
          } else {
            // Try to get from localStorage
            const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
            const localUser = localUsers.find((u: any) => u.email === user.email);
            if (localUser && localUser.avatar_url) {
              setAvatarUrl(localUser.avatar_url);
            }
          }
        } catch (err) {
          console.error("Error fetching avatar:", err);
        }
      };
      
      fetchAvatar();
    }
  }, [user, profileRefreshKey]);
  
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
  
  const handleAvatarUploadComplete = (url: string) => {
    setAvatarUrl(url);
    // Refresh profile data
    setProfileRefreshKey(prev => prev + 1);
    
    // Also update the UI immediately without waiting for the next render cycle
    if (url) {
      toast.success("Profile picture updated successfully");
    } else {
      toast.success("Profile picture removed successfully");
    }
  };
  
  const handleSavePreferences = () => {
    setIsLoadingPrefs(true);
    
    // Save model preference
    localStorage.setItem("defaultModel", defaultModel);
    
    // Save to Supabase if user is logged in
    if (user && !user.isLocalOnly) {
      const saveToSupabase = async () => {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({
              preferences: {
                defaultModel,
                darkMode: isDarkMode
              }
            })
            .eq('id', user.id);
            
          if (error) throw error;
        } catch (err) {
          console.error("Error saving preferences:", err);
        }
      };
      
      saveToSupabase();
    }
    
    // Simulate API request
    setTimeout(() => {
      setIsLoadingPrefs(false);
      setUpdateSuccess(true);
      toast.success("Preferences saved successfully!");
      
      // Clear success indicator after 3 seconds
      setTimeout(() => setUpdateSuccess(false), 3000);
    }, 500);
  };
  
  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Your Avatar</CardTitle>
                    <CardDescription>
                      Add a profile picture to personalize your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AvatarUpload 
                      initialUrl={avatarUrl} 
                      onUploadComplete={handleAvatarUploadComplete}
                      className="py-4" 
                    />
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <ProfileForm 
                  key={profileRefreshKey}
                  onSuccess={() => setProfileRefreshKey(prev => prev + 1)}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Account Tab */}
          <TabsContent value="account">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <PasswordUpdateForm />
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Account Management</CardTitle>
                    <CardDescription>
                      Manage your account and data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {user?.isLocalOnly && (
                      <Alert className="mb-4">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Using Offline Mode</AlertTitle>
                        <AlertDescription>
                          You're currently using EdGenie in offline mode. Your data is stored locally on this device.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div>
                      <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive mb-2">
                        Export your data
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                        Delete account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Interface Preferences</CardTitle>
                    <CardDescription>
                      Customize your experience with EduGenie
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Switch between light and dark themes
                        </p>
                      </div>
                      <DarkModeToggle />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Compact View</Label>
                        <p className="text-sm text-muted-foreground">
                          Show more content with less spacing
                        </p>
                      </div>
                      <Switch />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Default AI Model</Label>
                        <p className="text-sm text-muted-foreground">
                          Choose your preferred AI model for content generation
                        </p>
                      </div>
                      <div className="w-[180px]">
                        <select 
                          value={defaultModel} 
                          onChange={e => setDefaultModel(e.target.value)}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="qwen">Qwen 3 4B</option>
                          <option value="mistral">Mistral 7B</option>
                          <option value="llama">Llama 3.1 8B</option>
                          <option value="deepseek">DeepSeek 3 Base</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleSavePreferences} disabled={isLoadingPrefs} className="w-full">
                      {isLoadingPrefs ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : updateSuccess ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Saved
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <div>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Notifications Test</CardTitle>
                    <CardDescription>
                      Create test notifications to try out the notification system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <NotificationTest />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch
                      disabled={user?.isLocalOnly}
                      aria-label="Toggle two-factor authentication"
                    />
                  </div>
                  
                  {user?.isLocalOnly && (
                    <Alert variant="destructive">
                      <Shield className="h-4 w-4" />
                      <AlertTitle>Limited Security Features</AlertTitle>
                      <AlertDescription>
                        Advanced security features are only available when using EdGenie with an online account.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div>
                    <h3 className="font-medium">Session Management</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Manage your active sessions
                    </p>
                    
                    <div className="border rounded-md p-3 mb-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Current Device</p>
                          <p className="text-sm text-muted-foreground">
                            Last active: Just now
                          </p>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          Current
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
