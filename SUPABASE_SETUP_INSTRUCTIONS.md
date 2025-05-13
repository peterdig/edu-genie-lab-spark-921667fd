# Supabase Setup Instructions for EduGenie

Follow these instructions to properly set up your Supabase database for the EduGenie application.

## Step 1: Verify Environment Variables

Ensure your `.env` file contains the correct Supabase URL and anon key:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Step 2: Set Up Database Tables

To create all the required tables and policies for EduGenie, run the SQL script in the Supabase SQL Editor:

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the contents of the `db_setup.sql` file (included in this project)
6. Run the query

## Step 3: Configure Authentication

1. Go to Authentication > Settings > Auth Providers
2. Enable Email/Password sign-up
3. Optionally, configure additional auth providers like Google, GitHub, etc.

## Step 4: Update RLS Policies (if needed)

If you encounter policy recursion errors:

1. Go to Database > Tables
2. For each table mentioned in the error:
   - Click on the table name
   - Go to "Policies" tab
   - Delete any policies causing recursion
   - Add simplified policies using the SQL below

## Common Issues and Solutions

### RLS Policy Recursion Errors

If you see errors with code '42P17' related to infinite recursion in policies, you can fix them by simplifying your policies:

```sql
-- For document_collaborators table
DROP POLICY IF EXISTS "Users can view collaborators for their documents" ON public.document_collaborators;
CREATE POLICY "Users can view collaborators for their documents"
  ON public.document_collaborators
  FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.collaborative_documents 
    WHERE id = document_id AND created_by = auth.uid()
  ));
```

### Table Does Not Exist Errors

If you see errors with code '42P01' (relation does not exist):

1. Check if the table was created successfully in the Supabase dashboard
2. Run the table creation SQL again for the specific missing table
3. Verify that the application is connecting to the correct Supabase project

## Testing Your Setup

After completing the setup:

1. Restart your development server
2. Try to sign in or sign up
3. Navigate to the Collaborative Workspace to verify that document operations work
4. Check the browser console for any remaining Supabase-related errors

## Fallback Mode

The application includes a fallback mode using localStorage when Supabase is unavailable or misconfigured. This allows the app to function, but data will not be synchronized across devices or users.

To force use of the fallback mode for testing, you can temporarily remove or change the Supabase environment variables. 