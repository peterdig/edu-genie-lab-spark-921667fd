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