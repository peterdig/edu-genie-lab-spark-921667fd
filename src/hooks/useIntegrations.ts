import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext.jsx";
import { useSupabaseData } from './useSupabaseHook';
import { v4 as uuidv4 } from 'uuid';

// Integration platform types
export interface IntegrationPlatform {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  category: "lms" | "content" | "assessment" | "communication" | "sis";
  auth_url: string;
  api_base_url: string;
  created_at: string;
}

// Connected platform types
export interface ConnectedPlatform {
  id: string;
  user_id: string;
  platform_id: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  is_active: boolean;
  last_sync: string;
  created_at: string;
}

// Data sync types
export interface DataSyncOption {
  id: string;
  name: string;
  description: string;
  direction: "import" | "export" | "both";
  enabled: boolean;
  platform_id: string;
  data_type: "courses" | "students" | "assignments" | "grades" | "resources";
  last_sync?: string;
  created_at: string;
}

export interface SyncLog {
  id: string;
  user_id: string;
  platform_id: string;
  data_type: string;
  direction: "import" | "export";
  status: "success" | "error" | "partial";
  items_processed: number;
  items_succeeded: number;
  items_failed: number;
  error_message?: string;
  created_at: string;
}

// Sample default platforms data
const DEFAULT_PLATFORMS: IntegrationPlatform[] = [
  {
    id: "canvas",
    name: "Canvas LMS",
    description: "Connect to Canvas to sync courses, assignments, and grades",
    icon_name: "GraduationCap",
    category: "lms",
    auth_url: "https://canvas.instructure.com/oauth2/authorize",
    api_base_url: "https://canvas.instructure.com/api/v1",
    created_at: new Date().toISOString()
  },
  {
    id: "google-classroom",
    name: "Google Classroom",
    description: "Sync with Google Classroom for seamless assignment management",
    icon_name: "BookOpen",
    category: "lms",
    auth_url: "https://accounts.google.com/o/oauth2/auth",
    api_base_url: "https://classroom.googleapis.com/v1",
    created_at: new Date().toISOString()
  },
  {
    id: "schoology",
    name: "Schoology",
    description: "Connect to Schoology for course content and assessment integration",
    icon_name: "FileText",
    category: "lms",
    auth_url: "https://app.schoology.com/oauth/authorize",
    api_base_url: "https://api.schoology.com/v1",
    created_at: new Date().toISOString()
  },
  {
    id: "blackboard",
    name: "Blackboard Learn",
    description: "Integrate with Blackboard for higher education course management",
    icon_name: "Library",
    category: "lms",
    auth_url: "https://blackboard.com/auth",
    api_base_url: "https://blackboard.com/learn/api/public/v1",
    created_at: new Date().toISOString()
  },
  {
    id: "powerschool",
    name: "PowerSchool SIS",
    description: "Connect to PowerSchool for student information and grade management",
    icon_name: "Globe",
    category: "sis",
    auth_url: "https://powerschool.com/oauth",
    api_base_url: "https://powerschool.com/api/v1",
    created_at: new Date().toISOString()
  },
  {
    id: "clever",
    name: "Clever",
    description: "Single sign-on and roster sync for K-12 education",
    icon_name: "Lock",
    category: "sis",
    auth_url: "https://clever.com/oauth",
    api_base_url: "https://api.clever.com/v1",
    created_at: new Date().toISOString()
  },
  {
    id: "khan-academy",
    name: "Khan Academy",
    description: "Import content and learning resources from Khan Academy",
    icon_name: "BookOpen",
    category: "content",
    auth_url: "https://khanacademy.org/auth",
    api_base_url: "https://khanacademy.org/api/v1",
    created_at: new Date().toISOString()
  }
];

