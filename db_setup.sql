-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'teacher', 'admin', 'student')),
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own profile
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Policy for users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create collaborative documents table
CREATE TABLE IF NOT EXISTS public.collaborative_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  document_type TEXT NOT NULL DEFAULT 'document',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Create document collaborators table
CREATE TABLE IF NOT EXISTS public.document_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.collaborative_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

-- Create document messages table
CREATE TABLE IF NOT EXISTS public.document_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.collaborative_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.collaborative_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_messages ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies for collaborative documents
CREATE POLICY "Users can view their documents"
  ON public.collaborative_documents
  FOR SELECT
  USING (created_by = auth.uid() OR is_public = true);

CREATE POLICY "Users can create documents"
  ON public.collaborative_documents
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their documents"
  ON public.collaborative_documents
  FOR UPDATE
  USING (created_by = auth.uid());

-- Simple RLS policies for document history
CREATE POLICY "Users can view history of their documents"
  ON public.document_history
  FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM public.collaborative_documents WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create history entries for their documents"
  ON public.document_history
  FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM public.collaborative_documents WHERE created_by = auth.uid()
    )
  );

-- Simple RLS policies for document collaborators
CREATE POLICY "Collaborators can view documents"
  ON public.document_collaborators
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    document_id IN (SELECT id FROM public.collaborative_documents WHERE created_by = auth.uid())
  );

CREATE POLICY "Document owners can add collaborators"
  ON public.document_collaborators
  FOR INSERT
  WITH CHECK (
    document_id IN (SELECT id FROM public.collaborative_documents WHERE created_by = auth.uid())
  );

CREATE POLICY "Document owners can update collaborator permissions"
  ON public.document_collaborators
  FOR UPDATE
  USING (
    document_id IN (SELECT id FROM public.collaborative_documents WHERE created_by = auth.uid())
  );

-- Simple RLS policies for document messages
CREATE POLICY "Users can view messages in their documents"
  ON public.document_messages
  FOR SELECT
  USING (
    document_id IN (SELECT id FROM public.collaborative_documents WHERE created_by = auth.uid()) OR
    document_id IN (SELECT document_id FROM public.document_collaborators WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can send messages to their documents"
  ON public.document_messages
  FOR INSERT
  WITH CHECK (
    document_id IN (SELECT id FROM public.collaborative_documents WHERE created_by = auth.uid()) OR
    document_id IN (SELECT document_id FROM public.document_collaborators WHERE user_id = auth.uid())
  ); 