import { supabase } from './supabase';

/**
 * Log an authentication event to the database
 */
export const logAuthEvent = async (userId, eventType, metadata) => {
  try {
    await supabase
      .from('auth_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        metadata,
        created_at: new Date().toISOString()
      });
    console.log(`Auth event logged: ${eventType} for user ${userId}`);
  } catch (error) {
    console.error('Error logging auth event:', error);
  }
};

/**
 * Update the last login timestamp for a user
 */
export const updateLastLogin = async (userId) => {
  try {
    await supabase
      .from('profiles')
      .update({ 
        last_login: new Date().toISOString() 
      })
      .eq('id', userId);
    console.log(`Last login updated for user ${userId}`);
  } catch (error) {
    console.error('Error updating last login:', error);
  }
};

/**
 * Update login statistics for a user
 */
export const updateLoginStats = async (userId) => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('login_count')
      .eq('id', userId)
      .single();
    
    const loginCount = (data?.login_count || 0) + 1;
    
    await supabase
      .from('profiles')
      .update({ login_count: loginCount })
      .eq('id', userId);
      
    console.log(`Login count updated for user ${userId}: ${loginCount}`);
  } catch (error) {
    console.error('Error updating login stats:', error);
  }
}; 