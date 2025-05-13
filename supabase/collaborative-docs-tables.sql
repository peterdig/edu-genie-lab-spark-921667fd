-- Create table for collaborative documents
CREATE TABLE IF NOT EXISTS public.collaborative_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  document_type TEXT NOT NULL DEFAULT 'document',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for document revision history
CREATE TABLE IF NOT EXISTS public.document_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.collaborative_documents(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  version INTEGER NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for document collaborators
CREATE TABLE IF NOT EXISTS public.document_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.collaborative_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Add unique constraint to prevent duplicate entries
  UNIQUE(document_id, user_id)
);

-- Create table for document chat messages
CREATE TABLE IF NOT EXISTS public.document_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.collaborative_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'chat',
  is_system BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_collaborative_documents_created_by ON public.collaborative_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_document_history_document_id ON public.document_history(document_id);
CREATE INDEX IF NOT EXISTS idx_document_collaborators_document_id ON public.document_collaborators(document_id);
CREATE INDEX IF NOT EXISTS idx_document_collaborators_user_id ON public.document_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_document_messages_document_id ON public.document_messages(document_id);
CREATE INDEX IF NOT EXISTS idx_document_messages_user_id ON public.document_messages(user_id);

-- Enable Row Level Security
ALTER TABLE public.collaborative_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for collaborative_documents
CREATE POLICY "Users can view their own documents"
  ON public.collaborative_documents
  FOR SELECT
  USING (created_by = auth.uid() OR is_public = true OR EXISTS (
    SELECT 1 FROM public.document_collaborators
    WHERE document_collaborators.document_id = collaborative_documents.id
    AND document_collaborators.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own documents"
  ON public.collaborative_documents
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own documents or documents they have edit access to"
  ON public.collaborative_documents
  FOR UPDATE
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.document_collaborators
    WHERE document_collaborators.document_id = collaborative_documents.id
    AND document_collaborators.user_id = auth.uid()
    AND document_collaborators.permission IN ('edit', 'admin')
  ));

CREATE POLICY "Users can delete their own documents"
  ON public.collaborative_documents
  FOR DELETE
  USING (created_by = auth.uid());

-- Create RLS policies for document_history
CREATE POLICY "Users can view history of documents they have access to"
  ON public.document_history
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.collaborative_documents
    WHERE collaborative_documents.id = document_history.document_id
    AND (
      collaborative_documents.created_by = auth.uid()
      OR collaborative_documents.is_public = true
      OR EXISTS (
        SELECT 1 FROM public.document_collaborators
        WHERE document_collaborators.document_id = document_history.document_id
        AND document_collaborators.user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can insert history for documents they have edit access to"
  ON public.document_history
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.collaborative_documents
    WHERE collaborative_documents.id = document_history.document_id
    AND (
      collaborative_documents.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.document_collaborators
        WHERE document_collaborators.document_id = document_history.document_id
        AND document_collaborators.user_id = auth.uid()
        AND document_collaborators.permission IN ('edit', 'admin')
      )
    )
  ));

-- Create RLS policies for document_collaborators
CREATE POLICY "Users can view collaborators of documents they have access to"
  ON public.document_collaborators
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.collaborative_documents
    WHERE collaborative_documents.id = document_collaborators.document_id
    AND (
      collaborative_documents.created_by = auth.uid()
      OR collaborative_documents.is_public = true
      OR EXISTS (
        SELECT 1 FROM public.document_collaborators AS dc
        WHERE dc.document_id = document_collaborators.document_id
        AND dc.user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can manage collaborators of documents they own or are admin of"
  ON public.document_collaborators
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.collaborative_documents
    WHERE collaborative_documents.id = document_collaborators.document_id
    AND (
      collaborative_documents.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.document_collaborators AS dc
        WHERE dc.document_id = document_collaborators.document_id
        AND dc.user_id = auth.uid()
        AND dc.permission = 'admin'
      )
    )
  ));

-- Create RLS policies for document_messages
CREATE POLICY "Users can view messages of documents they have access to"
  ON public.document_messages
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.collaborative_documents
    WHERE collaborative_documents.id = document_messages.document_id
    AND (
      collaborative_documents.created_by = auth.uid()
      OR collaborative_documents.is_public = true
      OR EXISTS (
        SELECT 1 FROM public.document_collaborators
        WHERE document_collaborators.document_id = document_messages.document_id
        AND document_collaborators.user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can insert messages for documents they have access to"
  ON public.document_messages
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.collaborative_documents
      WHERE collaborative_documents.id = document_messages.document_id
      AND (
        collaborative_documents.created_by = auth.uid()
        OR collaborative_documents.is_public = true
        OR EXISTS (
          SELECT 1 FROM public.document_collaborators
          WHERE document_collaborators.document_id = document_messages.document_id
          AND document_collaborators.user_id = auth.uid()
        )
      )
    )
  );

-- Function to update updated_at on documents
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
CREATE TRIGGER update_collaborative_documents_updated_at
  BEFORE UPDATE ON public.collaborative_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to auto-create a document history entry when content changes
CREATE OR REPLACE FUNCTION log_document_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only store history if content changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO public.document_history (
      document_id,
      content,
      version,
      created_by
    ) VALUES (
      NEW.id,
      OLD.content,
      OLD.version,
      NEW.updated_by
    );
    
    -- Increment version
    NEW.version = OLD.version + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for logging document history
CREATE TRIGGER log_collaborative_documents_history
  BEFORE UPDATE ON public.collaborative_documents
  FOR EACH ROW
  EXECUTE FUNCTION log_document_history(); 