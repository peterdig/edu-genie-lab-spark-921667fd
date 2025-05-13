import { supabase } from "./supabase";

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
 * Checks if required tables exist in the database
 * @returns Object with status of each table
 */
export const checkTablesExist = async (): Promise<Record<string, boolean>> => {
  const tables = {
    profiles: false,
    auth_events: false,
    collaborative_documents: false,
    document_history: false,
    document_collaborators: false,
    document_messages: false
  };
  
  // Create a function to check a single table
  const checkTable = async (tableName: string): Promise<boolean> => {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
        
      if (error && error.code === '42P01') {
        // Table doesn't exist error code
        console.warn(`Table ${tableName} doesn't exist`);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error(`Error checking if table ${tableName} exists:`, err);
      return false;
    }
  };
  
  // Check all tables in parallel
  await Promise.all(
    Object.keys(tables).map(async (tableName) => {
      tables[tableName as keyof typeof tables] = await checkTable(tableName);
    })
  );
  
  return tables;
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
      // Create the tables using SQL (truncated for brevity, would execute the full SQL file)
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
          
          -- Create table for document collaborators
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
        `
      });
      
      if (error) {
        console.error('Error creating collaborative documents tables:', error);
        return false;
      }
      
      console.log('Collaborative documents tables created successfully');
      return true;
    }
    
    // Table already exists
    return true;
  } catch (error) {
    console.error('Error initializing collaborative documents tables:', error);
    return false;
  }
};

/**
 * Initializes all database tables
 * This should be called early in the application lifecycle
 */
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    const tableStatus = await checkTablesExist();
    console.log('Database table status:', tableStatus);
    
    // Initialize tables in sequence to handle dependencies
    if (!tableStatus.profiles) {
      await initializeProfilesTable();
    }
    
    if (!tableStatus.auth_events) {
      await initializeAuthEventsTable();
    }
    
    if (!tableStatus.collaborative_documents) {
      await initializeCollaborativeDocsTables();
    }
    
    // Verify again
    const finalStatus = await checkTablesExist();
    const allTablesExist = Object.values(finalStatus).every(exists => exists);
    
    if (allTablesExist) {
      console.log('All required database tables exist');
    } else {
      console.warn('Some database tables could not be created:', 
        Object.entries(finalStatus)
          .filter(([_, exists]) => !exists)
          .map(([table]) => table)
          .join(', ')
      );
    }
    
    return allTablesExist;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}; 