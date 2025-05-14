import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { signOut } from './auth';
import { useNavigate } from 'react-router-dom';

// Import auth events with dynamic import and fallback functions
let logAuthEvent, updateLastLogin, updateLoginStats;

// Fallback implementations in case imports fail
const fallbackLogAuthEvent = async (userId, eventType, metadata) => {
  console.log(`[Fallback] Auth event: ${eventType} for user ${userId}`, metadata);
};

const fallbackUpdateLastLogin = async (userId) => {
  console.log(`[Fallback] Last login updated for user ${userId}`);
};

const fallbackUpdateLoginStats = async (userId) => {
  console.log(`[Fallback] Login stats updated for user ${userId}`);
};

// Set initial values to fallbacks
logAuthEvent = fallbackLogAuthEvent;
updateLastLogin = fallbackUpdateLastLogin;
updateLoginStats = fallbackUpdateLoginStats;

// Try to import the actual functions
import('./auth-events.js')
  .then(authEvents => {
    logAuthEvent = authEvents.logAuthEvent;
    updateLastLogin = authEvents.updateLastLogin;
    updateLoginStats = authEvents.updateLoginStats;
    console.log('Successfully imported auth-events.js');
  })
  .catch(error => {
    console.error('Failed to load auth-events.js, using fallback functions:', error);
  });

// Add a type for the user
/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} [full_name]
 * @property {string} [avatar_url]
 * @property {string} [role]
 */

