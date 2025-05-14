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
  role?: string;
}): Promise<{ success: boolean; user?: any; error?: any; needsEmailVerification?: boolean }> => {
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
      
      // Detect environment for proper redirect URL
      let redirectUrl;
      
      // Force production URL for email verification to avoid localhost redirects
      const forceProdUrlForEmailVerification = true;
      
      // Try to detect if we're in development or production
      const isDev = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1';
                   
      if (isDev && !forceProdUrlForEmailVerification) {
        // Use localhost for development
        redirectUrl = `${window.location.origin}/auth/callback`;
        console.log('Using development redirect URL:', redirectUrl);
      } else {
        // Use production URL
        redirectUrl = 'https://edu-genie-lab--five.vercel.app/auth/callback';
        console.log('Using production redirect URL:', redirectUrl);
      }
      
      // This signUp call will trigger TS error in some versions of Supabase SDK
      // but the functionality works
      // @ts-ignore - Ignoring TypeScript error as function exists at runtime
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.name,
            terms_accepted: userData.terms,
            signup_date: new Date().toISOString(),
            role: userData.role || 'user'
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error('Supabase signup error:', error);
        throw error;
      }

      if (data.user) {
        console.log('Supabase user created successfully:', data.user.id);
        console.log('Email confirmation status:', data.user.email_confirmed_at ? 'Confirmed' : 'Not confirmed');
        
        // If we have identityData and the email is already confirmed, log it
        if (data.user.identities && data.user.identities.length > 0) {
          console.log('Identity data:', data.user.identities);
        }
        
        // Create initial profile in the profiles table
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: userData.email,
              full_name: userData.name,
              role: userData.role || 'user',
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

        // Store email in localStorage to help with resending verification
        localStorage.setItem('lastSignupEmail', userData.email);

        return { 
          success: true, 
          user: data.user,
          // Add flag to indicate email verification status
          needsEmailVerification: !data.user.email_confirmed_at 
        };
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
  role?: string;
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
      role: userData.role || 'user',
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
 * Handle OAuth callback and email verification
 */
export const handleOAuthCallback = async (): Promise<{ success: boolean; error?: any }> => {
  try {
    // Get the current session
    // @ts-ignore - Ignoring TypeScript error as function exists at runtime
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    // Check if we have a session
    if (!session) {
      // If there's no session, attempt to exchange the auth code for a session
      // This is necessary for email verification flows
      // @ts-ignore - Ignoring TypeScript error as function exists at runtime
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
        window.location.hash.substring(1) || window.location.search.substring(1)
      );
      
      if (exchangeError) {
        console.error("Error exchanging auth code:", exchangeError);
        throw exchangeError;
      }
      
      if (!data.session) {
        throw new Error('No session found after code exchange');
      }
      
      // Set the session
      // @ts-ignore - Ignoring TypeScript error as function exists at runtime
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
      
      // Save additional user info
      if (data.session.user) {
        await saveUserInfo({
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || '',
          preferences: {
            signupDate: new Date().toISOString(),
            provider: data.session.user.app_metadata.provider || 'email',
            emailVerified: true,
          },
        });
        
        // Store verified status
        localStorage.setItem('emailVerified', 'true');
        if (data.session.user.email) {
          localStorage.setItem('verifiedEmail', data.session.user.email);
        }
      }
      
      return { success: true };
    }

    // For existing session, save user info
    if (session.user) {
      await saveUserInfo({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
        preferences: {
          signupDate: new Date().toISOString(),
          provider: session.user.app_metadata.provider || 'email',
          emailVerified: true,
        },
      });
      
      // Store verified status
      localStorage.setItem('emailVerified', 'true');
      if (session.user.email) {
        localStorage.setItem('verifiedEmail', session.user.email);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Auth callback error:', error);
    return { success: false, error };
  }
};

/**
 * Resend verification email to the specified email address
 * @param email The email address to send the verification email to
 * @returns Object with success status and error details if any
 */
export const resendVerificationEmail = async (email: string): Promise<{ success: boolean; error?: any }> => {
  try {
    if (!email) {
      return {
        success: false,
        error: "Email is required"
      };
    }
    
    // Always use production redirect URL for email verification
    const redirectUrl = 'https://edu-genie-lab--five.vercel.app/auth/callback';
    console.log('Using production redirect URL for verification email:', redirectUrl);
    
    // Try with Supabase
    // @ts-ignore - Ignoring TypeScript error as function exists at runtime
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) {
      console.error('Error resending verification email:', error);
      return { success: false, error };
    }
    
    console.log('Verification email resent successfully:', data);
    return { success: true };
  } catch (error) {
    console.error('Error resending verification email:', error);
    return { success: false, error };
  }
}; 
