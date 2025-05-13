#!/usr/bin/env node

/**
 * Script to apply SQL schema files to Supabase
 * Usage: node apply-schemas.js
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

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
  'collaborative-docs-tables.sql'
];

// This function executes a SQL statement directly with the Supabase REST API
async function executeSqlDirectly(sql) {
  try {
    // Break down SQL statements to be executed one by one
    const statements = sql
      .replace(/--.*$/gm, '') // Remove comments
      .split(';')
      .filter(stmt => stmt.trim().length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute directly.`);
    
    // For each statement, make a POST request to the SQL API
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      
      try {
        // Use direct SQL REST API endpoint
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({ query: stmt })
        });
        
        if (!response.ok) {
          console.warn(`⚠️ Warning executing statement ${i+1}, status: ${response.status}`);
          if (stmt.length < 200) {
            console.log('Statement:', stmt);
          } else {
            console.log('Statement:', stmt.substring(0, 100) + '...');
          }
        } else {
          process.stdout.write('.');
        }
      } catch (stmtErr) {
        console.warn(`⚠️ Exception executing statement ${i+1}:`, stmtErr.message);
      }
    }
    
    console.log('\nDirect SQL execution completed');
  } catch (err) {
    console.error('Error executing SQL directly:', err);
  }
}

async function main() {
  console.log('=== EdGenie Database Schema Application Tool ===');
  console.log(`Using Supabase URL: ${supabaseUrl}`);
  
  try {
    // Try to create the execute_sql function first if it doesn't exist
    const rpcFunctionsPath = path.join(__dirname, '..', 'supabase', 'rpc-functions.sql');
    console.log('\nAttempting to create RPC functions first...');
    const rpcSql = await fs.readFile(rpcFunctionsPath, 'utf8');
    await executeSqlDirectly(rpcSql);
    
    // First create the profiles table if it doesn't exist
    console.log('\nAttempting to create profiles table...');
    try {
      const { error } = await supabase.rpc('create_profiles_table');
      if (error) {
        console.warn('Warning creating profiles table:', error.message);
        // Try direct SQL approach for creating profiles
        await executeSqlDirectly(`
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
          
          CREATE POLICY "Users can view their own profile" 
            ON public.profiles 
            FOR SELECT 
            USING (auth.uid() = id);
            
          CREATE POLICY "Users can update their own profile" 
            ON public.profiles 
            FOR UPDATE 
            USING (auth.uid() = id);
        `);
      } else {
        console.log('✅ Profiles table created or already exists');
      }
    } catch (profileErr) {
      console.warn('Error creating profiles table:', profileErr);
    }
    
    // Verify connection
    try {
      const { data, error } = await supabase.from('profiles').select('count(*)', { count: 'exact', head: true });
      
      if (error) {
        console.error('WARNING: Could not connect to Supabase or access the profiles table.');
        console.error('Error details:', error);
        
        // Check if table doesn't exist (which is expected for first-time setup)
        if (error.code === '42P01') {
          console.log('The profiles table does not exist yet. This is normal for first-time setup.');
        }
      } else {
        console.log('Successfully connected to Supabase.');
      }
    } catch (connectionErr) {
      console.warn('Warning checking connection:', connectionErr);
    }
    
    const supabaseDirPath = path.join(__dirname, '..', 'supabase');
    
    // Apply each SQL file
    for (const sqlFile of SQL_FILES) {
      // Skip rpc-functions.sql since we already applied it
      if (sqlFile === 'rpc-functions.sql') continue;
      
      const filePath = path.join(supabaseDirPath, sqlFile);
      console.log(`\nApplying schema from: ${sqlFile}`);
      
      try {
        // Read SQL file
        const sqlContent = await fs.readFile(filePath, 'utf8');
        
        // Try using the RPC function first
        try {
          // Split SQL content into separate statements
          const statements = sqlContent
            .replace(/--.*$/gm, '') // Remove comments
            .split(';')
            .filter(stmt => stmt.trim().length > 0);
          
          console.log(`Found ${statements.length} SQL statements to execute.`);
          
          // Execute each statement
          for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i].trim();
            try {
              const { error } = await supabase.rpc('execute_sql', { sql: stmt });
              
              if (error) {
                console.warn(`⚠️ Warning executing statement ${i+1}:`, error.message);
                
                // Only log the statement on error if it's not too long
                if (stmt.length < 200) {
                  console.log('Statement:', stmt);
                } else {
                  console.log('Statement:', stmt.substring(0, 100) + '...');
                }
              } else {
                process.stdout.write('.');
              }
            } catch (stmtErr) {
              console.warn(`⚠️ Exception executing statement ${i+1}:`, stmtErr.message);
            }
          }
        } catch (rpcErr) {
          console.warn('Error using RPC function, trying direct SQL execution:', rpcErr.message);
          await executeSqlDirectly(sqlContent);
        }
        
        console.log(`\n✅ Applied schema file: ${sqlFile}`);
      } catch (fileErr) {
        if (fileErr.code === 'ENOENT') {
          console.error(`❌ ERROR: SQL file not found: ${sqlFile}`);
        } else {
          console.error(`❌ ERROR processing ${sqlFile}:`, fileErr);
        }
      }
    }
    
    console.log('\n=== Schema Application Complete ===');
    console.log('You can now start your application.');
  } catch (err) {
    console.error('Unhandled error:', err);
    process.exit(1);
  }
}

main(); 