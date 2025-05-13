import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext.jsx";
import { v4 as uuidv4 } from 'uuid';
import { useSupabaseData } from './useSupabaseHook';

// Add global cache to remember missing tables across app sessions
// This prevents repeated failed queries to non-existent tables
const MISSING_TABLES_CACHE = {
  'collaborative_documents': false,
  'document_versions': false,
  'chat_messages': false,
  'document_collaborators': false
};

// Sample mock data for initial state
const MOCK_DOCUMENTS: CollaborativeDocument[] = [
  {
    id: "doc-1",
    title: "Lesson Plan: Introduction to Photosynthesis",
    content: "# Introduction to Photosynthesis\n\nThis lesson introduces students to the basic concepts of photosynthesis.\n\n## Learning Objectives\n\n- Understand the process of photosynthesis\n- Identify the key components involved\n- Explain how plants convert light energy into chemical energy",
    type: "lesson",
    version: 3,
    last_modified: new Date(Date.now() - 86400000).toISOString(),
    created_by: "user-1",
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    team_id: "team-1"
  },
  {
    id: "doc-2",
    title: "Weekly Quiz: Cell Biology",
    content: "# Cell Biology Quiz\n\n1. What is the powerhouse of the cell?\n2. Name three organelles found in a eukaryotic cell.\n3. Explain the difference between passive and active transport.",
    type: "assessment",
    version: 2,
    last_modified: new Date(Date.now() - 3 * 86400000).toISOString(),
    created_by: "user-1",
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    team_id: "team-1"
  },
  {
    id: "doc-3",
    title: "Project Rubric: Scientific Method Report",
    content: "# Scientific Method Report Rubric\n\n## Research Question (20%)\n- Excellent: Question is clear, focused, and testable\n- Good: Question is clear and testable\n- Needs Improvement: Question is unclear or difficult to test\n\n## Methodology (30%)\n- Excellent: Methods are clearly explained and appropriate\n- Good: Methods are appropriate but explanation lacks detail\n- Needs Improvement: Methods are inappropriate or poorly explained",
    type: "rubric",
    version: 1,
    last_modified: new Date(Date.now() - 5 * 86400000).toISOString(),
    created_by: "user-1",
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    team_id: "team-1"
  }
];