// Sample default sync options
const DEFAULT_SYNC_OPTIONS: DataSyncOption[] = [
  {
    id: "canvas-courses",
    name: "Course Structure",
    description: "Sync course modules, sections and basic structure",
    direction: "import",
    enabled: true,
    platform_id: "canvas",
    data_type: "courses",
    last_sync: new Date(Date.now() - 3600000 * 3).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: "canvas-assignments",
    name: "Assignments",
    description: "Sync assignments, due dates and instructions",
    direction: "both",
    enabled: true,
    platform_id: "canvas",
    data_type: "assignments",
    last_sync: new Date(Date.now() - 3600000 * 3).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: "canvas-grades",
    name: "Grades",
    description: "Export grades from EdGenie to Canvas",
    direction: "export",
    enabled: false,
    platform_id: "canvas",
    data_type: "grades",
    created_at: new Date().toISOString()
  },
  {
    id: "google-classroom-courses",
    name: "Classes & Courses",
    description: "Import Google Classroom course structure",
    direction: "import",
    enabled: true,
    platform_id: "google-classroom",
    data_type: "courses",
    last_sync: new Date(Date.now() - 3600000 * 24).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: "google-classroom-assignments",
    name: "Assignments",
    description: "Two-way sync of assignments with Google Classroom",
    direction: "both",
    enabled: true,
    platform_id: "google-classroom",
    data_type: "assignments",
    last_sync: new Date(Date.now() - 3600000 * 24).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: "google-classroom-students",
    name: "Student Roster",
    description: "Import students from Google Classroom",
    direction: "import",
    enabled: true,
    platform_id: "google-classroom",
    data_type: "students",
    last_sync: new Date(Date.now() - 3600000 * 48).toISOString(),
    created_at: new Date().toISOString()
  }
];

