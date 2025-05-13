#!/usr/bin/env node

/**
 * Script to apply SQL schema files to Supabase
 * Usage: node apply-schemas.js
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';

// Load environment variables from both .env and .env.local
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

// Get current file and directory path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Check configuration
if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Supabase URL or key is missing in environment variables.');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY are set.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// List of SQL files to apply in order (dependencies first)
const SQL_FILES = [
  'rpc-functions.sql',
  'auth-tables.sql',
  'collaborative-docs-tables.sql',
  'migrations/20240513_setup_downloads.sql'
];

// Function to execute SQL using Supabase client
async function executeSql(sql) {
  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    
    if (error) {
      // If the execute_sql function doesn't exist, try creating it first
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        const createFunctionSql = `
          CREATE OR REPLACE FUNCTION execute_sql(sql text)
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          SET search_path = public
          AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$;
        `;
        
        const { error: createError } = await supabase.rpc('execute_sql', { sql: createFunctionSql });
        if (!createError) {
          // Try executing the original SQL again
          return await supabase.rpc('execute_sql', { sql });
        }
      }
      
      // If that didn't work, try direct query
      const { error: queryError } = await supabase.query(sql);
      if (queryError) {
        console.warn('Error executing SQL:', queryError.message);
        return false;
      }
    }
    
    return true;
  } catch (err) {
    console.warn('Error executing SQL:', err.message);
    return false;
  }
}

async function main() {
  console.log('=== EdGenie Database Schema Application Tool ===');
  console.log(`Using Supabase URL: ${supabaseUrl}`);
  
  try {
    // First create the profiles table if it doesn't exist
    console.log('\nAttempting to create profiles table...');
    const profilesSql = `
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT UNIQUE,
        full_name TEXT,
        avatar_url TEXT,
        role TEXT,
        preferences JSONB DEFAULT '{}',
        last_login TIMESTAMP WITH TIME ZONE,
        login_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      
      DO $$ 
      BEGIN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
        DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
        DROP POLICY IF EXISTS "Enable select for authenticated users" ON profiles;
        DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
        
        -- Create new policies
        CREATE POLICY "Enable insert for authenticated users" 
          ON profiles 
          FOR INSERT 
          TO authenticated 
          WITH CHECK (id = auth.uid());
        
        CREATE POLICY "Enable select for authenticated users" 
          ON profiles 
          FOR SELECT 
          TO authenticated 
          USING (true);
        
        CREATE POLICY "Enable update for own profile" 
          ON profiles 
          FOR UPDATE 
          TO authenticated 
          USING (id = auth.uid());
      END $$;
    `;
    
    const success = await executeSql(profilesSql);
    if (success) {
      console.log('✅ Profiles table and policies created or updated');
    } else {
      console.warn('⚠️ Warning setting up profiles table');
    }
    
    // Apply each schema file
    const supabaseDirPath = path.join(__dirname, '..', 'supabase');
    for (const sqlFile of SQL_FILES) {
      const filePath = path.join(supabaseDirPath, sqlFile);
      console.log(`\nApplying schema from: ${sqlFile}`);
      
      try {
        const sqlContent = await fs.readFile(filePath, 'utf8');
        const success = await executeSql(sqlContent);
        
        if (success) {
          console.log(`✅ Successfully applied ${sqlFile}`);
        } else {
          console.warn(`⚠️ Warning applying ${sqlFile}`);
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.warn(`File not found: ${sqlFile}`);
        } else {
          console.error(`Error applying ${sqlFile}:`, err);
        }
      }
    }
    
    console.log('\n=== Schema Application Complete ===');
    
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main().catch(console.error); 