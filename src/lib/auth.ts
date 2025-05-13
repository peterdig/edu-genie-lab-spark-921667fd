import { supabase } from "./supabase";
import { saveUserInfo } from "./database";
import { Provider } from "@supabase/supabase-js";

/**
 * Sign up a new user with email and password
 * @param userData User data for registration containing email, password, and profile info
 * @returns Object with success status and user/error details
 */
export const signUp = async (userData: {
  email: string;
  password: string;
  name: string;
  terms: boolean;
}): Promise<{ success: boolean; user?: any; error?: any }> => {
  try {
    // Validate required fields
    if (!userData.email || !userData.password || !userData.name) {
      return {
        success: false,
        error: "Email, password, and name are required",
      };
    }

    // Try with Supabase
    try {
      console.log('Attempting to create user in Supabase:', userData.email);
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.name,
            terms_accepted: userData.terms,
            signup_date: new Date().toISOString()
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data.user) {
        console.log('Supabase user created successfully:', data.user.id);
        
        // Create initial profile in the profiles table
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: userData.email,
              full_name: userData.name,
              role: 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              terms_accepted: userData.terms,
              terms_accepted_at: new Date().toISOString()
            });
            
          if (profileError) {
            console.warn('Error creating initial profile:', profileError);
          } else {
            console.log('Initial profile created successfully in profiles table');
          }
        } catch (profileError) {
          console.warn('Exception creating initial profile:', profileError);
        }
        
        // Save additional user information using our helper
        await saveUserInfo({
          id: data.user.id,
          email: userData.email,
          name: userData.name,
          preferences: {
            agreedToTerms: userData.terms,
            signupDate: new Date().toISOString(),
          },
        });

        return { success: true, user: data.user };
      } else {
        return {
          success: false,
          error: "User was not created, but no error was returned",
        };
      }
    } catch (supabaseError) {
      console.error("Supabase signup error:", supabaseError);

      // If there's a network error, create a local user
      if (
        supabaseError instanceof Error &&
        (supabaseError.message?.includes("Failed to fetch") ||
          supabaseError.message?.includes("NetworkError") ||
          supabaseError.message?.includes("timeout"))
      ) {
        return createLocalUser(userData);
      }

      return { success: false, error: supabaseError };
    }
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error };
  }
};

/**
 * Create a local user in localStorage when offline
 * @param userData User data for registration
 * @returns Success status and user info
 */
const createLocalUser = async (userData: {
  email: string;
  password: string;
  name: string;
  terms: boolean;
}): Promise<{ success: boolean; user?: any; error?: any }> => {
  try {
    // Generate a local ID
    const localId = `local-${Date.now()}`;

    // Create the user object
    const user = {
      id: localId,
      email: userData.email,
      full_name: userData.name,
      password: userData.password, // Only stored locally
      created_at: new Date().toISOString(),
      isLocalOnly: true,
      preferences: {
        agreedToTerms: userData.terms,
        signupDate: new Date().toISOString(),
      },
    };

    // Save to localStorage
    try {
      const existingUsers = JSON.parse(localStorage.getItem("localUsers") || "[]");
      existingUsers.push(user);
      localStorage.setItem("localUsers", JSON.stringify(existingUsers));

      // Also set as current user
      const { password, ...safeUser } = user; // Remove password from current user
      localStorage.setItem("user", JSON.stringify(safeUser));

      return { success: true, user: safeUser };
    } catch (storageError) {
      return { success: false, error: storageError };
    }
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<{ success: boolean; error?: any }> => {
  try {
    // Remove user from localStorage
    localStorage.removeItem("user");

    // Try to sign out with Supabase too
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (e) {
      // Ignore Supabase errors, we've already removed from localStorage
      console.warn("Supabase signout error (ignored):", e);
    }

    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    return { success: false, error };
  }
};

/**
 * Sign in with OAuth provider (Google, GitHub, etc.)
 */
export const signInWithOAuth = async (provider: Provider): Promise<{ success: boolean; error?: any }> => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;

    // The user will be redirected to the OAuth provider
    // The callback will handle setting up the session
    return { success: true };
  } catch (error) {
    console.error('OAuth sign in error:', error);
    return { success: false, error };
  }
};

/**
 * Handle OAuth callback
 */
export const handleOAuthCallback = async (): Promise<{ success: boolean; error?: any }> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    if (!session) {
      throw new Error('No session found after OAuth callback');
    }

    // Save additional user info if needed
    if (session.user) {
      await saveUserInfo({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
        preferences: {
          signupDate: new Date().toISOString(),
          provider: session.user.app_metadata.provider,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('OAuth callback error:', error);
    return { success: false, error };
  }
}; 