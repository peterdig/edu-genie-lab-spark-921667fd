import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext.jsx";
import { useSupabaseData } from './useSupabaseHook';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

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
  connected: boolean;
  lastSync?: string;
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
    created_at: new Date().toISOString(),
    connected: false
  },
  {
    id: "google-classroom",
    name: "Google Classroom",
    description: "Sync with Google Classroom for seamless assignment management",
    icon_name: "BookOpen",
    category: "lms",
    auth_url: "https://accounts.google.com/o/oauth2/auth",
    api_base_url: "https://classroom.googleapis.com/v1",
    created_at: new Date().toISOString(),
    connected: false
  },
  {
    id: "schoology",
    name: "Schoology",
    description: "Connect to Schoology for course content and assessment integration",
    icon_name: "FileText",
    category: "lms",
    auth_url: "https://app.schoology.com/oauth/authorize",
    api_base_url: "https://api.schoology.com/v1",
    created_at: new Date().toISOString(),
    connected: false
  },
  {
    id: "blackboard",
    name: "Blackboard Learn",
    description: "Integrate with Blackboard for higher education course management",
    icon_name: "Library",
    category: "lms",
    auth_url: "https://blackboard.com/auth",
    api_base_url: "https://blackboard.com/learn/api/public/v1",
    created_at: new Date().toISOString(),
    connected: false
  },
  {
    id: "powerschool",
    name: "PowerSchool SIS",
    description: "Connect to PowerSchool for student information and grade management",
    icon_name: "Globe",
    category: "sis",
    auth_url: "https://powerschool.com/oauth",
    api_base_url: "https://powerschool.com/api/v1",
    created_at: new Date().toISOString(),
    connected: false
  },
  {
    id: "clever",
    name: "Clever",
    description: "Single sign-on and roster sync for K-12 education",
    icon_name: "Lock",
    category: "sis",
    auth_url: "https://clever.com/oauth",
    api_base_url: "https://api.clever.com/v1",
    created_at: new Date().toISOString(),
    connected: false
  },
  {
    id: "khan-academy",
    name: "Khan Academy",
    description: "Import content and learning resources from Khan Academy",
    icon_name: "BookOpen",
    category: "content",
    auth_url: "https://khanacademy.org/auth",
    api_base_url: "https://khanacademy.org/api/v1",
    created_at: new Date().toISOString(),
    connected: false
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

// Types for our integrations
export interface SyncOption {
  id: string;
  platform_id: string;
  name: string;
  description: string;
  direction: 'import' | 'export' | 'two-way';
  enabled: boolean;
  last_sync?: string;
}

export interface SyncStats {
  importedCourses: number;
  importedAssignments: number;
  exportedAssignments: number;
  exportedGrades: number;
  lastFullSync: string;
}

// Mock data for available platforms
const MOCK_PLATFORMS: IntegrationPlatform[] = [
  {
    id: 'canvas',
    name: 'Canvas LMS',
    description: 'Integrate with Canvas to sync courses, assignments, and grades',
    icon_name: 'GraduationCap',
    category: 'lms',
    connected: false
  },
  {
    id: 'google-classroom',
    name: 'Google Classroom',
    description: 'Connect to Google Classroom to import courses and assignments',
    icon_name: 'BookOpen',
    category: 'lms',
    connected: false
  },
  {
    id: 'schoology',
    name: 'Schoology',
    description: 'Sync content and grades with Schoology LMS',
    icon_name: 'FileText',
    category: 'lms',
    connected: false
  },
  {
    id: 'blackboard',
    name: 'Blackboard Learn',
    description: 'Integrate with Blackboard to manage courses and assessments',
    icon_name: 'GraduationCap',
    category: 'lms',
    connected: false
  },
  {
    id: 'clever',
    name: 'Clever',
    description: 'Single sign-on and data sync with Clever for education',
    icon_name: 'Globe',
    category: 'sis',
    connected: false
  },
  {
    id: 'khan-academy',
    name: 'Khan Academy',
    description: 'Import content and track progress from Khan Academy',
    icon_name: 'Library',
    category: 'content',
    connected: false
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Integrate with Teams for classroom collaboration',
    icon_name: 'Globe',
    category: 'communication',
    connected: false
  },
  {
    id: 'quizlet',
    name: 'Quizlet',
    description: 'Import flashcards and study sets from Quizlet',
    icon_name: 'FileText',
    category: 'content',
    connected: false
  }
];

// Default sync options by platform type
const DEFAULT_SYNC_OPTIONS_BY_PLATFORM: Record<string, SyncOption[]> = {
  'canvas': [
    {
      id: 'canvas-courses',
      platform_id: 'canvas',
      name: 'Courses and Sections',
      description: 'Import courses and sections from Canvas',
      direction: 'import',
      enabled: true
    },
    {
      id: 'canvas-assignments',
      platform_id: 'canvas',
      name: 'Assignments and Due Dates',
      description: 'Import assignments, quizzes, and due dates',
      direction: 'import',
      enabled: true
    },
    {
      id: 'canvas-grades',
      platform_id: 'canvas',
      name: 'Grades and Feedback',
      description: 'Export grades and feedback to Canvas',
      direction: 'export',
      enabled: true
    }
  ],
  'google-classroom': [
    {
      id: 'google-courses',
      platform_id: 'google-classroom',
      name: 'Classrooms',
      description: 'Import classrooms from Google Classroom',
      direction: 'import',
      enabled: true
    },
    {
      id: 'google-assignments',
      platform_id: 'google-classroom',
      name: 'Assignments',
      description: 'Import assignments from Google Classroom',
      direction: 'import',
      enabled: true
    },
    {
      id: 'google-attachments',
      platform_id: 'google-classroom',
      name: 'Attachments and Materials',
      description: 'Sync attachments and course materials',
      direction: 'two-way',
      enabled: false
    }
  ],
  'schoology': [
    {
      id: 'schoology-courses',
      platform_id: 'schoology',
      name: 'Courses',
      description: 'Import courses from Schoology',
      direction: 'import',
      enabled: true
    },
    {
      id: 'schoology-materials',
      platform_id: 'schoology',
      name: 'Course Materials',
      description: 'Import course materials and resources',
      direction: 'import',
      enabled: true
    }
  ],
  'blackboard': [
    {
      id: 'blackboard-courses',
      platform_id: 'blackboard',
      name: 'Courses',
      description: 'Import courses from Blackboard',
      direction: 'import',
      enabled: true
    },
    {
      id: 'blackboard-assessments',
      platform_id: 'blackboard',
      name: 'Assessments',
      description: 'Import assessments from Blackboard',
      direction: 'import',
      enabled: true
    }
  ],
  'clever': [
    {
      id: 'clever-roster',
      platform_id: 'clever',
      name: 'Student Roster',
      description: 'Import student roster data from Clever',
      direction: 'import',
      enabled: true
    }
  ],
  'khan-academy': [
    {
      id: 'khan-content',
      platform_id: 'khan-academy',
      name: 'Content',
      description: 'Import Khan Academy content',
      direction: 'import',
      enabled: true
    },
    {
      id: 'khan-progress',
      platform_id: 'khan-academy',
      name: 'Progress Tracking',
      description: 'Track progress in Khan Academy courses',
      direction: 'import',
      enabled: true
    }
  ],
  'microsoft-teams': [
    {
      id: 'teams-classes',
      platform_id: 'microsoft-teams',
      name: 'Teams Classes',
      description: 'Import classes from Microsoft Teams',
      direction: 'import',
      enabled: true
    },
    {
      id: 'teams-assignments',
      platform_id: 'microsoft-teams',
      name: 'Assignments',
      description: 'Sync assignments with Microsoft Teams',
      direction: 'two-way',
      enabled: true
    }
  ],
  'quizlet': [
    {
      id: 'quizlet-sets',
      platform_id: 'quizlet',
      name: 'Study Sets',
      description: 'Import study sets from Quizlet',
      direction: 'import',
      enabled: true
    }
  ]
};

// Initial sync stats
const INITIAL_SYNC_STATS: SyncStats = {
  importedCourses: 0,
  importedAssignments: 0,
  exportedAssignments: 0,
  exportedGrades: 0,
  lastFullSync: ''
};

// Helper to generate a timestamp
const getCurrentTimestamp = () => new Date().toISOString();

// Store data in localStorage
const STORAGE_KEYS = {
  PLATFORMS: 'edgenie-integration-platforms',
  SYNC_OPTIONS: 'edgenie-sync-options',
  SYNC_STATS: 'edgenie-sync-stats',
  CONNECTED_PLATFORMS: 'edgenie-connected-platforms'
};

export function useIntegrations() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  const [platforms, setPlatforms] = useState<IntegrationPlatform[]>([]);
  const [syncOptions, setSyncOptions] = useState<SyncOption[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats>(INITIAL_SYNC_STATS);
  const [connectedPlatformsList, setConnectedPlatformsList] = useState<ConnectedPlatform[]>([]);
  
  // Use Supabase hooks with localStorage fallback
  const { 
    data: platformsData, 
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
    data: syncOptionsData, 
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
  
  // Initialize data from localStorage or defaults
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Load platforms from localStorage or use defaults
        const storedPlatforms = localStorage.getItem(STORAGE_KEYS.PLATFORMS);
        const platformData = storedPlatforms ? JSON.parse(storedPlatforms) : MOCK_PLATFORMS;
        
        // Load sync options from localStorage or use defaults
        const storedSyncOptions = localStorage.getItem(STORAGE_KEYS.SYNC_OPTIONS);
        const syncOptionData = storedSyncOptions ? JSON.parse(storedSyncOptions) : [];
        
        // Load sync stats from localStorage or use defaults
        const storedSyncStats = localStorage.getItem(STORAGE_KEYS.SYNC_STATS);
        const syncStatsData = storedSyncStats ? JSON.parse(storedSyncStats) : INITIAL_SYNC_STATS;
        
        // Load connected platforms from localStorage
        const storedConnectedPlatforms = localStorage.getItem(STORAGE_KEYS.CONNECTED_PLATFORMS);
        const connectedPlatformsData = storedConnectedPlatforms ? JSON.parse(storedConnectedPlatforms) : [];
        
        setPlatforms(platformData);
        setSyncOptions(syncOptionData);
        setSyncStats(syncStatsData);
        setConnectedPlatformsList(connectedPlatformsData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize integrations'));
        console.error('Error initializing integrations:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      initialize();
    }
  }, [isAuthenticated]);
  
  // Get available platforms with connection status - memoize this function
  const getAvailablePlatforms = useCallback(() => {
    if (!platforms) return [];
    
    return platforms.map(platform => {
      // Check against our explicitly managed connected platforms list
      const isConnected = connectedPlatformsList?.some(conn => 
        conn.platform_id === platform.id && conn.is_active
      ) || connectedPlatforms?.some(conn => 
        conn.platform_id === platform.id && conn.is_active
      );
      
      const connected = isConnected ? 
        connectedPlatformsList?.find(conn => conn.platform_id === platform.id) || 
        connectedPlatforms?.find(conn => conn.platform_id === platform.id) : 
        null;
      
      return {
        ...platform,
        connected: !!isConnected,
        lastSync: connected?.last_sync
      };
    });
  }, [platforms, connectedPlatforms, connectedPlatformsList]);
  
  // Get only connected platforms - memoize this function
  const getConnectedPlatforms = useCallback(() => {
    // Merge connected platforms from both sources
    const allConnections = [...(connectedPlatformsList || []), ...(connectedPlatforms || [])]
      .filter((conn, index, self) => 
        // Remove duplicates by ID
        index === self.findIndex(c => c.id === conn.id)
      )
      .filter(conn => conn.is_active);
    
    if (!allConnections.length || !platforms) return [];
    
    return allConnections
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
  }, [connectedPlatforms, platforms, connectedPlatformsList]);
  
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
      
      // Check in both sources for existing connections
      const existingConnection = connectedPlatformsList?.find(
        conn => conn.platform_id === platformId
      ) || connectedPlatforms?.find(
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
        
        // Update in database via hook if available
        let connection = existingConnection;
        if (updateConnectedPlatform) {
          connection = await updateConnectedPlatform(existingConnection.id, updatedConnection);
        }
        
        // Also update in local state
        setConnectedPlatformsList(prevList => {
          const newList = prevList.filter(conn => conn.id !== existingConnection.id);
          return [...newList, updatedConnection];
        });
        
        // Save to localStorage for persistence
        localStorage.setItem(
          STORAGE_KEYS.CONNECTED_PLATFORMS, 
          JSON.stringify([...connectedPlatformsList.filter(conn => conn.id !== existingConnection.id), updatedConnection])
        );
        
        // Sync options might already exist, but still check
        await createDefaultSyncOptions(platformId, now);
        
        // Add success log
        if (addSyncLog) {
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
        }
        
        return connection;
      } else {
        // Create a new connection
        const newConnection: ConnectedPlatform = {
          id: uuidv4(),
          user_id: user.id,
          platform_id: platformId,
          access_token: `mock-token-${platformId}-${Date.now()}`,
          refresh_token: `mock-refresh-${platformId}-${Date.now()}`,
          token_expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
          is_active: true,
          last_sync: now,
          created_at: now
        };
        
        console.log("Creating new platform connection:", newConnection);
        
        // Add connection to database if hook is available
        let connection = newConnection;
        if (addConnectedPlatform) {
          connection = await addConnectedPlatform(newConnection);
        }
        
        // Also update in local state
        setConnectedPlatformsList(prevList => [...prevList, newConnection]);
        
        // Save to localStorage for persistence
        localStorage.setItem(
          STORAGE_KEYS.CONNECTED_PLATFORMS, 
          JSON.stringify([...connectedPlatformsList, newConnection])
        );
        
        // Create default sync options
        await createDefaultSyncOptions(platformId, now);
        
        // Add success log if hook available
        if (addSyncLog) {
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
        }
        
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
      const syncOptionTemplates = DEFAULT_SYNC_OPTIONS_BY_PLATFORM[platformId] || [];
      
      // Array to collect new options for state update
      const newOptions: SyncOption[] = [];
      
      if (syncOptionTemplates.length > 0) {
        // Add these templates with new IDs
        for (const template of syncOptionTemplates) {
          await new Promise(resolve => setTimeout(resolve, 0)); // Prevent blocking
          try {
            const newOption = {
              ...template,
              id: `${platformId}-${template.data_type || 'option'}-${Date.now()}`,
              last_sync: undefined
            };
            
            // Update in database if hook available
            if (updateSyncOption) {
              await updateSyncOption(newOption.id, newOption);
            }
            
            // Collect for state update
            newOptions.push(newOption);
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
            direction: "two-way" as const,
            enabled: true,
            platform_id: platformId,
            data_type: "assignments" as const,
            created_at: now
          }
        ];
        
        for (const option of defaultOptions) {
          await new Promise(resolve => setTimeout(resolve, 0)); // Prevent blocking
          try {
            // Update in database if hook available
            if (updateSyncOption) {
              await updateSyncOption(option.id, option);
            }
            
            // Collect for state update
            newOptions.push(option);
          } catch (e) {
            console.warn("Error creating sync option:", e);
          }
        }
      }
      
      // Update local state with new options
      setSyncOptions(prev => [...prev, ...newOptions]);
      
      // Update localStorage
      localStorage.setItem(
        STORAGE_KEYS.SYNC_OPTIONS, 
        JSON.stringify([...syncOptions, ...newOptions])
      );
    }
  };
  
  // Disconnect from a platform
  const disconnectPlatform = async (platformId: string) => {
    try {
      // Find the connection in both sources
      const connection = connectedPlatformsList?.find(
        conn => conn.platform_id === platformId && conn.is_active
      ) || connectedPlatforms?.find(
        conn => conn.platform_id === platformId && conn.is_active
      );
      
      if (!connection) {
        console.warn("No active connection found for platform:", platformId);
        return true; // Already disconnected
      }
      
      console.log("Disconnecting platform:", platformId, "connection:", connection.id);
      
      // Update connection to inactive
      const updatedConnection = {
        ...connection,
        is_active: false
      };
      
      // Update in database if hook available
      if (updateConnectedPlatform) {
        await updateConnectedPlatform(connection.id, updatedConnection);
      }
      
      // Update in local state
      setConnectedPlatformsList(prevList => 
        prevList.map(conn => 
          conn.id === connection.id ? updatedConnection : conn
        )
      );
      
      // Update localStorage
      localStorage.setItem(
        STORAGE_KEYS.CONNECTED_PLATFORMS,
        JSON.stringify(connectedPlatformsList.map(conn => 
          conn.id === connection.id ? updatedConnection : conn
        ))
      );
      
      // Add a sync log entry for disconnection if hook available
      if (addSyncLog) {
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
      }
      
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
      
      // Create updated option
      const updatedOption = {
        ...option,
        enabled,
        last_sync: enabled ? option.last_sync : undefined // Clear last sync if disabling
      };
      
      // Update in database if hook available
      if (updateSyncOption) {
        await updateSyncOption(syncOptionId, updatedOption);
      }
      
      // Update in local state
      setSyncOptions(prevOptions => 
        prevOptions.map(opt => 
          opt.id === syncOptionId ? updatedOption : opt
        )
      );
      
      // Update localStorage
      localStorage.setItem(
        STORAGE_KEYS.SYNC_OPTIONS,
        JSON.stringify(syncOptions.map(opt => 
          opt.id === syncOptionId ? updatedOption : opt
        ))
      );
      
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
      // Find the connection in both sources
      const connection = connectedPlatformsList?.find(
        conn => conn.platform_id === platformId && conn.is_active
      ) || connectedPlatforms?.find(
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
      
      // Simulate successful sync
      const now = new Date().toISOString();
      
      // Update connection's last sync time
      const updatedConnection = {
        ...connection,
        last_sync: now
      };
      
      // Update in database if hook available
      if (updateConnectedPlatform) {
        await updateConnectedPlatform(connection.id, updatedConnection);
      }
      
      // Update in local state
      setConnectedPlatformsList(prevList => 
        prevList.map(conn => 
          conn.id === connection.id ? updatedConnection : conn
        )
      );
      
      // Update localStorage
      localStorage.setItem(
        STORAGE_KEYS.CONNECTED_PLATFORMS,
        JSON.stringify(connectedPlatformsList.map(conn => 
          conn.id === connection.id ? updatedConnection : conn
        ))
      );
      
      // Process sync options
      const updatedOptions: SyncOption[] = [];
      
      // Update each sync option and create log entries
      await Promise.all(syncFilter.map(async (option) => {
        const updatedOption = {
          ...option,
          last_sync: now
        };
        
        // Update in database if hook available
        if (updateSyncOption) {
          await updateSyncOption(option.id, updatedOption);
        }
        
        // Collect updated option
        updatedOptions.push(updatedOption);
        
        // Add a sync log entry if hook available
        if (addSyncLog) {
          return addSyncLog({
            id: uuidv4(),
            user_id: connection.user_id,
            platform_id: platformId,
            data_type: option.data_type,
            direction: option.direction === 'two-way' ? 'both' : option.direction,
            status: "success",
            items_processed: Math.floor(Math.random() * 100) + 1,
            items_succeeded: Math.floor(Math.random() * 100) + 1,
            items_failed: 0,
            created_at: now
          });
        }
      }));
      
      // Update options in local state
      setSyncOptions(prevOptions => {
        const newOptions = [...prevOptions];
        
        // Replace updated options
        updatedOptions.forEach(updatedOption => {
          const index = newOptions.findIndex(opt => opt.id === updatedOption.id);
          if (index !== -1) {
            newOptions[index] = updatedOption;
          }
        });
        
        return newOptions;
      });
      
      // Update options in localStorage
      localStorage.setItem(
        STORAGE_KEYS.SYNC_OPTIONS,
        JSON.stringify(syncOptions.map(opt => {
          const updated = updatedOptions.find(u => u.id === opt.id);
          return updated || opt;
        }))
      );
      
      // Update sync stats
      const newSyncStats = {
        ...syncStats,
        lastFullSync: now,
        // Update counts based on the sync operations
        importedCourses: syncStats.importedCourses + (
          syncFilter.some(opt => opt.data_type === 'courses' && 
            (opt.direction === 'import' || opt.direction === 'two-way')) ? 
            Math.floor(Math.random() * 5) + 1 : 0
        ),
        importedAssignments: syncStats.importedAssignments + (
          syncFilter.some(opt => opt.data_type === 'assignments' && 
            (opt.direction === 'import' || opt.direction === 'two-way')) ? 
            Math.floor(Math.random() * 10) + 1 : 0
        ),
        exportedAssignments: syncStats.exportedAssignments + (
          syncFilter.some(opt => opt.data_type === 'assignments' && 
            (opt.direction === 'export' || opt.direction === 'two-way')) ? 
            Math.floor(Math.random() * 8) + 1 : 0
        ),
        exportedGrades: syncStats.exportedGrades + (
          syncFilter.some(opt => opt.data_type === 'grades' && 
            (opt.direction === 'export' || opt.direction === 'two-way')) ? 
            Math.floor(Math.random() * 15) + 1 : 0
        ),
      };
      
      setSyncStats(newSyncStats);
      
      // Update localStorage
      localStorage.setItem(
        STORAGE_KEYS.SYNC_STATS,
        JSON.stringify(newSyncStats)
      );
      
      return true;
    } catch (err) {
      console.error("Error syncing data:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Add error log
      try {
        if (addSyncLog) {
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
        }
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
    try {
      // First get from local state if available
      if (syncStats.lastFullSync) {
        return syncStats;
      }
      
      // Otherwise try localStorage
      const storedStats = localStorage.getItem(STORAGE_KEYS.SYNC_STATS);
      if (storedStats) {
        const parsedStats = JSON.parse(storedStats);
        // Update state while we're at it
        setSyncStats(parsedStats);
        return parsedStats;
      }
      
      // If we have connection data but no stats, calculate basic stats
      if (connectedPlatformsList.length > 0 || (connectedPlatforms && connectedPlatforms.length > 0)) {
        // Get the most recent sync time from any platform
        const allConnections = [...(connectedPlatformsList || []), ...(connectedPlatforms || [])];
        const lastSyncTimes = allConnections
          .filter(conn => conn.is_active && conn.last_sync)
          .map(conn => new Date(conn.last_sync).getTime());
        
        const lastSync = lastSyncTimes.length > 0 
          ? new Date(Math.max(...lastSyncTimes)).toISOString()
          : new Date().toISOString();
        
        // Create some basic stats based on connected platforms
        const newStats = {
          importedCourses: Math.floor(Math.random() * 10) + allConnections.length * 2,
          importedAssignments: Math.floor(Math.random() * 25) + allConnections.length * 5,
          exportedAssignments: Math.floor(Math.random() * 15) + allConnections.length * 3,
          exportedGrades: Math.floor(Math.random() * 30) + allConnections.length * 4,
          lastFullSync: lastSync
        };
        
        // Save to state and localStorage
        setSyncStats(newStats);
        localStorage.setItem(STORAGE_KEYS.SYNC_STATS, JSON.stringify(newStats));
        
        return newStats;
      }
      
      // Fall back to empty stats
      return INITIAL_SYNC_STATS;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get sync stats'));
      console.error('Error getting sync stats:', err);
      return INITIAL_SYNC_STATS;
    }
  }, [syncStats, connectedPlatforms, connectedPlatformsList]);
  
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