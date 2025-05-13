import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function storeDownloadInfo(email: string) {
  try {
    // First try using the store_download_info RPC function
    const { data, error } = await supabase
      .rpc('store_download_info', {
        p_email: email,
        p_platform: 'android',
        p_version: '1.0.0'
      });

    // If function doesn't exist, fallback to direct table insert
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      // Try to insert directly to app_downloads table
      const { data: insertData, error: insertError } = await supabase
        .from('app_downloads')
        .insert({
          email: email,
          platform: 'android',
          app_version: '1.0.0',
          downloaded_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error inserting download info:', insertError);
        // Final fallback - just return success to allow download to continue
        return { success: true, fallback: true };
      }
      
      return { success: true, data: insertData };
    } else if (error) {
      console.error('Error storing download info:', error);
      // Return success anyway to allow download to continue
      return { success: true, fallback: true };
    }

    return data || { success: true };
  } catch (error) {
    console.error('Error storing download info:', error);
    // Return success anyway to not block downloads
    return { success: true, fallback: true };
  }
} 