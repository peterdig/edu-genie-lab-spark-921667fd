import { createClient } from '@supabase/supabase-js';

// Define types for the tables we'll be using
export type Profile = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  role: 'teacher' | 'admin' | 'student';
  preferences: Record<string, any>;
  created_at: string;
};

export type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
};

export type Team = {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
};

export type SharedResource = {
  id: string;
  resource_id: string;
  resource_type: 'lesson' | 'assessment' | 'template' | 'rubric';
  shared_by: string;
  shared_with: string;
  permission: 'view' | 'edit';
  created_at: string;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  content: {
    sections: Array<{
      title: string;
      content: string;
      placeholder: string;
    }>;
    settings?: Record<string, any>;
  };
  category: string;
  tags: string[];
  created_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type Analytics = {
  id: string;
  user_id: string;
  content_id: string;
  content_type: string;
  action: string;
  metadata: Record<string, any>;
  created_at: string;
};

export type AccessibilitySetting = {
  id: string;
  user_id: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
};

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const hasUrl = supabaseUrl !== undefined && 
    supabaseUrl !== 'https://your-supabase-project-url.supabase.co' &&
    supabaseUrl !== '';
    
  const hasKey = supabaseAnonKey !== undefined && 
    supabaseAnonKey !== 'your-supabase-anon-key' &&
    supabaseAnonKey !== '';
    
  const isConfigured = hasUrl && hasKey;
  
  if (!hasUrl) {
    console.warn('Supabase URL not configured in environment variables');
  }
  
  if (!hasKey) {
    console.warn('Supabase Anon Key not configured in environment variables');
  }
  
  return isConfigured;
};

// Create a mock client that will gracefully fail
const createMockClient = () => {
  console.warn('Using mock Supabase client with localStorage fallback');
  
  // Create a mock realtime channel that doesn't throw errors
  const createMockChannel = (name: string) => {
    const mockChannel = {
      on: (event: string, filter: any, callback: Function) => {
        console.log(`Mock subscription to ${name} registered for ${event}`);
        return mockChannel;
      },
      subscribe: () => {
        console.log(`Mock subscription to ${name} activated`);
        return mockChannel;
      },
      unsubscribe: () => {
        console.log(`Mock subscription to ${name} removed`);
      }
    };
    return mockChannel;
  };
  
  // Create a mock client that returns empty data but doesn't throw network errors
  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: { message: 'Using mock client' } }),
      update: () => Promise.resolve({ data: [], error: { message: 'Using mock client' } }),
      delete: () => Promise.resolve({ data: null, error: { message: 'Using mock client' } }),
      eq: () => ({ select: () => Promise.resolve({ data: [], error: null }) })
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signIn: () => Promise.resolve({ data: null, error: { message: 'Using mock client' } }),
      signInWithPassword: (credentials: { email: string; password: string }) => {
        // Check localStorage for offline mode
        try {
          const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
          const user = localUsers.find((u: any) => 
            u.email === credentials.email && u.password === credentials.password
          );
          
          if (user) {
            const { password, ...safeUser } = user;
            localStorage.setItem('user', JSON.stringify(safeUser));
            return Promise.resolve({ 
              data: { 
                user: safeUser,
                session: {
                  access_token: 'mock_token',
                  expires_in: 3600,
                  refresh_token: 'mock_refresh',
                  token_type: 'bearer',
                  user: safeUser
                }
              }, 
              error: null 
            });
          }
        } catch (e) {
          console.warn('Error checking localStorage:', e);
        }
        
        return Promise.resolve({ 
          data: null, 
          error: { message: 'Invalid login credentials' } 
        });
      },
      signOut: () => Promise.resolve({ error: null }),
      signInWithOAuth: () => Promise.resolve({ data: null, error: { message: 'Using mock client' } }),
      onAuthStateChange: () => {
        return { data: { subscription: { unsubscribe: () => {} } }, error: null };
      }
    },
    channel: (name: string) => createMockChannel(name)
  };
};

// Add a function to check network connectivity to Supabase
export const checkConnectivity = async (): Promise<boolean> => {
  try {
    // Try to fetch a simple response from Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
      },
      // Short timeout to fail fast if server is unreachable
      signal: AbortSignal.timeout(3000),
    });
    
    return response.ok;
  } catch (error) {
    console.warn('Connectivity check failed:', error);
    return false;
  }
};

// Create a single supabase client for interacting with the database
const createSupabaseClient = () => {
  try {
    if (!isSupabaseConfigured()) {
      return createMockClient();
    }
    
    console.log('Initializing Supabase client with provided credentials');
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: window.localStorage,
        storageKey: 'supabase.auth.token',
        debug: process.env.NODE_ENV === 'development'
      },
    });
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return createMockClient();
  }
};

export const supabase = createSupabaseClient();

// Fallback to localStorage if Supabase is not configured
export const useLocalStorageFallback = () => {
  return !isSupabaseConfigured();
};