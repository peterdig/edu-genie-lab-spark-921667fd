import { createClient } from '@supabase/supabase-js';

// Define types for the tables we'll be using
export type Profile = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  role: 'teacher' | 'admin' | 'student';
  preferences: Record<string, any>;
  created_at: string;
};

export type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
};

export type Team = {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
};

export type SharedResource = {
  id: string;
  resource_id: string;
  resource_type: 'lesson' | 'assessment' | 'template' | 'rubric';
  shared_by: string;
  shared_with: string;
  permission: 'view' | 'edit';
  created_at: string;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  content: Record<string, any>;
  category: string;
  tags: string[];
  created_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type Analytics = {
  id: string;
  user_id: string;
  content_id: string;
  content_type: string;
  action: string;
  metadata: Record<string, any>;
  created_at: string;
};

export type AccessibilitySetting = {
  id: string;
  user_id: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
};

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single supabase client for interacting with the database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return (
    supabaseUrl !== undefined && 
    supabaseUrl !== 'https://your-supabase-project-url.supabase.co' &&
    supabaseAnonKey !== undefined && 
    supabaseAnonKey !== 'your-supabase-anon-key'
  );
};

// Fallback to localStorage if Supabase is not configured
export const useLocalStorageFallback = () => {
  return !isSupabaseConfigured();
}; 