export function useIntegrations() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  // Use Supabase hooks with localStorage fallback
  const { 
    data: platforms, 
    loading: platformsLoading 
  } = useSupabaseData<IntegrationPlatform>(
    'integration_platforms', 
    'edgenie_integration_platforms', 
    DEFAULT_PLATFORMS, 
    true
  );
  
  const { 
    data: connectedPlatforms, 
    loading: connectionsLoading, 
    addItem: addConnectedPlatform,
    updateItem: updateConnectedPlatform,
    deleteItem: deleteConnectedPlatform,
    queryByField: queryConnectedPlatforms
  } = useSupabaseData<ConnectedPlatform>(
    'connected_platforms', 
    'edgenie_connected_platforms', 
    [], 
    true
  );
  
  const { 
    data: syncOptions, 
    loading: syncOptionsLoading, 
    updateItem: updateSyncOption,
    queryByField: querySyncOptions
  } = useSupabaseData<DataSyncOption>(
    'data_sync_options', 
    'edgenie_data_sync_options', 
    DEFAULT_SYNC_OPTIONS, 
    true
  );
  
  const { 
    data: syncLogs, 
    loading: syncLogsLoading, 
    addItem: addSyncLog,
    queryByField: querySyncLogs
  } = useSupabaseData<SyncLog>(
    'sync_logs', 
    'edgenie_sync_logs', 
    [], 
    true
  );
  
  // Combine loading states
  useEffect(() => {
    const allDataLoaded = !platformsLoading && !connectionsLoading && !syncOptionsLoading && !syncLogsLoading;
    
    if (allDataLoaded) {
      setInitialized(true);
      setLoading(false); // Remove artificial delay
    } else {
      setLoading(true);
    }
  }, [platformsLoading, connectionsLoading, syncOptionsLoading, syncLogsLoading]);
  
  // Get available platforms with connection status - memoize this function
  const getAvailablePlatforms = useCallback(() => {
    if (!platforms) return [];
    
    return platforms.map(platform => {
      const isConnected = connectedPlatforms?.some(conn => conn.platform_id === platform.id && conn.is_active);
      const connected = isConnected ? 
        connectedPlatforms?.find(conn => conn.platform_id === platform.id) : 
        null;
      
      return {
        ...platform,
        connected: !!isConnected,
        lastSync: connected?.last_sync
      };
    });
  }, [platforms, connectedPlatforms]);
  
  // Get only connected platforms - memoize this function
  const getConnectedPlatforms = useCallback(() => {
    if (!connectedPlatforms || !platforms) return [];
    
    return connectedPlatforms
      .filter(conn => conn.is_active)
      .map(conn => {
        const platform = platforms.find(p => p.id === conn.platform_id);
        if (!platform) return null;
        
        return {
          ...platform,
          connectionId: conn.id,
          lastSync: conn.last_sync
        };
      })
      .filter(Boolean) as (IntegrationPlatform & { connectionId: string, lastSync: string })[];
  }, [connectedPlatforms, platforms]);
  
  // Get sync options for a specific platform - memoize this function
  const getPlatformSyncOptions = useCallback((platformId: string) => {
    if (!syncOptions) return [];
    
    return syncOptions.filter(option => option.platform_id === platformId);
  }, [syncOptions]);
  
  // Connect to a platform (in a real app, this would redirect to OAuth)
  const connectPlatform = async (platformId: string) => {
    if (!user || !isAuthenticated) {
      throw new Error("You must be authenticated to connect a platform");
    }
    
    try {
      // Find the platform
      const platform = platforms?.find(p => p.id === platformId);
      if (!platform) {
        throw new Error("Platform not found");
      }
      
      // In a real implementation:
      // 1. Redirect to authorization URL
      // 2. Handle callback with auth code
      // 3. Exchange auth code for tokens
      // 4. Store tokens
      
      // For now, simulate a successful connection
      const now = new Date().toISOString();
      
      // Check if there's already an inactive connection for this platform
      const existingConnection = connectedPlatforms?.find(
        conn => conn.platform_id === platformId
      );
      
      if (existingConnection) {
        console.log("Found existing connection, reactivating:", existingConnection);
        
        // Reactivate the existing connection
        const updatedConnection = {
          ...existingConnection,
          is_active: true,
          access_token: `mock-token-${platformId}-${Date.now()}`,
          refresh_token: `mock-refresh-${platformId}-${Date.now()}`,
          token_expires_at: new Date(Date.now() + 3600000).toISOString(),
          last_sync: now
        };
        
        const connection = await updateConnectedPlatform(existingConnection.id, updatedConnection);
        
        if (!connection) {
          throw new Error("Failed to reactivate connection");
        }
        
        // Sync options might already exist, but still check
        await createDefaultSyncOptions(platformId, now);
        
        // Add success log
        await addSyncLog({
          id: uuidv4(),
          user_id: user.id,
          platform_id: platformId,
          data_type: "connection",
          direction: "import",
          status: "success",
          items_processed: 1,
          items_succeeded: 1,
          items_failed: 0,
          created_at: now
        });
        
        return connection;
      } else {
        // Create a new connection
        const newConnection: Omit<ConnectedPlatform, 'id' | 'created_at'> = {
          user_id: user.id,
          platform_id: platformId,
          access_token: `mock-token-${platformId}-${Date.now()}`,
          refresh_token: `mock-refresh-${platformId}-${Date.now()}`,
          token_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
          is_active: true,
          last_sync: now
        };
        
        console.log("Creating new platform connection:", newConnection);
        
        // Add connection
        const connection = await addConnectedPlatform(newConnection);
        
        if (!connection) {
          throw new Error("Failed to store connection");
        }
        
        // Create default sync options
        await createDefaultSyncOptions(platformId, now);
        
        // Add success log
        await addSyncLog({
          id: uuidv4(),
          user_id: user.id,
          platform_id: platformId,
          data_type: "connection",
          direction: "import",
          status: "success",
          items_processed: 1,
          items_succeeded: 1,
          items_failed: 0,
          created_at: now
        });
        
        return connection;
      }
    } catch (err) {
      console.error("Error connecting to platform:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  };
  
  // Helper function to create default sync options for a platform
  const createDefaultSyncOptions = async (platformId: string, now: string) => {
    // If this platform doesn't have sync options yet, create defaults
    const existingSyncOptions = syncOptions.filter(option => option.platform_id === platformId);
    
    if (existingSyncOptions.length === 0) {
      console.log("Creating default sync options for", platformId);
      
      // Create some default sync options based on platform category
      const syncOptionTemplates = DEFAULT_SYNC_OPTIONS.filter(
        option => option.platform_id === platformId
      );
      
      if (syncOptionTemplates.length > 0) {
        // Add these templates with new IDs
        for (const template of syncOptionTemplates) {
          await new Promise(resolve => setTimeout(resolve, 0)); // Prevent blocking
          try {
            const newOption = {
              ...template,
              id: `${platformId}-${template.data_type}-${Date.now()}`,
            };
            await updateSyncOption(newOption.id, newOption);
          } catch (e) {
            console.warn("Error creating sync option:", e);
          }
        }
      } else {
        // Create generic options if no templates exist
        const defaultOptions = [
          {
            id: `${platformId}-courses-${Date.now()}`,
            name: "Course Structure",
            description: "Import course information",
            direction: "import" as const,
            enabled: true,
            platform_id: platformId,
            data_type: "courses" as const,
            created_at: now
          },
          {
            id: `${platformId}-assignments-${Date.now()}`,
            name: "Assignments",
            description: "Two-way sync of assignments",
            direction: "both" as const,
            enabled: true,
            platform_id: platformId,
            data_type: "assignments" as const,
            created_at: now
          }
        ];
        
        for (const option of defaultOptions) {
          await new Promise(resolve => setTimeout(resolve, 0)); // Prevent blocking
          try {
            await updateSyncOption(option.id, option);
          } catch (e) {
            console.warn("Error creating sync option:", e);
          }
        }
      }
    }
  };
  
  // Disconnect from a platform
  const disconnectPlatform = async (platformId: string) => {
    try {
      // Find the connection
      const connection = connectedPlatforms?.find(
        conn => conn.platform_id === platformId && conn.is_active
      );
      
      if (!connection) {
        console.warn("No active connection found for platform:", platformId);
        return true; // Already disconnected
      }
      
      console.log("Disconnecting platform:", platformId, "connection:", connection.id);
      
      // In a real implementation:
      // 1. Revoke tokens with the platform's API
      // 2. Delete or mark connection as inactive
      
      // For now, mark it as inactive instead of deleting
      await updateConnectedPlatform(connection.id, {
        ...connection,
        is_active: false
      });
      
      // Add a sync log entry for disconnection
      await addSyncLog({
        id: uuidv4(),
        user_id: connection.user_id,
        platform_id: platformId,
        data_type: "connection", 
        direction: "export", // Technically not importing/exporting data
        status: "success",
        items_processed: 1,
        items_succeeded: 1,
        items_failed: 0,
        created_at: new Date().toISOString()
      });
      
      return true;
    } catch (err) {
      console.error("Error disconnecting from platform:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  };
  
  // Toggle a sync option on/off
  const toggleSyncOption = async (syncOptionId: string, enabled: boolean) => {
    try {
      // Find the sync option
      const option = syncOptions?.find(opt => opt.id === syncOptionId);
      
      if (!option) {
        throw new Error("Sync option not found");
      }
      
      console.log(`Toggling sync option ${syncOptionId} to ${enabled}`);
      
      // Update the option
      await updateSyncOption(syncOptionId, {
        ...option,
        enabled,
        last_sync: enabled ? option.last_sync : undefined // Clear last sync if disabling
      });
      
      return true;
    } catch (err) {
      console.error("Error toggling sync option:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  };
  
  // Sync data with a platform
  const syncData = async (platformId: string, dataType?: string) => {
    try {
      // Find the connection
      const connection = connectedPlatforms?.find(
        conn => conn.platform_id === platformId && conn.is_active
      );
      
      if (!connection) {
        throw new Error("No active connection found for platform");
      }
      
      // Get platform details
      const platform = platforms?.find(p => p.id === platformId);
      if (!platform) {
        throw new Error("Platform not found");
      }
      
      // Get enabled sync options for this platform
      let syncFilter = syncOptions?.filter(
        opt => opt.platform_id === platformId && opt.enabled
      );
      
      // Filter by data type if specified
      if (dataType) {
        syncFilter = syncFilter?.filter(opt => opt.data_type === dataType);
      }
      
      if (!syncFilter || syncFilter.length === 0) {
        console.warn("No enabled sync options found for platform:", platformId);
        return false;
      }
      
      // Remove artificial delay - in a real app, this would be an actual API call
      // that naturally takes time, no need to simulate
      
      // Simulate successful sync
      const now = new Date().toISOString();
      
      // Update connection's last sync time
      await updateConnectedPlatform(connection.id, {
        ...connection,
        last_sync: now
      });
      
      // Process sync options in parallel instead of sequentially
      await Promise.all(syncFilter.map(async (option) => {
        await updateSyncOption(option.id, {
          ...option,
          last_sync: now
        });
        
        // Add a sync log entry
        return addSyncLog({
          id: uuidv4(),
          user_id: connection.user_id,
          platform_id: platformId,
          data_type: option.data_type,
          direction: option.direction,
          status: "success",
          items_processed: Math.floor(Math.random() * 100) + 1,
          items_succeeded: Math.floor(Math.random() * 100) + 1,
          items_failed: 0,
          created_at: now
        });
      }));
      
      return true;
    } catch (err) {
      console.error("Error syncing data:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Add error log
      try {
        await addSyncLog({
          id: uuidv4(),
          user_id: user?.id || "unknown",
          platform_id: platformId,
          data_type: dataType || "all",
          direction: "both",
          status: "error",
          items_processed: 0,
          items_succeeded: 0,
          items_failed: 1,
          error_message: err instanceof Error ? err.message : String(err),
          created_at: new Date().toISOString()
        });
      } catch (logErr) {
        console.error("Failed to log sync error:", logErr);
      }
      
      return false;
    }
  };
  
  // Get sync logs for a platform
  const getPlatformSyncLogs = async (platformId: string, limit = 10) => {
    try {
      // Try Supabase first
      try {
        const { data, error } = await supabase
          .from('sync_logs')
          .select('*')
          .eq('platform_id', platformId)
          .order('created_at', { ascending: false })
          .limit(limit);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          return data as SyncLog[];
        }
      } catch (err) {
        console.error("Error fetching sync logs from Supabase:", err);
      }
      
      // Fall back to local storage
      const localLogs = await querySyncLogs('platform_id', platformId);
      
      if (localLogs && localLogs.length > 0) {
        return localLogs.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, limit);
      }
      
      // No logs found
      return [];
    } catch (err) {
      console.error("Error getting platform sync logs:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return [];
    }
  };
  
  // Memoize getSyncStats for better performance
  const getSyncStats = useCallback(async () => {
    // This would normally be calculated from real data in the database
    // For now, return mock stats
    
    // Get actual sync logs if available
    const allLogs = syncLogs || [];
    
    // Fall back to mock data if no logs available
    return {
      importedCourses: allLogs.filter(log => 
        log.data_type === 'courses' && log.direction === 'import' && log.status === 'success'
      ).reduce((sum, log) => sum + log.items_succeeded, 0) || 12,
      
      importedAssignments: allLogs.filter(log => 
        log.data_type === 'assignments' && log.direction === 'import' && log.status === 'success'
      ).reduce((sum, log) => sum + log.items_succeeded, 0) || 42,
      
      exportedAssignments: allLogs.filter(log => 
        log.data_type === 'assignments' && log.direction === 'export' && log.status === 'success'
      ).reduce((sum, log) => sum + log.items_succeeded, 0) || 18,
      
      exportedGrades: allLogs.filter(log => 
        log.data_type === 'grades' && log.direction === 'export' && log.status === 'success'
      ).reduce((sum, log) => sum + log.items_succeeded, 0) || 87,
      
      lastFullSync: connectedPlatforms && connectedPlatforms.length > 0 
        ? connectedPlatforms.sort((a, b) => 
            new Date(b.last_sync).getTime() - new Date(a.last_sync).getTime()
          )[0]?.last_sync
        : new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
    };
  }, [syncLogs, connectedPlatforms]);
  
  return {
    platforms,
    connectedPlatforms,
    syncOptions,
    syncLogs,
    loading,
    error,
    getAvailablePlatforms,
    getConnectedPlatforms,
    getPlatformSyncOptions,
    connectPlatform,
    disconnectPlatform,
    toggleSyncOption,
    syncData,
    getPlatformSyncLogs,
    getSyncStats
  };
} 