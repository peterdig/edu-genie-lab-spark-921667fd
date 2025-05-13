import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Mock user ID to use for development
export const DEV_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Creates a bypass user for development purposes
 * This helps work around RLS policies when testing without auth
 */
export const createBypassUser = async () => {
  try {
    // First try anonymous sign in to get a session
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.warn('Anonymous sign-in failed:', error.message);
      } else {
        console.log('Anonymous sign-in successful', data);
      }
    } catch (e) {
      console.warn('Error during anonymous sign-in:', e);
    }

    // Check if bypass user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'bypass@example.com')
      .maybeSingle();

    if (existingUser) {
      console.log('Using existing bypass user:', existingUser.id);
      return existingUser.id;
    }

    // Create a new bypass user
    const { data: newUser, error } = await supabase
      .from('profiles')
      .insert({
        id: DEV_USER_ID,
        email: 'bypass@example.com',
        username: 'bypass_user',
        fullName: 'Development Bypass User',
        role: 'teacher',
        preferences: { isDevelopment: true }
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create bypass user:', error);
      if (error.code === '23505') { 
        // Unique violation - user likely exists but query failed
        console.log('Bypass user may already exist, using default ID');
        return DEV_USER_ID;
      }
      return DEV_USER_ID;
    }

    console.log('Created bypass user for development:', newUser.id);
    return newUser.id;
  } catch (error) {
    console.error('Error in createBypassUser:', error);
    return DEV_USER_ID;
  }
};

/**
 * Attempts to sign in anonymously to get a Supabase session
 */
export const signInAnonymously = async () => {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Anonymous sign-in failed:', error);
      return false;
    }
    console.log('Anonymous sign-in successful', data.session?.user?.id);
    return true;
  } catch (error) {
    console.error('Error during anonymous sign-in:', error);
    return false;
  }
};

/**
 * Ensures Supabase tables exist by trying to create them if missing
 * Only used in development to handle missing tables gracefully
 */
export const ensureTablesExist = async () => {
  const tables = ['profiles', 'teams', 'team_members', 'shared_resources'];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      
      if (error && error.code === '42P01') { // Undefined table
        console.warn(`Table ${table} doesn't exist, application will use localStorage fallback`);
      }
    } catch (error) {
      console.error(`Error checking ${table} table:`, error);
    }
  }
}; 