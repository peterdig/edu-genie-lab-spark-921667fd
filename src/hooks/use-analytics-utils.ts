import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Creates a Supabase realtime subscription with proper type handling
 * and error management to prevent flickering/reloading
 */
export function createRealtimeSubscription(
  channelName: string,
  tableName: string,
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' = 'INSERT',
  schema: string = 'public',
  callback: (payload: any) => void
): { 
  subscription: RealtimeChannel | null, 
  unsubscribe: () => void 
} {
  let subscription: RealtimeChannel | null = null;
  
  try {
    // Check if Supabase client has channel method
    if (typeof supabase.channel !== 'function') {
      console.warn('Realtime subscriptions not available - using fallback mode');
      return {
        subscription: null,
        unsubscribe: () => console.log('Mock unsubscribe (no-op)')
      };
    }
    
    // Create a channel for realtime updates
    const channel = supabase.channel(channelName);
    
    // Set up the subscription with proper type handling
    subscription = channel
      .on(
        'postgres_changes' as any, // Type casting to avoid TypeScript errors
        {
          event: eventType,
          schema: schema,
          table: tableName
        },
        callback
      )
      .subscribe();
      
    return {
      subscription,
      unsubscribe: () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      }
    };
  } catch (err) {
    console.error('Error setting up realtime subscription:', err);
    return {
      subscription: null,
      unsubscribe: () => console.log('Error unsubscribe (no-op)')
    };
  }
} 