import { supabase } from "./supabase";

// Global cache for table existence checks to prevent repeated queries
const TABLE_EXISTENCE_CACHE: Record<string, boolean> = {};
const CACHE_TIMESTAMP: Record<string, number> = {};
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache TTL

/**
 * Efficiently checks if required tables exist in the database
 * Uses caching to minimize queries
 */
export async function checkTablesExist(): Promise<Record<string, boolean>> {
  const requiredTables = [
    'collaborative_documents',
    'document_history',
    'document_messages',
    'document_collaborators'
  ];
  
  // Check if we have fresh cached results for all tables
  const now = Date.now();
  const allCached = requiredTables.every(
    table => TABLE_EXISTENCE_CACHE[table] !== undefined && 
    now - (CACHE_TIMESTAMP[table] || 0) < CACHE_TTL
  );
  
  if (allCached) {
    // Return cached results if they're fresh
    return requiredTables.reduce((acc, table) => {
      acc[table] = TABLE_EXISTENCE_CACHE[table];
      return acc;
    }, {} as Record<string, boolean>);
  }
  
  try {
    // Query Supabase for information schema
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      // For 42P01 error (relation does not exist), try direct table existence check
      if (error.code === '42P01') {
        console.warn('Using alternative method to check table existence');
        
        // Check each table directly
        const results: Record<string, boolean> = {};
        
        for (const table of requiredTables) {
          try {
            // Try to query single row to check if table exists
            const { error: tableError } = await supabase
              .from(table)
              .select('*', { count: 'exact', head: true })
              .limit(1);
              
            // Table exists if no 42P01 error
            const exists = !tableError || tableError.code !== '42P01';
            results[table] = exists;
            TABLE_EXISTENCE_CACHE[table] = exists;
            CACHE_TIMESTAMP[table] = now;
          } catch (e) {
            results[table] = false;
            TABLE_EXISTENCE_CACHE[table] = false;
            CACHE_TIMESTAMP[table] = now;
          }
        }
        
        return results;
      }
      
      // Check for specific recursive policy error
      if (error.code === '42P17' && error.message?.includes('infinite recursion detected in policy')) {
        console.warn('Detected infinite recursion in policy while checking tables. Using fallback approach.');
        
        // Mark all collaboration tables as not existing to enforce local storage use
        const result: Record<string, boolean> = {};
        for (const table of requiredTables) {
          TABLE_EXISTENCE_CACHE[table] = false;
          CACHE_TIMESTAMP[table] = now;
          result[table] = false;
        }
        
        return result;
      }
      
      throw error;
    }
    
    const existingTables = new Set(data?.map(row => row.table_name) || []);
    
    // Update our cache
    const result: Record<string, boolean> = {};
    for (const table of requiredTables) {
      const exists = existingTables.has(table);
      TABLE_EXISTENCE_CACHE[table] = exists;
      CACHE_TIMESTAMP[table] = now;
      result[table] = exists;
    }
    
    return result;
  } catch (err) {
    console.error('Error checking tables:', err);
    
    // On error, return what we have in cache or assume tables don't exist
    return requiredTables.reduce((acc, table) => {
      acc[table] = TABLE_EXISTENCE_CACHE[table] || false;
      return acc;
    }, {} as Record<string, boolean>);
  }
}

/**
 * Clears the table existence cache to force a fresh check
 */
export function invalidateTableCache() {
  Object.keys(TABLE_EXISTENCE_CACHE).forEach(key => {
    delete TABLE_EXISTENCE_CACHE[key];
    delete CACHE_TIMESTAMP[key];
  });
  console.log('Table existence cache cleared');
}

/**
 * Saves user information to the database
 * @param userData User data to store
 * @returns Object with success status and error if any
 */