const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    document_id: "doc-1",
    user_id: "user-2",
    message: "I really like how you structured this lesson plan!",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: "msg-2",
    document_id: "doc-1",
    user_id: "user-1",
    message: "Thanks! I added some more details about the light-dependent reactions.",
    created_at: new Date(Date.now() - 1.5 * 86400000).toISOString()
  },
  {
    id: "msg-3",
    document_id: "doc-1",
    user_id: "user-3",
    message: "Could we add some diagrams to help visual learners?",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

const MOCK_VERSIONS: DocumentVersion[] = [
  {
    id: "ver-1",
    document_id: "doc-1",
    version_number: 3,
    content: "# Introduction to Photosynthesis\n\nThis lesson introduces students to the basic concepts of photosynthesis.\n\n## Learning Objectives\n\n- Understand the process of photosynthesis\n- Identify the key components involved\n- Explain how plants convert light energy into chemical energy",
    created_by: "user-1",
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "ver-2",
    document_id: "doc-1",
    version_number: 2,
    content: "# Introduction to Photosynthesis\n\nThis lesson introduces students to the basic concepts of photosynthesis.\n\n## Learning Objectives\n\n- Understand the process of photosynthesis\n- Identify the key components involved",
    created_by: "user-1",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: "ver-3",
    document_id: "doc-1",
    version_number: 1,
    content: "# Introduction to Photosynthesis\n\nThis lesson introduces students to the basic concepts of photosynthesis.",
    created_by: "user-1",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

interface CollaborativeDocument {
  id: string;
  title: string;
  content: string;
  type: "lesson" | "assessment" | "rubric" | "note";
  version: number;
  last_modified: string;
  created_by: string;
  created_at: string;
  team_id: string;
}

interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  content: string;
  created_by: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  document_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

interface CollaboratorPresence {
  id: string;
  document_id: string;
  user_id: string;
  last_active: string;
  cursor_position?: number;
  is_typing?: boolean;
}

export const useRealTimeCollaboration = (teamId?: string) => {
  const { user, isAuthenticated } = useAuth();
  const [documents, setDocuments] = useState<CollaborativeDocument[]>([]);
  const [currentDocument, setCurrentDocument] = useState<CollaborativeDocument | null>(null);
  const [documentContent, setDocumentContent] = useState("");
  const [documentHistory, setDocumentHistory] = useState<DocumentVersion[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeCollaborators, setActiveCollaborators] = useState<CollaboratorPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);
  // Add new state to track if tables exist
  const [tablesMissing, setTablesMissing] = useState<Record<string, boolean>>(MISSING_TABLES_CACHE);

  const subscriptionRef = useRef<any>(null);
  const presenceChannelRef = useRef<any>(null);
  const chatChannelRef = useRef<any>(null);
  const documentContentRef = useRef(documentContent);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingOperationRef = useRef(false);
  const lastRequestTimeRef = useRef<Record<string, number>>({});
  
  // Memoize team ID to prevent unnecessary re-renders
  const memoizedTeamId = useMemo(() => teamId, [teamId]);
  
  // Update ref when content changes to prevent closure issues
  useEffect(() => {
    documentContentRef.current = documentContent;
  }, [documentContent]);
  
  // Use local storage fallback with memoized results
  const { 
    data: localDocuments, 
    addItem: addLocalDocument, 
    updateItem: updateLocalDocument,
    queryByField: queryLocalDocuments
  } = useSupabaseData<CollaborativeDocument>(
    'collaborative_documents', 
    'edgenie_collaborative_documents', 
    MOCK_DOCUMENTS, // Use mock data as default
    true
  );
  
  const { 
    data: localVersions, 
    addItem: addLocalVersion,
    queryByField: queryLocalVersions 
  } = useSupabaseData<DocumentVersion>(
    'document_versions', 
    'edgenie_document_versions', 
    MOCK_VERSIONS, // Use mock data as default
    true
  );
  
  const { 
    data: localMessages, 
    addItem: addLocalMessage 
  } = useSupabaseData<ChatMessage>(
    'chat_messages', 
    'edgenie_chat_messages', 
    MOCK_CHAT_MESSAGES, // Use mock data as default
    true
  );
  
  // Fetch documents with debounce to prevent multiple simultaneous requests
  const fetchDocuments = useCallback(async () => {
    if (!isAuthenticated && !user) {
      // Don't load data if not authenticated - will show login screen
      setLoading(false);
      return;
    }
    
    if (loadingOperationRef.current) {
      return; // Prevent concurrent fetch operations
    }

    // Throttle requests to prevent excessive API calls
    const now = Date.now();
    const lastRequest = lastRequestTimeRef.current['documents'] || 0;
    if (now - lastRequest < 2000) { // 2 second minimum between requests
      return;
    }
    lastRequestTimeRef.current['documents'] = now;
    
    console.log("Fetching documents for team:", memoizedTeamId);
    
    // Set a minimum loading time to prevent flickering
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    loadingOperationRef.current = true;
    setLoading(true);
    
    try {
      // Add a shorter simulated delay to show loading state consistently
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Skip Supabase if we already know the table is missing
      if (tablesMissing['collaborative_documents']) {
        console.log("Using localStorage directly - table previously not found");
        if (memoizedTeamId) {
          const result = await queryLocalDocuments('team_id', memoizedTeamId);
          setDocuments(result && result.length > 0 ? result : MOCK_DOCUMENTS);
        } else {
          setDocuments(localDocuments.length > 0 ? localDocuments : MOCK_DOCUMENTS);
        }
      } else {
        // Try Supabase first
        try {
          const { data, error } = await supabase
            .from('collaborative_documents')
            .select('*')
            .eq('team_id', memoizedTeamId || '')
            .order('last_modified', { ascending: false });
            
          if (error) {
            // Check for specific error indicating table doesn't exist
            if (error.code === '42P01') {
              // Update cache for future requests
              setTablesMissing(prev => ({ ...prev, 'collaborative_documents': true }));
              MISSING_TABLES_CACHE['collaborative_documents'] = true;
              
              // Log once instead of repeatedly
              console.log("Table 'collaborative_documents' does not exist, using localStorage fallback");
              throw error;
            } else {
              throw error;
            }
          }
          
          if (data && data.length > 0) {
            setDocuments(data);
            console.log("Documents fetched successfully from Supabase:", data.length);
          } else {
            // Use mock data if no documents found in Supabase
            if (memoizedTeamId) {
              const result = await queryLocalDocuments('team_id', memoizedTeamId);
              setDocuments(result && result.length > 0 ? result : MOCK_DOCUMENTS);
            } else {
              setDocuments(localDocuments.length > 0 ? localDocuments : MOCK_DOCUMENTS);
            }
          }
        } catch (err) {
          console.error("Error fetching from Supabase, using local fallback:", err);
          // Use local fallback
          if (memoizedTeamId) {
            const result = await queryLocalDocuments('team_id', memoizedTeamId);
            setDocuments(result && result.length > 0 ? result : MOCK_DOCUMENTS);
          } else {
            setDocuments(localDocuments.length > 0 ? localDocuments : MOCK_DOCUMENTS);
          }
        }
      }
    } catch (error) {
      console.error("Error in fetchDocuments:", error);
      setError(error as Error);
    } finally {
      // Use timeout to ensure minimum loading time
      const endTime = Date.now();
      const startTime = lastRequestTimeRef.current['documents'] || 0;
      const elapsed = endTime - startTime;
      const minLoadTime = 500; // Minimum loading time in ms
      
      const remainingTime = Math.max(0, minLoadTime - elapsed);
      
      loadingTimeoutRef.current = setTimeout(() => {
        setLoading(false);
        loadingOperationRef.current = false;
        loadingTimeoutRef.current = null;
      }, remainingTime);
    }
  }, [isAuthenticated, user, memoizedTeamId, localDocuments, queryLocalDocuments, tablesMissing]);
  
  // Main fetch effect - use fetchDocuments callback
  useEffect(() => {
    fetchDocuments();
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      loadingOperationRef.current = false;
    };
  }, [fetchDocuments]);
  
  // Memoize helper functions to prevent unecessary re-renders
  const fetchDocumentHistory = useCallback(async (documentId: string): Promise<DocumentVersion[]> => {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.error("Error fetching document history:", err);
    }
    
    // Try local storage
    const localVersionHistory = await queryLocalVersions('document_id', documentId);
    if (localVersionHistory && localVersionHistory.length > 0) {
      return localVersionHistory;
    }
    
    // Use mock data as final fallback
    return MOCK_VERSIONS.filter(ver => ver.document_id === documentId);
  }, [queryLocalVersions]);
  
  const fetchChatMessages = useCallback(async (documentId: string): Promise<ChatMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.error("Error fetching chat messages:", err);
    }
    
    // Use messages from local storage as fallback
    const localChatMessages = localMessages.filter(msg => msg.document_id === documentId);
    if (localChatMessages.length > 0) {
      return localChatMessages;
    }
    
    // Use mock data as final fallback
    return MOCK_CHAT_MESSAGES.filter(msg => msg.document_id === documentId);
  }, [localMessages]);
  
  // Select document and fetch related data
  const selectDocument = useCallback(async (documentId: string) => {
    if (!documentId) return null;
    if (loadingOperationRef.current) return null;
    
    loadingOperationRef.current = true;
    try {
      setLoading(true);
      
      // Find document in state first
      let document = documents.find(doc => doc.id === documentId);
      
      if (!document) {
        // Try to fetch from supabase
        try {
          const { data, error } = await supabase
            .from('collaborative_documents')
            .select('*')
            .eq('id', documentId)
            .single();
            
          if (error) throw error;
          document = data;
        } catch (err) {
          console.error("Error fetching from Supabase, using local fallback:", err);
          // Fallback to local storage
          const localDoc = localDocuments.find(doc => doc.id === documentId);
          if (!localDoc) {
            // Final fallback - check mock data
            const mockDoc = MOCK_DOCUMENTS.find(doc => doc.id === documentId);
            if (!mockDoc) throw new Error("Document not found");
            document = mockDoc;
          } else {
            document = localDoc;
          }
        }
      }
      
      // Only update state if document has changed to avoid unnecessary re-renders
      if (!currentDocument || currentDocument.id !== document.id) {
        setCurrentDocument(document);
        setDocumentContent(document.content);
      }
      
      // Fetch document history and chat messages in parallel
      const [historyResult, chatResult] = await Promise.allSettled([
        fetchDocumentHistory(documentId),
        fetchChatMessages(documentId)
      ]);
      
      if (historyResult.status === 'fulfilled' && historyResult.value) {
        setDocumentHistory(historyResult.value);
      }
      
      if (chatResult.status === 'fulfilled' && chatResult.value) {
        setChatMessages(chatResult.value);
      }
      
      // Set up real-time subscriptions
      setupRealTimeSubscriptions(documentId);
      
      // Update user presence
      updatePresence(documentId);
      
      return document;
    } catch (err) {
      console.error("Error selecting document:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      // Debounce loading state to prevent flickering
      setTimeout(() => {
        setLoading(false);
        loadingOperationRef.current = false;
      }, 500);
    }
  }, [documents, currentDocument, localDocuments, fetchDocumentHistory, fetchChatMessages]);
  
  // Clean up subscriptions when unmounting
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      
      if (presenceChannelRef.current) {
        presenceChannelRef.current.unsubscribe();
      }
      
      if (chatChannelRef.current) {
        chatChannelRef.current.unsubscribe();
      }
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);
  
  // Setup real-time subscriptions for document changes, presence, and chat
  const setupRealTimeSubscriptions = (documentId: string) => {
    // Clean up existing subscriptions
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }
    
    if (presenceChannelRef.current) {
      presenceChannelRef.current.unsubscribe();
    }
    
    if (chatChannelRef.current) {
      chatChannelRef.current.unsubscribe();
    }
    
    try {
      // Subscribe to document changes
      subscriptionRef.current = supabase
        .channel(`document-${documentId}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'collaborative_documents',
          filter: `id=eq.${documentId}`
        }, (payload) => {
          console.log('Document updated:', payload);
          if (payload.new && payload.new.id === documentId) {
            // Only update if not by the current user to avoid conflicts
            if (payload.new.last_modified_by !== user?.id) {
              setCurrentDocument(payload.new as CollaborativeDocument);
              setDocumentContent(payload.new.content);
            }
          }
        })
        .subscribe();
        
      // Set up presence channel
      presenceChannelRef.current = supabase
        .channel(`presence-${documentId}`)
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannelRef.current.presenceState();
          const presentUsers = Object.keys(state).map(key => {
            return state[key][0];
          });
          
          setActiveCollaborators(presentUsers);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && user) {
            await presenceChannelRef.current.track({
              user_id: user.id,
              document_id: documentId,
              last_active: new Date().toISOString(),
              online_at: new Date().getTime()
            });
          }
        });
        
      // Subscribe to chat messages
      chatChannelRef.current = supabase
        .channel(`chat-${documentId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `document_id=eq.${documentId}`
        }, (payload) => {
          console.log('New chat message:', payload);
          if (payload.new) {
            setChatMessages(prev => [...prev, payload.new as ChatMessage]);
          }
        })
        .subscribe();
    } catch (err) {
      console.error("Error setting up real-time subscriptions:", err);
    }
  };
  
  // Update user presence in the document
  const updatePresence = async (documentId: string) => {
    if (!user || !documentId) return;
    
    try {
      if (presenceChannelRef.current) {
        await presenceChannelRef.current.track({
          user_id: user.id,
          document_id: documentId,
          last_active: new Date().toISOString(),
          online_at: new Date().getTime()
        });
      }
    } catch (err) {
      console.error("Error updating presence:", err);
    }
  };
  
  // Create a new document
  const createDocument = async (
    title: string, 
    content: string = "", 
    type: "lesson" | "assessment" | "rubric" | "note" = "note"
  ) => {
    if (!user || !isAuthenticated) {
      throw new Error("You must be authenticated to create a document");
    }
    
    try {
      const now = new Date().toISOString();
      const newDocument: Omit<CollaborativeDocument, 'id' | 'created_at'> = {
        title,
        content,
        type,
        version: 1,
        last_modified: now,
        created_by: user.id,
        team_id: teamId || user.id
      };
      
      // Try to save to Supabase
      try {
        const { data, error } = await supabase
          .from('collaborative_documents')
          .insert(newDocument)
          .select()
          .single();
          
        if (error) throw error;
        
        if (data) {
          setDocuments(prev => [data, ...prev]);
          return data;
        }
      } catch (err) {
        console.error("Error saving to Supabase, using local fallback:", err);
        // Save to local storage as fallback
        const localDoc = await addLocalDocument(newDocument as any);
        setDocuments(prev => [localDoc, ...prev]);
        return localDoc;
      }
    } catch (err) {
      console.error("Error creating document:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  };
  
  // Save document changes
  const saveDocument = async (content: string) => {
    if (!currentDocument || !user) return null;
    
    try {
      const now = new Date().toISOString();
      
      // Create new version record
      const versionData: Omit<DocumentVersion, 'id' | 'created_at'> = {
        document_id: currentDocument.id,
        version_number: currentDocument.version + 1,
        content: currentDocument.content, // Save previous version
        created_by: user.id
      };
      
      // Update document data
      const documentUpdate = {
        content,
        version: currentDocument.version + 1,
        last_modified: now,
        last_modified_by: user.id
      };
      
      // Try to save to Supabase
      try {
        // Save version history
        const { error: versionError } = await supabase
          .from('document_versions')
          .insert(versionData);
          
        if (versionError) throw versionError;
        
        // Update document
        const { data, error } = await supabase
          .from('collaborative_documents')
          .update(documentUpdate)
          .eq('id', currentDocument.id)
          .select()
          .single();
          
        if (error) throw error;
        
        if (data) {
          // Update state
          setCurrentDocument(data);
          setDocumentContent(data.content);
          
          // Update documents list
          setDocuments(prev => 
            prev.map(doc => doc.id === data.id ? data : doc)
          );
          
          // Fetch updated version history
          const { data: versions } = await supabase
            .from('document_versions')
            .select('*')
            .eq('document_id', currentDocument.id)
            .order('version_number', { ascending: false });
            
          if (versions) {
            setDocumentHistory(versions);
          }
          
          return data;
        }
      } catch (err) {
        console.error("Error saving to Supabase, using local fallback:", err);
        
        // Save version to local storage
        await addLocalVersion(versionData as any);
        
        // Update document in local storage
        const updatedDoc = await updateLocalDocument(
          currentDocument.id, 
          documentUpdate
        );
        
        if (updatedDoc) {
          // Update state
          setCurrentDocument(updatedDoc);
          setDocumentContent(updatedDoc.content);
          
          // Update documents list
          setDocuments(prev => 
            prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc)
          );
          
          // Get updated version history
          const versions = await queryLocalVersions('document_id', currentDocument.id);
          if (versions) {
            setDocumentHistory(versions);
          }
          
          return updatedDoc;
        }
      }
      
      return null;
    } catch (err) {
      console.error("Error saving document:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  };
  
  // Send a chat message
  const sendChatMessage = async (message: string) => {
    if (!currentDocument || !user || !message.trim()) return null;
    
    try {
      const newMessage: Omit<ChatMessage, 'id' | 'created_at'> = {
        document_id: currentDocument.id,
        user_id: user.id,
        message: message.trim()
      };
      
      // Try to save to Supabase
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .insert(newMessage)
          .select()
          .single();
          
        if (error) throw error;
        
        if (data) {
          setChatMessages(prev => [...prev, data]);
          return data;
        }
      } catch (err) {
        console.error("Error saving to Supabase, using local fallback:", err);
        // Save to local storage as fallback
        const localMessage = await addLocalMessage(newMessage as any);
        setChatMessages(prev => [...prev, localMessage]);
        return localMessage;
      }
      
      return null;
    } catch (err) {
      console.error("Error sending chat message:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  };
  
  // Load a specific version of a document
  const loadDocumentVersion = async (versionId: string) => {
    try {
      // Find in local state first
      let version = documentHistory.find(v => v.id === versionId);
      
      if (!version) {
        // Try to fetch from Supabase
        try {
          const { data, error } = await supabase
            .from('document_versions')
            .select('*')
            .eq('id', versionId)
            .single();
            
          if (error) throw error;
          version = data;
        } catch (err) {
          console.error("Error fetching from Supabase, using local fallback:", err);
          // Try to find in local storage
          const localVersions = await queryLocalVersions('id', versionId);
          if (!localVersions || localVersions.length === 0) throw new Error("Version not found");
          version = localVersions[0];
        }
      }
      
      if (version) {
        // Just update the content in the editor, don't save it
        setDocumentContent(version.content);
        return version;
      }
      
      return null;
    } catch (err) {
      console.error("Error loading document version:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  };
  
  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    documents,
    currentDocument,
    documentContent,
    setDocumentContent,
    documentHistory,
    chatMessages,
    activeCollaborators,
    loading,
    error,
    selectDocument,
    createDocument,
    saveDocument,
    sendChatMessage,
    loadDocumentVersion
  }), [
    documents,
    currentDocument,
    documentContent,
    documentHistory,
    chatMessages,
    activeCollaborators,
    loading,
    error,
    selectDocument,
    createDocument,
    saveDocument,
    sendChatMessage,
    loadDocumentVersion
  ]);
}; 