// Create the context
const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        // Get user from Supabase
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }
        
        if (data?.user) {
          console.log('User authenticated with Supabase:', data.user);
          
          // Set basic user data immediately
          setUser({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name,
            role: data.user.user_metadata?.role
          });
          
          setIsAuthenticated(true);
          
          // Fetch additional profile data in background
          fetchAdditionalProfileData(data.user.id);
        } else {
          // Try to get from localStorage as fallback
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              console.log('User loaded from localStorage:', parsedUser);
              setUser(parsedUser);
              setIsAuthenticated(true);
            } catch (e) {
              console.error('Error parsing stored user:', e);
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        
        // Try localStorage as fallback
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (e) {
          console.error('Error getting from localStorage:', e);
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Set basic user data immediately
          setUser({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name,
            role: session.user.user_metadata?.role
          });
          
          setIsAuthenticated(true);
          
          // Fetch additional profile data in background
          fetchAdditionalProfileData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('user');
        } else if (event === 'USER_UPDATED' && session?.user) {
          // Update user data when it changes
          setUser({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name,
            role: session.user.user_metadata?.role
          });
          
          // Fetch additional profile data in background
          fetchAdditionalProfileData(session.user.id);
        }
      }
    );
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);
  
  // Function to update user data in context
  const updateUserData = (updatedUser) => {
    if (!updatedUser) return;
    
    console.log('updateUserData called with:', JSON.stringify(updatedUser, null, 2));
    
    setUser(updatedUser);
    
    // For Supabase users, ensure the profile is updated in the database
    if (updatedUser.id) {
      console.log('Updating Supabase user profile for ID:', updatedUser.id);
      // Remove null/undefined properties to avoid overwriting with nulls
      const cleanedData = Object.fromEntries(
        Object.entries({
          full_name: updatedUser.full_name,
          avatar_url: updatedUser.avatar_url,
          role: updatedUser.role,
          // Additional fields that might be in the updatedUser object
          bio: updatedUser.bio,
          job_title: updatedUser.job_title,
          school: updatedUser.school,
          updated_at: new Date().toISOString()
        }).filter(([_, v]) => v !== null && v !== undefined)
      );
      
      console.log('Data to update in Supabase:', cleanedData);
      
      // Update profiles table (don't await to avoid blocking UI)
      try {
        supabase
          .from('profiles')
          .update(cleanedData)
          .eq('id', updatedUser.id)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating profile in Supabase:', error);
            } else {
              console.log('Profile updated successfully in Supabase');
            }
          });
      } catch (e) {
        console.warn('Error updating user profile:', e);
      }
    }
    
    // Also update in localStorage for all users (as a backup)
    try {
      localStorage.setItem('user', JSON.stringify({
        ...updatedUser,
        updated_at: new Date().toISOString()
      }));
      console.log('User updated in localStorage');
    } catch (e) {
      console.error('Error updating user in localStorage:', e);
    }
  };
  
  // Login function
  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      
      setIsLoading(true);
      
      // Set a timeout to prevent long-hanging operations
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Login timed out. Please try again."));
        }, 10000); // 10 second timeout
      });
      
      // Try online login with Supabase
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password
      });
      
      // Race the login promise against the timeout
      const { data, error } = await Promise.race([
        loginPromise,
        timeoutPromise.then(() => {
          throw new Error("Login timed out. Please try again.");
        })
      ]);
      
      if (error) {
        console.error('Supabase login error:', error);
        
        // Check specifically for email confirmation issues
        if (error.message?.includes('Email not confirmed') || 
            error.message?.includes('not confirmed') || 
            error.message?.includes('not verified')) {
          return { 
            success: false, 
            error: { message: 'Please verify your email before logging in. Check your inbox for a confirmation link.' } 
          };
        }
        
        return { success: false, error };
      }
      
      if (data?.user) {
        // Set user data
        const userData = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name,
          role: data.user.user_metadata?.role
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // Store in localStorage as backup
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Log successful login
        try {
          await logAuthEvent(data.user.id, 'signin', {
            provider: 'email',
            timestamp: new Date().toISOString()
          });
          await updateLastLogin(data.user.id);
        } catch (e) {
          console.warn('Non-critical error logging auth event:', e);
        }
        
        // Fetch additional profile data in background
        fetchAdditionalProfileData(data.user.id);
        
        return { success: true };
      }
      
      return { success: false, error: { message: 'Invalid login credentials' } };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: { message: error instanceof Error ? error.message : 'Login failed. Please try again.' } 
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch additional user profile data from database
  const fetchAdditionalProfileData = async (userId) => {
    try {
      // Fetch more user data from the profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.warn('Error fetching profile:', error);
      } else if (profile) {
        console.log('Fetched additional profile data:', profile);
        
        // Get current session for email verification status
        const { data: { session } } = await supabase.auth.getSession();
        const emailVerified = session?.user?.email_confirmed_at ? true : false;
        
        // Merge profile data with user data
        const enrichedUser = {
          ...user,
          ...profile,
          // Add these fields explicitly to ensure they're set
          full_name: profile.full_name || user?.full_name,
          avatar_url: profile.avatar_url,
          role: profile.role || user?.role || 'user',
          email_verified: emailVerified,
          updated_at: profile.updated_at
        };
        
        setUser(enrichedUser);
        
        // Also store in localStorage for fallback
        try {
          localStorage.setItem('user', JSON.stringify(enrichedUser));
        } catch (e) {
          console.error('Error storing user in localStorage:', e);
        }
        
        // Log the login event if this was triggered by login
        if (session) {
          logAuthEvent(userId, 'login', {
            timestamp: new Date().toISOString(),
            method: 'email',
          }).catch(err => console.warn('Error logging auth event:', err));
          
          // Update last login time and stats
          updateLastLogin(userId).catch(err => console.warn('Error updating last login:', err));
          updateLoginStats(userId).catch(err => console.warn('Error updating login stats:', err));
        }
      } else {
        console.warn('No profile found for user:', userId);
      }
    } catch (e) {
      console.error('Error in fetchAdditionalProfileData:', e);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      // Log signout event if user exists
      if (user?.id) {
        try {
          await logAuthEvent(user.id, 'signout', {
            timestamp: new Date().toISOString()
          });
        } catch (e) {
          console.warn('Non-critical error logging signout event:', e);
        }
      }
      
      // Clear session in Supabase
      await signOut();
      
      // Clear local state
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear localStorage
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Check authentication
  const checkAuth = async () => {
    try {
      // Already authenticated
      if (isAuthenticated && user) {
        return true;
      }
      
      // Try Supabase
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        // Set basic user data
        setUser({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name,
          role: data.user.user_metadata?.role
        });
        
        setIsAuthenticated(true);
        
        // Fetch additional profile data in background
        fetchAdditionalProfileData(data.user.id);
        
        return true;
      }
      
      // Try localStorage as fallback
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
          return true;
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking auth:', error);
      
      // Try localStorage as final fallback
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
          return true;
        }
      } catch (e) {
        console.error('Error getting from localStorage:', e);
      }
      
      return false;
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
        updateUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook for using the auth context
 * @returns {Object} The auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 