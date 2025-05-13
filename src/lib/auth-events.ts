import { supabase } from "./supabase";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

/**
 * Logs an authentication-related event
 * @param userId The user ID
 * @param eventType Type of event (signin, signout, etc.)
 * @param metadata Additional metadata for the event
 */
export const logAuthEvent = async (
  userId: string, 
  eventType: string, 
  metadata: Record<string, any> = {}
): Promise<void> => {
  try {
    // Log to console in development
    console.log(`Auth event: ${eventType} for user ${userId}`, metadata);
    
    // In a real app, would log to database
    const { error } = await supabase
      .from('auth_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        metadata,
        timestamp: new Date().toISOString()
      });
      
    if (error) {
      console.warn('Failed to log auth event to database:', error);
      
      // Fall back to localStorage
      try {
        const existingEvents = JSON.parse(localStorage.getItem('auth_events') || '[]');
        existingEvents.push({
          user_id: userId,
          event_type: eventType,
          metadata,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('auth_events', JSON.stringify(existingEvents));
      } catch (e) {
        console.error('Failed to log auth event to localStorage:', e);
      }
    }
  } catch (error) {
    console.error('Error logging auth event:', error);
  }
};

/**
 * Updates the last login timestamp for a user
 * @param userId The user ID
 */
export const updateLastLogin = async (userId: string): Promise<void> => {
  try {
    // Cast the result of update() to PostgrestFilterBuilder to fix TypeScript error
    const query = supabase
      .from('profiles')
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }) as unknown as PostgrestFilterBuilder<any, any, null>;
    
    const { error } = await query.eq('id', userId);
      
    if (error) {
      console.warn('Failed to update last login in database:', error);
    }
  } catch (error) {
    console.error('Error updating last login:', error);
  }
};

// Define a type for profile data
interface ProfileData {
  login_count?: number;
  first_login?: string;
}

/**
 * Updates various login statistics for a user
 * @param userId The user ID
 */
export const updateLoginStats = async (userId: string): Promise<void> => {
  try {
    // Get current profile data - cast to PostgrestFilterBuilder
    const query = supabase
      .from('profiles')
      .select('login_count, first_login') as unknown as PostgrestFilterBuilder<any, any, ProfileData>;
    
    const { data, error } = await query.eq('id', userId).single();
      
    if (error) {
      console.warn('Failed to fetch user profile for stats update:', error);
      return;
    }
    
    // Calculate new values with type-safe data
    const typedData = data as ProfileData;
    const loginCount = ((typedData?.login_count || 0) + 1);
    const firstLogin = typedData?.first_login || new Date().toISOString();
    
    // Update profile with correct method chaining - cast to PostgrestFilterBuilder
    const updateQuery = supabase
      .from('profiles')
      .update({
        login_count: loginCount,
        first_login: firstLogin,
        updated_at: new Date().toISOString()
      }) as unknown as PostgrestFilterBuilder<any, any, null>;
    
    const { error: updateError } = await updateQuery.eq('id', userId);
      
    if (updateError) {
      console.warn('Failed to update login stats in database:', updateError);
    }
  } catch (error) {
    console.error('Error updating login stats:', error);
  }
}; 