import { useState, useEffect, useCallback, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/AuthContext.jsx";
import { useIntegrations, IntegrationPlatform } from "@/hooks/useIntegrations";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { 
  Library, 
  GraduationCap, 
  BookOpen, 
  FileText, 
  LucideIcon, 
  Globe, 
  RefreshCw, 
  CheckCircle2, 
  HelpCircle, 
  Search,
  Link as LinkIcon, 
  X,
  Loader2,
  ArrowRight,
  Lock,
  PlusCircle,
  Settings,
  DownloadCloud,
  UploadCloud
} from "lucide-react";

// Get icon component from string name
const getIconByName = (iconName: string): LucideIcon => {
  switch (iconName) {
    case 'GraduationCap':
      return GraduationCap;
    case 'BookOpen':
      return BookOpen;
    case 'FileText':
      return FileText;
    case 'Library':
      return Library;
    case 'Globe':
      return Globe;
    case 'Lock':
      return Lock;
    default:
      return HelpCircle;
  }
};

// Format timestamp for display
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export default function IntegrationsHub() {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("integrations");
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !user) {
      const timer = setTimeout(() => setRedirectToLogin(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);
  
  // Redirect to login page if needed
  if (redirectToLogin) {
    return <Navigate to="/login" />;
  }
  
  // Use our integrations hook
  const { 
    getAvailablePlatforms,
    getConnectedPlatforms,
    getPlatformSyncOptions,
    connectPlatform,
    disconnectPlatform,
    toggleSyncOption,
    syncData,
    getSyncStats,
    loading,
    error
  } = useIntegrations();
  
  // Local state for stats
  const [syncStats, setSyncStats] = useState<any>({
    importedCourses: 0,
    importedAssignments: 0,
    exportedAssignments: 0, 
    exportedGrades: 0,
    lastFullSync: ''
  });
  
  // Load sync stats on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadStats = async () => {
      try {
        const stats = await getSyncStats();
        if (isMounted) {
          setSyncStats(stats);
        }
      } catch (error) {
        console.error("Error loading sync stats:", error);
      }
    };
    
    if (isAuthenticated && !loading) {
      loadStats();
    }
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, loading, getSyncStats]);
  
  // Memoize platform data
  const availablePlatforms = useMemo(() => {
    return getAvailablePlatforms();
  }, [getAvailablePlatforms]);
  
  const connectedPlatforms = useMemo(() => {
    return getConnectedPlatforms();
  }, [getConnectedPlatforms]);
  
  // Set first connected platform as active if none selected
  useEffect(() => {
    if (connectedPlatforms.length > 0 && !activePlatform) {
      setActivePlatform(connectedPlatforms[0].id);
    }
  }, [connectedPlatforms, activePlatform]);
  
  // Get data sync options for the active platform
  const platformSyncOptions = useMemo(() => {
    return activePlatform ? getPlatformSyncOptions(activePlatform) : [];
  }, [activePlatform, getPlatformSyncOptions]);
  
  // Handle initiating a new connection
  const handleConnect = async (platform: IntegrationPlatform) => {
    setConnecting(platform.id);
    
    try {
      toast.info(`Connecting to ${platform.name}...`, {
        duration: 2000
      });
      
      const connection = await connectPlatform(platform.id);
      if (connection) {
        // Set as active platform
        setActivePlatform(platform.id);
        
        // Update stats to reflect the new connection
        const updatedStats = await getSyncStats();
        setSyncStats(updatedStats);
        
        // Show success message
        toast.success(`Successfully connected to ${platform.name}`, {
          description: 'You can now sync data with this platform'
        });
        
        // Switch to connected tab
        setActiveTab("connected");
      } else {
        throw new Error("Connection failed - null connection returned");
      }
    } catch (error) {
      console.error("Error connecting to platform:", error);
      toast.error(`Failed to connect to ${platform.name}`, {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setConnecting(null);
    }
  };
  
  // Handle disconnecting a platform
  const handleDisconnect = async (platform: any) => {
    try {
      toast.info(`Disconnecting from ${platform.name}...`);
      
      const success = await disconnectPlatform(platform.id);
      if (success) {
        toast.success(`Successfully disconnected from ${platform.name}`);
        // If this was the active platform, clear it
        if (activePlatform === platform.id) {
          setActivePlatform(null);
        }
      } else {
        toast.error(`Failed to disconnect from ${platform.name}`);
      }
    } catch (error) {
      console.error("Error disconnecting from platform:", error);
      toast.error(`Failed to disconnect from ${platform.name}`);
    }
  };
  
  // Handle toggling a sync option
  const handleToggleSync = async (syncOption: any) => {
    try {
      const newState = !syncOption.enabled;
      toast.info(`${newState ? 'Enabling' : 'Disabling'} ${syncOption.name} sync...`);
      
      const updated = await toggleSyncOption(syncOption.id, newState);
      if (updated) {
        toast.success(`${syncOption.enabled ? 'Disabled' : 'Enabled'} ${syncOption.name} sync for ${
          availablePlatforms.find(p => p.id === syncOption.platform_id)?.name
        }`);
      } else {
        toast.error(`Failed to update sync settings for ${syncOption.name}`);
      }
    } catch (error) {
      console.error("Error toggling sync option:", error);
      toast.error(`Failed to update sync settings for ${syncOption.name}`);
    }
  };
  
  // Handle syncing a specific platform
  const handleSyncPlatform = async (platformId: string) => {
    setSyncingPlatform(platformId);
    
    try {
      const platformName = availablePlatforms.find(p => p.id === platformId)?.name || 'platform';
      toast.info(`Syncing data with ${platformName}...`, {
        description: 'This may take a few moments'
      });
      
      const success = await syncData(platformId);
      if (success) {
        toast.success(`Successfully synchronized data for ${
          availablePlatforms.find(p => p.id === platformId)?.name
        }`, {
          description: 'All enabled data types were synced'
        });
        
        // Refresh stats
        const stats = await getSyncStats();
        setSyncStats(stats);
      } else {
        toast.error(`Synchronization failed for ${
          availablePlatforms.find(p => p.id === platformId)?.name
        }`);
      }
    } catch (error) {
      console.error("Error syncing platform:", error);
      toast.error(`Synchronization failed`, {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setSyncingPlatform(null);
    }
  };
  
  // Handle triggering a sync for all enabled options
  const handleSyncAll = async () => {
    setSyncingAll(true);
    
    try {
      toast.info("Starting synchronization for all connected platforms...", {
        description: 'This may take a few moments'
      });
      
      // Sync each connected platform
      const syncPromises = connectedPlatforms.map(platform => 
        syncData(platform.id)
      );
      
      await Promise.all(syncPromises);
      toast.success("All data synchronized successfully", {
        description: 'Updated data for all connected platforms'
      });
      
      // Refresh stats
      const stats = await getSyncStats();
      setSyncStats(stats);
    } catch (error) {
      console.error("Error during sync all:", error);
      toast.error("Some synchronization operations failed", {
        description: error instanceof Error ? error.message : 'Some platforms may not have synced correctly'
      });
    } finally {
      setSyncingAll(false);
    }
  };
  
  // Filter platforms based on search query - memoize this for better performance
  const filteredPlatforms = useMemo(() => {
    return availablePlatforms.filter(platform => 
      platform.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      platform.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      platform.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availablePlatforms, searchQuery]);

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium">Loading Integration Hub</h3>
            <p className="text-muted-foreground">Please wait while we fetch your integrations...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show auth required message if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[80vh] text-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please log in to access the integrations hub.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => window.location.href = '/login'}
                className="mt-2"
              >
                Log In
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 w-full max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integrations Hub</h1>
            <p className="text-muted-foreground mt-1">
              Connect EdGenie with your learning management systems and educational tools
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="integrations">
              <LinkIcon className="mr-2 h-4 w-4" />
              Available Integrations
            </TabsTrigger>
            <TabsTrigger value="connected">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Connected Platforms
            </TabsTrigger>
            <TabsTrigger value="sync">
              <RefreshCw className="mr-2 h-4 w-4" />
              Data Synchronization
            </TabsTrigger>
          </TabsList>
          
          {/* Available Integrations Tab */}
          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Integrations</CardTitle>
                <CardDescription>
                  Connect EdGenie with your favorite learning platforms and tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search integrations..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlatforms.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <HelpCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-1">No Integrations Found</h3>
                      <p className="text-muted-foreground mb-4">
                        No platforms match your search query. Try a different search term.
                      </p>
                    </div>
                  ) : (
                    filteredPlatforms.map((platform) => {
                      const Icon = getIconByName(platform.icon_name);
                      return (
                        <Card key={platform.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-2">
                                <div className="p-2 bg-primary/10 rounded-md">
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <CardTitle className="text-lg">{platform.name}</CardTitle>
                              </div>
                              {/* We don't have a popular flag in our data model, so commenting out */}
                              {/*
                              {platform.popular && (
                                <Badge variant="secondary" className="ml-auto">Popular</Badge>
                              )}
                              */}
                            </div>
                            <CardDescription>{platform.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Badge variant="outline" className="mr-2">
                                {platform.category === "lms" ? "Learning Management" : 
                                platform.category === "sis" ? "Student Information" : 
                                platform.category === "content" ? "Content" : 
                                platform.category === "assessment" ? "Assessment" : 
                                "Communication"}
                              </Badge>
                              {platform.connected && (
                                <div className="flex items-center text-green-600 dark:text-green-400">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  <span>Connected</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="bg-muted/50 py-2">
                            {platform.connected ? (
                              <div className="flex justify-between items-center w-full">
                                <span className="text-xs text-muted-foreground">
                                  Last sync: {platform.lastSync ? formatTimestamp(platform.lastSync) : 'Never'}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDisconnect(platform)}
                                >
                                  <LinkIcon className="mr-1 h-3 w-3" />
                                  Disconnect
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                className="w-full" 
                                size="sm" 
                                onClick={() => handleConnect(platform)}
                                disabled={connecting === platform.id}
                              >
                                {connecting === platform.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connecting...
                                  </>
                                ) : (
                                  <>
                                    <LinkIcon className="mr-2 h-4 w-4" />
                                    Connect
                                  </>
                                )}
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Connected Platforms Tab */}
          <TabsContent value="connected" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Connected Platforms</CardTitle>
                <CardDescription>
                  Manage your connected learning platforms and tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                {connectedPlatforms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-3 bg-muted rounded-full mb-4">
                      <LinkIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No Connected Platforms</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      You haven't connected any learning platforms yet. Connect platforms to sync your courses, assignments, and more.
                    </p>
                    <Button onClick={() => setActiveTab("integrations")}>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Connect Platforms
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {connectedPlatforms.map((platform) => {
                      const Icon = getIconByName(platform.icon_name);
                      return (
                        <div key={platform.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-4">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-primary/10 rounded-md">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">{platform.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Last synced: {platform.lastSync ? formatTimestamp(platform.lastSync) : 'Never'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 ml-auto">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setActivePlatform(platform.id);
                                setActiveTab("sync");
                              }}
                            >
                              <Settings className="mr-2 h-3 w-3" />
                              Configure
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleSyncPlatform(platform.id)}
                              disabled={syncingPlatform === platform.id}
                            >
                              {syncingPlatform === platform.id ? (
                                <>
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  Syncing...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="mr-2 h-3 w-3" />
                                  Sync Now
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDisconnect(platform)}
                            >
                              <LinkIcon className="mr-2 h-3 w-3" />
                              Disconnect
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Data Usage Stats</CardTitle>
                  <CardDescription>
                    Overview of data transfer with connected platforms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Imported Courses</span>
                        <span className="font-medium">{syncStats.importedCourses || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Imported Assignments</span>
                        <span className="font-medium">{syncStats.importedAssignments || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Exported Assignments</span>
                        <span className="font-medium">{syncStats.exportedAssignments || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Exported Grades</span>
                        <span className="font-medium">{syncStats.exportedGrades || 0}</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last Full Sync</span>
                      <span className="text-sm text-muted-foreground">
                        {syncStats.lastFullSync ? formatTimestamp(syncStats.lastFullSync) : 'Never'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Sync Schedule</CardTitle>
                  <CardDescription>
                    Configure automatic synchronization intervals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-sync enabled</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically sync data at specified intervals
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Sync frequency</Label>
                      <select className="w-full p-2 border rounded-md">
                        <option>Every 6 hours</option>
                        <option>Every 12 hours</option>
                        <option>Daily</option>
                        <option>Weekly</option>
                      </select>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleSyncAll} 
                      disabled={syncingAll || connectedPlatforms.length === 0}
                    >
                      {syncingAll ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync All Now
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Data Synchronization Tab */}
          <TabsContent value="sync" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Data Synchronization Settings</CardTitle>
                    <CardDescription>
                      Configure what data to sync with each connected platform
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleSyncAll} 
                      disabled={syncingAll || connectedPlatforms.length === 0}
                    >
                      {syncingAll ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync All
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  {/* Platform Selector */}
                  <div className="col-span-5 md:col-span-1 space-y-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Connected Platforms</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[400px]">
                          <div>
                            {connectedPlatforms.map((platform) => {
                              const Icon = getIconByName(platform.icon_name);
                              return (
                                <div
                                  key={platform.id}
                                  className={`flex items-center space-x-3 p-3 cursor-pointer ${
                                    activePlatform === platform.id ? 'bg-muted' : 'hover:bg-muted/50'
                                  }`}
                                  onClick={() => setActivePlatform(platform.id)}
                                >
                                  <div className="p-1.5 bg-primary/10 rounded-md">
                                    <Icon className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{platform.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {platform.category === "lms" ? "Learning Management" : 
                                      platform.category === "sis" ? "Student Information" : 
                                      platform.category === "content" ? "Content" : "Communication"}
                                    </p>
                                  </div>
                                  {activePlatform === platform.id && (
                                    <ArrowRight className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                              );
                            })}
                            
                            {connectedPlatforms.length === 0 && (
                              <div className="p-4 text-center">
                                <p className="text-sm text-muted-foreground">No connected platforms</p>
                                <Button 
                                  variant="link" 
                                  className="mt-2 p-0 h-auto"
                                  onClick={() => setActiveTab("integrations")}
                                >
                                  Connect now
                                </Button>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                      <CardFooter className="border-t py-3">
                        <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("integrations")}>
                          <PlusCircle className="h-3 w-3 mr-2" />
                          Add Platform
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                  
                  {/* Sync Options */}
                  <div className="col-span-5 md:col-span-4">
                    {activePlatform ? (
                      <div className="space-y-4">
                        <Card>
                          <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-primary/10 rounded-md">
                                  {(() => {
                                    const platform = availablePlatforms.find(p => p.id === activePlatform);
                                    const Icon = platform ? getIconByName(platform.icon_name) : HelpCircle;
                                    return <Icon className="h-5 w-5 text-primary" />;
                                  })()}
                                </div>
                                <div>
                                  <CardTitle>
                                    {availablePlatforms.find(p => p.id === activePlatform)?.name || 'Platform'} Sync Settings
                                  </CardTitle>
                                  <CardDescription>
                                    Configure what data to sync with {availablePlatforms.find(p => p.id === activePlatform)?.name}
                                  </CardDescription>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                onClick={() => handleSyncPlatform(activePlatform)}
                                disabled={syncingPlatform === activePlatform}
                              >
                                {syncingPlatform === activePlatform ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Syncing...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Sync Now
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {platformSyncOptions.length === 0 ? (
                              <div className="text-center py-8">
                                <HelpCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <h3 className="text-lg font-medium mb-1">No Sync Options Available</h3>
                                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                                  There are no data sync options available for this platform yet.
                                </p>
                              </div>
                            ) : (
                              <div className="divide-y">
                                {platformSyncOptions.map((option) => (
                                  <div key={option.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <h3 className="font-medium">{option.name}</h3>
                                        <Badge variant={option.direction === "import" ? "outline" : option.direction === "export" ? "secondary" : "default"}>
                                          {option.direction === "import" ? (
                                            <DownloadCloud className="h-3 w-3 mr-1" />
                                          ) : option.direction === "export" ? (
                                            <UploadCloud className="h-3 w-3 mr-1" />
                                          ) : (
                                            <RefreshCw className="h-3 w-3 mr-1" />
                                          )}
                                          {option.direction === "import" ? "Import" : option.direction === "export" ? "Export" : "Two-way"}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">{option.description}</p>
                                      {option.last_sync && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Last synced: {formatTimestamp(option.last_sync)}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center ml-auto">
                                      <Switch 
                                        id={`sync-${option.id}`}
                                        checked={option.enabled}
                                        onCheckedChange={() => handleToggleSync(option)}
                                      />
                                      <Label htmlFor={`sync-${option.id}`} className="ml-2">
                                        {option.enabled ? "Enabled" : "Disabled"}
                                      </Label>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Advanced Settings</CardTitle>
                            <CardDescription>
                              Configure advanced synchronization settings
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label>Conflict resolution</Label>
                                  <p className="text-xs text-muted-foreground">
                                    How to handle conflicts between systems
                                  </p>
                                </div>
                                <select className="p-2 border rounded-md">
                                  <option>EdGenie takes precedence</option>
                                  <option>External system takes precedence</option>
                                  <option>Ask on conflict</option>
                                </select>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label>Error handling</Label>
                                  <p className="text-xs text-muted-foreground">
                                    How to handle errors during sync
                                  </p>
                                </div>
                                <select className="p-2 border rounded-md">
                                  <option>Skip and continue</option>
                                  <option>Stop on error</option>
                                  <option>Retry 3 times</option>
                                </select>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label>Notification on error</Label>
                                  <p className="text-xs text-muted-foreground">
                                    Receive notifications for sync errors
                                  </p>
                                </div>
                                <Switch defaultChecked />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
                          <HelpCircle className="h-8 w-8 mb-2 text-muted-foreground" />
                          <h3 className="text-lg font-medium mb-1">Select a Platform</h3>
                          <p className="text-muted-foreground mb-4 max-w-md">
                            Select a connected platform to view and configure data synchronization settings.
                          </p>
                          {connectedPlatforms.length === 0 && (
                            <Button 
                              variant="outline" 
                              onClick={() => setActiveTab("integrations")}
                            >
                              <LinkIcon className="mr-2 h-4 w-4" />
                              Connect a Platform
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
} 