export const saveUserInfo = async (userData: any): Promise<{success: boolean, error: any}> => {
  try {
    console.log('saveUserInfo called with:', JSON.stringify(userData, null, 2));
    
    if (!userData) {
      console.error('saveUserInfo: No user data provided');
      return { success: false, error: "No user data provided" };
    }

    // Try to save to Supabase if available
    try {
      console.log('Attempting to save to Supabase...');
      // First check if Supabase is properly connected
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (!error) {
        console.log('Supabase connection successful');
        // Check if profile already exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userData.id)
          .single();
          
        if (fetchError) {
          console.log('Profile does not exist yet or fetch error:', fetchError);
        } else {
          console.log('Existing profile found:', existingProfile);
        }
        
        // Prepare data for upsert, ensuring all expected fields are present
        const profileData = {
          id: userData.id || `local-${Date.now()}`,
          email: userData.email,
          full_name: userData.name || userData.full_name || '',
          bio: userData.bio || '',
          job_title: userData.job_title || '',
          school: userData.school || '',
          avatar_url: userData.avatar_url || null,
          role: userData.role || 'user',
          preferences: userData.preferences || {},
          created_at: existingProfile ? undefined : new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Prepared profile data for upsert:', JSON.stringify(profileData, null, 2));
        
        // Supabase is working, save user info
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert([profileData], { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });
        
        if (upsertError) {
          console.error("Error saving to Supabase:", upsertError);
          throw upsertError;
        }
        
        console.log('Successfully saved profile to Supabase');
        return { success: true, error: null };
      } else {
        console.error('Supabase connection failed:', error);
        throw new Error("Supabase connection failed");
      }
    } catch (e) {
      console.log("Falling back to local storage", e);
      
      // Fallback to localStorage if Supabase is not available
      try {
        console.log('Attempting to save to localStorage...');
        const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
        console.log('Current localUsers:', localUsers);
        
        // Check if user already exists in local storage
        const existingUserIndex = localUsers.findIndex((user: any) => user.id === userData.id || user.email === userData.email);
        console.log('Existing user index:', existingUserIndex);
        
        const userToSave = {
          ...userData,
          id: userData.id || `local-${Date.now()}`,
          updated_at: new Date().toISOString(),
          isLocalOnly: true
        };
        
        console.log('User data to save to localStorage:', JSON.stringify(userToSave, null, 2));
        
        // If user exists, update their data, otherwise add a new user
        if (existingUserIndex >= 0) {
          localUsers[existingUserIndex] = {
            ...localUsers[existingUserIndex],
            ...userToSave,
            created_at: localUsers[existingUserIndex].created_at // Keep original creation date
          };
          console.log('Updated existing user in localStorage');
        } else {
          userToSave.created_at = userData.created_at || new Date().toISOString();
          localUsers.push(userToSave);
          console.log('Added new user to localStorage');
        }
        
        localStorage.setItem('localUsers', JSON.stringify(localUsers));
        console.log('localStorage updated successfully');
        return { success: true, error: null };
      } catch (localError) {
        console.error('Error saving to localStorage:', localError);
        return { success: false, error: localError };
      }
    }
  } catch (error) {
    console.error("Error saving user info:", error);
    return { success: false, error };
  }
};

/**
 * Gets user information from the database
 * @param userId User ID to retrieve
 * @returns User data or null if not found
 */
export const getUserInfo = async (userId: string): Promise<any> => {
  try {
    // Try Supabase first
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (e) {
      // Fallback to localStorage
      try {
        const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
        return localUsers.find((user: any) => user.id === userId) || null;
      } catch (localError) {
        return null;
      }
    }
  } catch (error) {
    console.error("Error getting user info:", error);
    return null;
  }
};

/**
 * Create or update a profile for a user
 * @param userId User ID
 * @param profileData Profile data to save
 * @returns Success status and data/error
 */
export const upsertProfile = async (userId: string, profileData: any): Promise<{success: boolean, data?: any, error?: any}> => {
  try {
    if (!userId) {
      return { success: false, error: "No user ID provided" };
    }
    
    // Prepare profile data with timestamps
    const dataToSave = {
      id: userId,
      ...profileData,
      updated_at: new Date().toISOString()
    };
    
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, created_at')
      .eq('id', userId)
      .single();
      
    // If no existing profile, add created_at timestamp
    if (!existingProfile) {
      dataToSave.created_at = new Date().toISOString();
    }
    
    // Save to Supabase
    const { data, error } = await supabase
      .from('profiles')
      .upsert(dataToSave, { 
        onConflict: 'id', 
        ignoreDuplicates: false
      });
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error("Error upserting profile:", error);
    return { success: false, error };
  }
};

/**
 * Update user avatar
 * @param userId User ID
 * @param avatarUrl URL of the avatar image
 * @returns Success status and error if any
 */
export const updateAvatar = async (userId: string, avatarUrl: string | null): Promise<{success: boolean, error?: any}> => {
  try {
    if (!userId) {
      return { success: false, error: "No user ID provided" };
    }
    
    // Update profile in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (error) throw error;
    
    // Also update auth metadata
    try {
      await supabase.auth.updateUser({
        data: {
          avatar_url: avatarUrl
        }
      });
    } catch (metaError) {
      console.warn("Could not update avatar in user metadata:", metaError);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating avatar:", error);
    return { success: false, error };
  }
};

/**
 * Get user preferences
 * @param userId User ID
 * @returns User preferences or default preferences
 */
export const getUserPreferences = async (userId: string): Promise<any> => {
  try {
    if (!userId) {
      return getDefaultPreferences();
    }
    
    // Try to get from Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .single();
      
    if (error || !data || !data.preferences) {
      throw error || new Error("No preferences found");
    }
    
    return data.preferences;
  } catch (e) {
    // Try local storage
    try {
      const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
      const user = localUsers.find((u: any) => u.id === userId);
      
      if (user?.preferences) {
        return user.preferences;
      }
    } catch (localError) {
      console.warn("Error getting preferences from localStorage:", localError);
    }
    
    // Return default preferences
    return getDefaultPreferences();
  }
};

/**
 * Save user preferences
 * @param userId User ID
 * @param preferences Preferences to save
 * @returns Success status and error if any
 */
export const saveUserPreferences = async (userId: string, preferences: any): Promise<{success: boolean, error?: any}> => {
  try {
    if (!userId) {
      return { success: false, error: "No user ID provided" };
    }
    
    // Try to save to Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ 
        preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (error) throw error;
    
    return { success: true };
  } catch (e) {
    console.warn("Error saving preferences to Supabase:", e);
    
    // Try to save to localStorage
    try {
      const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
      const userIndex = localUsers.findIndex((u: any) => u.id === userId);
      
      if (userIndex >= 0) {
        localUsers[userIndex].preferences = preferences;
        localUsers[userIndex].updated_at = new Date().toISOString();
        localStorage.setItem('localUsers', JSON.stringify(localUsers));
        return { success: true };
      }
      
      return { success: false, error: "User not found in local storage" };
    } catch (localError) {
      return { success: false, error: localError };
    }
  }
};

/**
 * Get default user preferences
 * @returns Default preferences object
 */
export const getDefaultPreferences = () => {
  return {
    darkMode: false,
    defaultModel: "qwen",
    notifications: true,
    autoSave: true,
    offlineMode: true
  };
};

/**
 * Creates the profiles table if it doesn't exist
 */
export const initializeProfilesTable = async (): Promise<boolean> => {
  try {
    // Check if table exists first
    const { error: checkError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (checkError && checkError.code === '42P01') {
      // Create the table with basic schema
      const { error } = await supabase.rpc('create_profiles_table');
      
      if (error) {
        console.error('Error creating profiles table:', error);
        
        // Try direct SQL approach
        const { error: sqlError } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.profiles (
              id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
              email TEXT UNIQUE,
              full_name TEXT,
              avatar_url TEXT,
              role TEXT CHECK (role IN ('teacher', 'admin', 'student')),
              preferences JSONB DEFAULT '{}',
              last_login TIMESTAMP WITH TIME ZONE,
              login_count INTEGER DEFAULT 0,
              failed_login_attempts INTEGER DEFAULT 0,
              last_failed_login TIMESTAMP WITH TIME ZONE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Enable RLS
            ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
            
            -- Create policies
            CREATE POLICY "Users can view their own profile" 
              ON public.profiles 
              FOR SELECT 
              USING (auth.uid() = id);
              
            CREATE POLICY "Users can update their own profile" 
              ON public.profiles 
              FOR UPDATE 
              USING (auth.uid() = id);
          `
        });
        
        if (sqlError) {
          console.error('Error creating profiles table with SQL:', sqlError);
          return false;
        }
      }
      
      console.log('Profiles table created successfully');
      return true;
    }
    
    // Table already exists
    return true;
  } catch (error) {
    console.error('Error initializing profiles table:', error);
    return false;
  }
};

/**
 * Creates auth_events table if it doesn't exist
 */
export const initializeAuthEventsTable = async (): Promise<boolean> => {
  try {
    // Check if table exists first
    const { error: checkError } = await supabase
      .from('auth_events')
      .select('*', { count: 'exact', head: true });
    
    if (checkError && checkError.code === '42P01') {
      // Execute the auth-tables.sql file content
      const { error } = await supabase.rpc('execute_sql', {
        sql: `
          -- Create auth_events table to track user authentication events
          CREATE TABLE IF NOT EXISTS public.auth_events (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            event_type TEXT NOT NULL,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            metadata JSONB DEFAULT '{}',
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          
          -- Add indexes for faster queries
          CREATE INDEX IF NOT EXISTS auth_events_user_id_idx ON auth_events(user_id);
          CREATE INDEX IF NOT EXISTS auth_events_event_type_idx ON auth_events(event_type);
          CREATE INDEX IF NOT EXISTS auth_events_timestamp_idx ON auth_events(timestamp);
          
          -- Add RLS (Row Level Security) to auth_events
          ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;
          
          -- Create policy to only allow users to see their own auth events
          CREATE POLICY "Users can view their own auth events" 
            ON public.auth_events 
            FOR SELECT 
            TO authenticated 
            USING (auth.uid() = user_id);
            
          -- Admin can see all auth events
          CREATE POLICY "Admin can view all auth events" 
            ON public.auth_events 
            FOR ALL 
            TO authenticated 
            USING (EXISTS (
              SELECT 1 FROM profiles 
              WHERE profiles.id = auth.uid() 
              AND profiles.role = 'admin'
            ));
        `
      });
      
      if (error) {
        console.error('Error creating auth_events table:', error);
        return false;
      }
      
      console.log('Auth events table created successfully');
      return true;
    }
    
    // Table already exists
    return true;
  } catch (error) {
    console.error('Error initializing auth_events table:', error);
    return false;
  }
};

/**
 * Creates all required tables for collaborative documents
 */
export const initializeCollaborativeDocsTables = async (): Promise<boolean> => {
  try {
    // Check if table exists first
    const { error: checkError } = await supabase
      .from('collaborative_documents')
      .select('*', { count: 'exact', head: true });
    
    if (checkError && checkError.code === '42P01') {
      // Create the tables using SQL with fixed RLS policies
      const { error } = await supabase.rpc('execute_sql', {
        sql: `
          -- Create table for collaborative documents
          CREATE TABLE IF NOT EXISTS public.collaborative_documents (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            content JSONB NOT NULL DEFAULT '{}',
            version INTEGER NOT NULL DEFAULT 1,
            created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            is_archived BOOLEAN NOT NULL DEFAULT false,
            is_public BOOLEAN NOT NULL DEFAULT false,
            document_type TEXT NOT NULL DEFAULT 'document',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create table for document history
          CREATE TABLE IF NOT EXISTS public.document_history (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            document_id UUID NOT NULL REFERENCES public.collaborative_documents(id) ON DELETE CASCADE,
            content JSONB NOT NULL,
            version INTEGER NOT NULL,
            created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create table for document collaborators with fixed policy
          CREATE TABLE IF NOT EXISTS public.document_collaborators (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            document_id UUID NOT NULL REFERENCES public.collaborative_documents(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(document_id, user_id)
          );
          
          -- Create table for document chat messages
          CREATE TABLE IF NOT EXISTS public.document_messages (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            document_id UUID NOT NULL REFERENCES public.collaborative_documents(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            message TEXT NOT NULL,
            message_type TEXT NOT NULL DEFAULT 'chat',
            is_system BOOLEAN NOT NULL DEFAULT false,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Enable RLS for all tables
          ALTER TABLE public.collaborative_documents ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.document_history ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.document_collaborators ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.document_messages ENABLE ROW LEVEL SECURITY;
          
          -- Fixed policies for collaborative_documents
          CREATE POLICY "Users can view documents they own"
            ON public.collaborative_documents
            FOR SELECT
            USING (created_by = auth.uid() OR is_public = true);
          
          CREATE POLICY "Users can edit documents they own"
            ON public.collaborative_documents
            FOR UPDATE
            USING (created_by = auth.uid());
          
          CREATE POLICY "Users can delete documents they own"
            ON public.collaborative_documents
            FOR DELETE
            USING (created_by = auth.uid());
          
          CREATE POLICY "Users can insert documents"
            ON public.collaborative_documents
            FOR INSERT
            WITH CHECK (auth.uid() IS NOT NULL);
            
          -- Fixed policies for document_collaborators without circular reference
          CREATE POLICY "Users can view collaborators for their documents"
            ON public.document_collaborators
            FOR SELECT
            USING (
              user_id = auth.uid() OR
              document_id IN (
                SELECT id FROM public.collaborative_documents 
                WHERE created_by = auth.uid()
              )
            );
            
          CREATE POLICY "Users can add collaborators to their documents"
            ON public.document_collaborators
            FOR INSERT
            WITH CHECK (
              document_id IN (
                SELECT id FROM public.collaborative_documents 
                WHERE created_by = auth.uid()
              )
            );
            
          CREATE POLICY "Users can edit collaborator permissions on their documents"
            ON public.document_collaborators
            FOR UPDATE
            USING (
              document_id IN (
                SELECT id FROM public.collaborative_documents 
                WHERE created_by = auth.uid()
              )
            );
            
          CREATE POLICY "Users can delete collaborators from their documents"
            ON public.document_collaborators
            FOR DELETE
            USING (
              document_id IN (
                SELECT id FROM public.collaborative_documents 
                WHERE created_by = auth.uid()
              )
            );
            
          -- Policies for document_history
          CREATE POLICY "Users can view history for documents they own or collaborate on"
            ON public.document_history
            FOR SELECT
            USING (
              document_id IN (
                SELECT id FROM public.collaborative_documents WHERE created_by = auth.uid()
              ) OR
              document_id IN (
                SELECT document_id FROM public.document_collaborators WHERE user_id = auth.uid()
              )
            );
            
          CREATE POLICY "Users can add history for documents they collaborate on"
            ON public.document_history
            FOR INSERT
            WITH CHECK (
              document_id IN (
                SELECT id FROM public.collaborative_documents WHERE created_by = auth.uid()
              ) OR
              document_id IN (
                SELECT document_id FROM public.document_collaborators 
                WHERE user_id = auth.uid() AND permission IN ('edit', 'admin')
              )
            );
            
          -- Policies for document_messages
          CREATE POLICY "Users can view messages for documents they collaborate on"
            ON public.document_messages
            FOR SELECT
            USING (
              document_id IN (
                SELECT id FROM public.collaborative_documents WHERE created_by = auth.uid()
              ) OR
              document_id IN (
                SELECT document_id FROM public.document_collaborators WHERE user_id = auth.uid()
              )
            );
            
          CREATE POLICY "Users can add messages for documents they collaborate on"
            ON public.document_messages
            FOR INSERT
            WITH CHECK (
              document_id IN (
                SELECT id FROM public.collaborative_documents WHERE created_by = auth.uid()
              ) OR
              document_id IN (
                SELECT document_id FROM public.document_collaborators WHERE user_id = auth.uid()
              )
          );
        `
      });
      
      if (error) {
        console.error('Error creating collaborative documents tables:', error);
        return false;
      }
      
      console.log('Collaborative documents tables created successfully');
      return true;
    }
    
    // Table already exists, let's fix the policy if needed
    try {
      // Check if we're encountering the recursion error
      const { error: testError } = await supabase
        .from('document_collaborators')
        .select('count', { count: 'exact', head: true });
      
      if (testError && testError.code === '42P17') {
        console.warn('Detected recursive policy, attempting to fix...');
        
        // Drop and recreate problematic policies
        const { error: fixError } = await supabase.rpc('execute_sql', {
          sql: `
            -- Drop existing policies that might cause recursion
            DROP POLICY IF EXISTS "Users can view collaborators for their documents" 
              ON public.document_collaborators;
            DROP POLICY IF EXISTS "Users can edit collaborator permissions on their documents" 
              ON public.document_collaborators;
            DROP POLICY IF EXISTS "Users can delete collaborators from their documents" 
              ON public.document_collaborators;
            DROP POLICY IF EXISTS "Users can add collaborators to their documents" 
              ON public.document_collaborators;
              
            -- Create fixed policies for document_collaborators without circular reference
            CREATE POLICY "Users can view collaborators for their documents"
              ON public.document_collaborators
              FOR SELECT
              USING (
                user_id = auth.uid() OR
                document_id IN (
                  SELECT id FROM public.collaborative_documents 
                  WHERE created_by = auth.uid()
                )
              );
              
            CREATE POLICY "Users can add collaborators to their documents"
              ON public.document_collaborators
              FOR INSERT
              WITH CHECK (
                document_id IN (
                  SELECT id FROM public.collaborative_documents 
                  WHERE created_by = auth.uid()
                )
              );
              
            CREATE POLICY "Users can edit collaborator permissions on their documents"
              ON public.document_collaborators
              FOR UPDATE
              USING (
                document_id IN (
                  SELECT id FROM public.collaborative_documents 
                  WHERE created_by = auth.uid()
                )
              );
              
            CREATE POLICY "Users can delete collaborators from their documents"
              ON public.document_collaborators
              FOR DELETE
              USING (
                document_id IN (
                  SELECT id FROM public.collaborative_documents 
                  WHERE created_by = auth.uid()
                )
              );
          `
        });
        
        if (fixError) {
          console.error('Error fixing recursive policies:', fixError);
          return false;
        }
        
        console.log('Successfully fixed recursive policies');
        
        // Clear our table existence cache to force a refresh
        invalidateTableCache();
        
        return true;
      }
    } catch (policyError) {
      console.error('Error fixing policy:', policyError);
      // Continue - the table exists, even if the policy fix failed
    }
    
    // Table already exists
    return true;
  } catch (error) {
    console.error('Error initializing collaborative documents tables:', error);
    return false;
  }
};

/**
 * Initializes the collaboration tables in the database if they don't exist
 */
export const initializeCollaborationTables = async (): Promise<boolean> => {
  console.log('Initializing collaboration tables...');
  
  try {
    // First try direct table access to check if tables exist
    try {
      const { error: teamsCheckError } = await supabase
        .from('teams')
        .select('count', { count: 'exact', head: true })
        .limit(1);
      
      // If no error, tables exist
      if (!teamsCheckError) {
        console.log('Collaboration tables already exist');
        return true;
      }
    } catch (checkError) {
      console.warn('Error checking if tables exist:', checkError);
      // Continue with creation attempt
    }
    
    // Try to create tables using RPC
    try {
      // Initialize teams table
      const createTeamsTableSQL = `
        CREATE TABLE IF NOT EXISTS teams (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          description TEXT,
          created_by UUID NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ
        );
      `;
      
      // Initialize team_members table
      const createTeamMembersTableSQL = `
        CREATE TABLE IF NOT EXISTS team_members (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          user_id UUID NOT NULL,
          role TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ,
          UNIQUE(team_id, user_id)
        );
      `;
      
      // Initialize shared_resources table
      const createSharedResourcesTableSQL = `
        CREATE TABLE IF NOT EXISTS shared_resources (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          resource_id TEXT NOT NULL,
          resource_type TEXT NOT NULL,
          shared_by UUID NOT NULL,
          shared_with UUID NOT NULL,
          permission TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ
        );
      `;
      
      // Run table creation SQL
      const { error: teamsError } = await supabase.rpc('execute_sql', { sql: createTeamsTableSQL });
      if (teamsError) {
        console.error('Error creating teams table:', teamsError);
        // Continue with other tables, don't return early
      }
      
      const { error: membersError } = await supabase.rpc('execute_sql', { sql: createTeamMembersTableSQL });
      if (membersError) {
        console.error('Error creating team_members table:', membersError);
        // Continue with other tables, don't return early
      }
      
      const { error: resourcesError } = await supabase.rpc('execute_sql', { sql: createSharedResourcesTableSQL });
      if (resourcesError) {
        console.error('Error creating shared_resources table:', resourcesError);
        // Continue with policies, don't return early
      }
      
      // Even if there were errors with table creation, try to apply policies
      // as the tables might already exist
      try {
        // Create RLS policies for teams table
        const teamsPoliciesSQL = `
          -- Allow anyone to view teams they are a member of
          CREATE POLICY IF NOT EXISTS teams_select_policy ON teams
            FOR SELECT USING (
              id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
            );
          
          -- Allow anyone to create teams
          CREATE POLICY IF NOT EXISTS teams_insert_policy ON teams
            FOR INSERT WITH CHECK (created_by = auth.uid());
          
          -- Allow team owner to update team
          CREATE POLICY IF NOT EXISTS teams_update_policy ON teams
            FOR UPDATE USING (created_by = auth.uid());
          
          -- Allow team owner to delete team
          CREATE POLICY IF NOT EXISTS teams_delete_policy ON teams
            FOR DELETE USING (created_by = auth.uid());
        `;
        
        // Create RLS policies for team_members table
        const membersPoliciesSQL = `
          -- Allow members to see others in their teams
          CREATE POLICY IF NOT EXISTS team_members_select_policy ON team_members
            FOR SELECT USING (
              team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
            );
          
          -- Allow team owners and admins to add members
          CREATE POLICY IF NOT EXISTS team_members_insert_policy ON team_members
            FOR INSERT WITH CHECK (
              team_id IN (
                SELECT team_id FROM team_members 
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
              )
            );
          
          -- Allow team owners and admins to update members
          CREATE POLICY IF NOT EXISTS team_members_update_policy ON team_members
            FOR UPDATE USING (
              team_id IN (
                SELECT team_id FROM team_members 
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
              )
            );
          
          -- Allow team owners and admins to remove members
          CREATE POLICY IF NOT EXISTS team_members_delete_policy ON team_members
            FOR DELETE USING (
              team_id IN (
                SELECT team_id FROM team_members 
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
              )
            );
        `;
        
        // Create RLS policies for shared_resources table
        const resourcesPoliciesSQL = `
          -- Allow members to see resources shared with their teams
          CREATE POLICY IF NOT EXISTS shared_resources_select_policy ON shared_resources
            FOR SELECT USING (
              shared_with IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
              OR shared_by = auth.uid()
            );
          
          -- Allow users to share resources
          CREATE POLICY IF NOT EXISTS shared_resources_insert_policy ON shared_resources
            FOR INSERT WITH CHECK (
              shared_by = auth.uid() AND
              shared_with IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
            );
          
          -- Allow users to update shared resources they created
          CREATE POLICY IF NOT EXISTS shared_resources_update_policy ON shared_resources
            FOR UPDATE USING (shared_by = auth.uid());
          
          -- Allow users to delete shared resources they created
          CREATE POLICY IF NOT EXISTS shared_resources_delete_policy ON shared_resources
            FOR DELETE USING (shared_by = auth.uid());
        `;
        
        // Apply RLS policies
        const { error: teamsPoliciesError } = await supabase.rpc('execute_sql', { sql: teamsPoliciesSQL });
        if (teamsPoliciesError) {
          console.error('Error creating teams policies:', teamsPoliciesError);
        }
        
        const { error: membersPoliciesError } = await supabase.rpc('execute_sql', { sql: membersPoliciesSQL });
        if (membersPoliciesError) {
          console.error('Error creating team_members policies:', membersPoliciesError);
        }
        
        const { error: resourcesPoliciesError } = await supabase.rpc('execute_sql', { sql: resourcesPoliciesSQL });
        if (resourcesPoliciesError) {
          console.error('Error creating shared_resources policies:', resourcesPoliciesError);
        }
      } catch (policyError) {
        console.error('Error applying RLS policies:', policyError);
      }
      
      // Check if any tables were created successfully
      const tablesCreated = !teamsError || !membersError || !resourcesError;
      if (tablesCreated) {
        console.log('Some collaboration tables initialized successfully');
        return true;
      } else {
        throw new Error('Could not create any tables');
      }
    } catch (sqlError) {
      console.error('SQL execution error:', sqlError);
      // Fall through to the fetch method
    }
    
    // If RPC fails, try direct fetch to see if tables exist already
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('count')
        .limit(1);
      
      if (!error) {
        console.log('Tables exist and are accessible');
        return true;
      }
      
      throw error;
    } catch (fetchError) {
      console.error('Error checking tables with fetch:', fetchError);
      
      // Set up localStorage fallback
      console.log('Setting up localStorage fallback for collaboration tables');
      
      // Ensure we have default data in localStorage
      try {
        let defaultDataExists = false;
        
        // Check for teams
        const localTeams = localStorage.getItem('edgenie_teams');
        if (!localTeams) {
          localStorage.setItem('edgenie_teams', JSON.stringify([]));
        } else {
          defaultDataExists = true;
        }
        
        // Check for team members
        const localMembers = localStorage.getItem('edgenie_team_members');
        if (!localMembers) {
          localStorage.setItem('edgenie_team_members', JSON.stringify([]));
        }
        
        // Check for shared resources
        const localResources = localStorage.getItem('edgenie_shared_resources');
        if (!localResources) {
          localStorage.setItem('edgenie_shared_resources', JSON.stringify([]));
        }
        
        if (defaultDataExists) {
          console.log('Using existing localStorage data for collaboration');
        } else {
          console.log('Initialized empty localStorage data for collaboration');
        }
        
        // Return true to indicate we've set up a valid fallback
        return true;
      } catch (localStorageError) {
        console.error('Failed to initialize localStorage fallback:', localStorageError);
        return false;
      }
    }
  } catch (error) {
    console.error('Error initializing collaboration tables:', error);
    
    // Ensure localStorage fallback exists even in case of errors
    try {
      if (!localStorage.getItem('edgenie_teams')) {
        localStorage.setItem('edgenie_teams', JSON.stringify([]));
      }
      if (!localStorage.getItem('edgenie_team_members')) {
        localStorage.setItem('edgenie_team_members', JSON.stringify([]));
      }
      if (!localStorage.getItem('edgenie_shared_resources')) {
        localStorage.setItem('edgenie_shared_resources', JSON.stringify([]));
      }
      console.log('Emergency localStorage fallback initialized');
      return true;
    } catch (e) {
      return false;
    }
  }
};

/**
 * Initializes all database tables
 * This should be called early in the application lifecycle
 */
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    console.log('Initializing database...');
    
    // Enable the uuid-ossp extension for UUID generation
    const { error: extensionError } = await supabase.rpc('execute_sql', {
      sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    });
    
    if (extensionError) {
      console.error('Error enabling uuid-ossp extension:', extensionError);
    }
    
    // Initialize profiles table
    const profilesInitialized = await initializeProfilesTable();
    console.log('Profiles table initialized:', profilesInitialized);
    
    // Initialize auth_events table for tracking login/signup events
    const authEventsInitialized = await initializeAuthEventsTable();
    console.log('Auth events table initialized:', authEventsInitialized);
    
    // Initialize collaborative documents tables
    const collaborativeDocsInitialized = await initializeCollaborativeDocsTables();
    console.log('Collaborative documents tables initialized:', collaborativeDocsInitialized);
    
    // Initialize collaboration tables
    const collaborationInitialized = await initializeCollaborationTables();
    console.log('Collaboration tables initialized:', collaborationInitialized);
    
    // Enable row level security on all tables
    const { error: rlsError } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS auth_events ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS collaborative_documents ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS document_history ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS document_messages ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS document_collaborators ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS teams ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS team_members ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS shared_resources ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}; 