#!/usr/bin/env node

/**
 * Direct SQL execution script for Supabase
 * This script bypasses the need for RPC functions by using the REST API
 * Usage: node direct-sql-setup.js
 */

import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get current file and directory path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Check configuration
if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Supabase URL or key is missing in environment variables.');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

// SQL files for schema setup
const SQL_FILES = [
  'collaborative-docs-tables.sql'
];

// Main function
async function main() {
  console.log('=== EdGenie Direct SQL Setup ===');
  console.log(`Using Supabase URL: ${supabaseUrl}`);
  
  // Create profiles table first (minimal version that we need)
  console.log('\nCreating profiles table...');
  try {
    // First try to create profiles table directly
    const profileTableSql = `
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT,
        full_name TEXT,
        avatar_url TEXT,
        role TEXT,
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Enable RLS
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      CREATE POLICY "Users can view their own profile" 
        ON public.profiles 
        FOR SELECT 
        USING (auth.uid() = id);
        
      CREATE POLICY "Users can update their own profile" 
        ON public.profiles 
        FOR UPDATE 
        USING (auth.uid() = id);
        
      CREATE POLICY "Users can insert their own profile" 
        ON public.profiles 
        FOR INSERT 
        WITH CHECK (auth.uid() = id);
    `;
    
    // Use the SQL REST endpoint
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: profileTableSql })
    });
    
    if (!profileResponse.ok) {
      console.warn(`Warning creating profiles table: ${profileResponse.status}`);
      console.log('Continuing with other tables...');
    } else {
      console.log('✅ Profiles table created or already exists');
    }
  } catch (profileErr) {
    console.warn('Error creating profiles table:', profileErr);
  }
  
  // Apply each schema file
  for (const sqlFile of SQL_FILES) {
    const filePath = path.join(__dirname, '..', 'supabase', sqlFile);
    console.log(`\nApplying schema from: ${sqlFile}`);
    
    try {
      // Read SQL file
      const sqlContent = await fs.readFile(filePath, 'utf8');
      
      // Try to execute SQL directly using SQL API
      try {
        // Convert the SQL file into individual statements
        const statements = sqlContent
          .replace(/--.*$/gm, '') // Remove comments
          .split(';')
          .filter(stmt => stmt.trim().length > 0)
          .map(stmt => stmt.trim());
        
        console.log(`Found ${statements.length} SQL statements to execute.`);
        
        // Execute each statement
        let successCount = 0;
        for (let i = 0; i < statements.length; i++) {
          const stmt = statements[i];
          
          // Skip empty statements
          if (!stmt.trim()) continue;
          
          try {
            // Make a direct POST request to REST API
            const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
              },
              body: JSON.stringify({ query: stmt })
            });
            
            if (!response.ok) {
              console.warn(`⚠️ Statement ${i+1} failed with status ${response.status}`);
              
              // If the statement is too long, show a truncated version
              if (stmt.length > 100) {
                console.log('Statement:', stmt.substring(0, 100) + '...');
              } else {
                console.log('Statement:', stmt);
              }
              
              // Try to get error details
              try {
                const errorJson = await response.json();
                console.log('Error details:', JSON.stringify(errorJson, null, 2));
              } catch (e) {
                // Ignore error parsing issues
              }
            } else {
              process.stdout.write('.');
              successCount++;
            }
          } catch (stmtErr) {
            console.warn(`⚠️ Error executing statement ${i+1}:`, stmtErr.message);
          }
        }
        
        console.log(`\n✅ Applied schema file: ${sqlFile} (${successCount}/${statements.length} statements successful)`);
      } catch (execErr) {
        console.error(`❌ Error executing SQL:`, execErr);
      }
    } catch (fileErr) {
      if (fileErr.code === 'ENOENT') {
        console.error(`❌ ERROR: SQL file not found: ${sqlFile}`);
      } else {
        console.error(`❌ ERROR processing ${sqlFile}:`, fileErr);
      }
    }
  }
  
  // Create simpler version of the tables if needed
  console.log('\nCreating simplified version of tables...');
  
  const simplifiedTablesSql = `
    -- Create the collaborative documents table
    CREATE TABLE IF NOT EXISTS public.collaborative_documents (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      document_type TEXT NOT NULL DEFAULT 'document',
      version INTEGER NOT NULL DEFAULT 1,
      created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create document history table
    CREATE TABLE IF NOT EXISTS public.document_history (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      document_id UUID NOT NULL REFERENCES public.collaborative_documents(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      version INTEGER NOT NULL,
      created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create document messages table
    CREATE TABLE IF NOT EXISTS public.document_messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      document_id UUID NOT NULL REFERENCES public.collaborative_documents(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Enable Row Level Security
    ALTER TABLE public.collaborative_documents ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.document_history ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.document_messages ENABLE ROW LEVEL SECURITY;
    
    -- Create basic RLS policies
    CREATE POLICY "Users can view documents"
      ON public.collaborative_documents
      FOR SELECT
      USING (true);
      
    CREATE POLICY "Users can insert their own documents"
      ON public.collaborative_documents
      FOR INSERT
      WITH CHECK (auth.uid() = created_by);
      
    CREATE POLICY "Users can update their own documents"
      ON public.collaborative_documents
      FOR UPDATE
      USING (auth.uid() = created_by);
  `;
  
  try {
    // Send the simplified SQL to Supabase
    const simplifiedResponse = await fetch(`${supabaseUrl}/rest/v1/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: simplifiedTablesSql })
    });
    
    if (!simplifiedResponse.ok) {
      console.warn(`Warning creating simplified tables: ${simplifiedResponse.status}`);
    } else {
      console.log('✅ Simplified tables created successfully');
    }
  } catch (err) {
    console.warn('Error creating simplified tables:', err);
  }
  
  console.log('\n=== Schema Setup Complete ===');
  console.log('You can now start your application.');
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 