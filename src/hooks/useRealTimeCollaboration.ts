import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext.jsx";
import { v4 as uuidv4 } from 'uuid';
import { useSupabaseData } from './useSupabaseHook';
import { checkTablesExist } from "@/lib/database";

// Add global cache to remember missing tables across app sessions
// This prevents repeated failed queries to non-existent tables
const MISSING_TABLES_CACHE = {
  'collaborative_documents': false,
  'document_history': false,
  'document_messages': false,
  'document_collaborators': false
};

// Add a global document cache to persist document data between component mounts
const DOCUMENT_CACHE = new Map<string, CollaborativeDocument>();
const DOCUMENT_HISTORY_CACHE = new Map<string, DocumentVersion[]>();
const MESSAGE_CACHE = new Map<string, ChatMessage[]>();

// Sample mock data for initial state
const MOCK_DOCUMENTS: CollaborativeDocument[] = [
  {
    id: "doc-1",
    title: "Lesson Plan: Introduction to Photosynthesis",
    content: "# Introduction to Photosynthesis\n\nThis lesson introduces students to the basic concepts of photosynthesis.\n\n## Learning Objectives\n\n- Understand the process of photosynthesis\n- Identify the key components involved\n- Explain how plants convert light energy into chemical energy",
    document_type: "lesson",
    version: 3,
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    created_by: "user-1",
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_by: "user-1",
    is_archived: false,
    is_public: false,
    metadata: {}
  },
  // Keep other mock documents, but update the structure to match the database schema
  {
    id: "doc-2",
    title: "Weekly Quiz: Cell Biology",
    content: "# Cell Biology Quiz\n\n1. What is the powerhouse of the cell?\n2. Name three organelles found in a eukaryotic cell.\n3. Explain the difference between passive and active transport.",
    document_type: "assessment",
    version: 2,
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    created_by: "user-1",
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_by: "user-1",
    is_archived: false,
    is_public: false,
    metadata: {}
  },
  {
    id: "doc-3",
    title: "Project Rubric: Scientific Method Report",
    content: "# Scientific Method Report Rubric\n\n## Research Question (20%)\n- Excellent: Question is clear, focused, and testable\n- Good: Question is clear and testable\n- Needs Improvement: Question is unclear or difficult to test\n\n## Methodology (30%)\n- Excellent: Methods are clearly explained and appropriate\n- Good: Methods are appropriate but explanation lacks detail\n- Needs Improvement: Methods are inappropriate or poorly explained",
    document_type: "rubric",
    version: 1,
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    created_by: "user-1",
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_by: "user-1",
    is_archived: false,
    is_public: false,
    metadata: {}
  }
];

// Update to match database schema
const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    document_id: "doc-1",
    user_id: "user-2",
    message: "I really like how you structured this lesson plan!",
    message_type: "chat",
    is_system: false,
    metadata: {},
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: "msg-2",
    document_id: "doc-1",
    user_id: "user-1",
    message: "Thanks! I added some more details about the light-dependent reactions.",
    message_type: "chat",
    is_system: false,
    metadata: {},
    created_at: new Date(Date.now() - 1.5 * 86400000).toISOString()
  },
  {
    id: "msg-3",
    document_id: "doc-1",
    user_id: "user-3",
    message: "Could we add some diagrams to help visual learners?",
    message_type: "chat",
    is_system: false,
    metadata: {},
    created_at: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

// Update to match database schema
const MOCK_VERSIONS: DocumentVersion[] = [
  {
    id: "ver-1",
    document_id: "doc-1",
    version: 3,
    content: "# Introduction to Photosynthesis\n\nThis lesson introduces students to the basic concepts of photosynthesis.\n\n## Learning Objectives\n\n- Understand the process of photosynthesis\n- Identify the key components involved\n- Explain how plants convert light energy into chemical energy",
    created_by: "user-1",
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "ver-2",
    document_id: "doc-1",
    version: 2,
    content: "# Introduction to Photosynthesis\n\nThis lesson introduces students to the basic concepts of photosynthesis.\n\n## Learning Objectives\n\n- Understand the process of photosynthesis\n- Identify the key components involved",
    created_by: "user-1",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: "ver-3",
    document_id: "doc-1",
    version: 1,
    content: "# Introduction to Photosynthesis\n\nThis lesson introduces students to the basic concepts of photosynthesis.",
    created_by: "user-1",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

// Update interfaces to match database schema
interface CollaborativeDocument {
  id: string;
  title: string;
  content: string | any; // Can be string or JSON
  document_type: string;
  version: number;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
  is_archived: boolean;
  is_public: boolean;
  metadata: Record<string, any>;
}

interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  content: string | any;
  created_by: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  document_id: string;
  user_id: string;
  message: string;
  message_type: string;
  is_system: boolean;
  metadata: Record<string, any>;
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

// Add a helper function to check if document data needs refresh
const needsRefresh = (timestamp: number): boolean => {
  // Only refresh data if it's older than 5 minutes
  return !timestamp || Date.now() - timestamp > 5 * 60 * 1000;
};

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
  const cacheTimestampRef = useRef<Record<string, number>>({});
  
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
    queryByField: queryLocalDocuments,
    isUsingFallback
  } = useSupabaseData<CollaborativeDocument>(
    'collaborative_documents', 
    'edgenie_collaborative_documents', 
    MOCK_DOCUMENTS, // Use mock data as default
    false  // Don't force fallback - let it try to use Supabase first
  );
  
  const { 
    data: localVersions, 
    addItem: addLocalVersion,
    queryByField: queryLocalVersions 
  } = useSupabaseData<DocumentVersion>(
    'document_history', 
    'edgenie_document_versions', 
    MOCK_VERSIONS, // Use mock data as default
    false  // Don't force fallback
  );
  
  const { 
    data: localMessages, 
    addItem: addLocalMessage 
  } = useSupabaseData<ChatMessage>(
    'document_messages', 
    'edgenie_chat_messages', 
    MOCK_CHAT_MESSAGES, // Use mock data as default
    false  // Don't force fallback
  );

  // Check if required tables exist in the database
  useEffect(() => {
    const checkTables = async () => {
      if (!isAuthenticated || !user) return;
      
      // Don't check tables every time if we already know they're missing
      if (Object.values(MISSING_TABLES_CACHE).some(missing => missing)) {
        setTablesMissing(MISSING_TABLES_CACHE);
        return;
      }
      
      try {
        const tables = await checkTablesExist();
        const missingTables = {
          'collaborative_documents': !tables.collaborative_documents,
          'document_history': !tables.document_history,
          'document_messages': !tables.document_messages,
          'document_collaborators': !tables.document_collaborators
        };
        
        // Update the global cache
        Object.assign(MISSING_TABLES_CACHE, missingTables);
        setTablesMissing(missingTables);
        
        // Log missing tables
        const missing = Object.entries(missingTables)
          .filter(([_, isMissing]) => isMissing)
          .map(([table]) => table);
          
        if (missing.length > 0) {
          console.warn('Missing tables required for collaboration:', missing.join(', '));
        }
      } catch (err) {
        console.error('Error checking for required tables:', err);
      }
    };
    
    if (isAuthenticated && user) {
      checkTables();
    }
  }, [isAuthenticated, user]);
  
  // Load documents from backend with improved caching
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchDocuments = async () => {
      const cacheKey = `team_${memoizedTeamId || 'user'}`;
      const cachedTimestamp = cacheTimestampRef.current[cacheKey];
      
      // Use cached documents if available and fresh
      if (documents.length > 0 && !needsRefresh(cachedTimestamp)) {
        setLoading(false);
        setInitialized(true);
        return;
      }
      
      setLoading(true);
      loadingOperationRef.current = true;
      
      try {
        // Check if we should use Supabase or localStorage
        if (!isUsingFallback && !tablesMissing.collaborative_documents) {
          // Use Supabase
          console.log('Fetching documents from Supabase');
          const query = memoizedTeamId 
            ? supabase
                .from('collaborative_documents')
                .select('*')
                .eq('metadata->team_id', memoizedTeamId)
            : supabase
                .from('collaborative_documents')
                .select('*')
                .eq('created_by', user?.id);
                
          const { data, error } = await query;
          
          if (error) {
            if (error.code === '42P01') {
              // Table doesn't exist
              setTablesMissing(prev => ({ ...prev, collaborative_documents: true }));
              MISSING_TABLES_CACHE.collaborative_documents = true;
              console.warn('Table collaborative_documents does not exist, using local fallback');
              setDocuments(localDocuments);
            } else {
              throw error;
            }
          } else if (data && data.length > 0) {
            setDocuments(data);
            
            // Cache the data
            data.forEach(doc => {
              DOCUMENT_CACHE.set(doc.id, doc);
            });
            
            // Update cache timestamp
            cacheTimestampRef.current[cacheKey] = Date.now();
          } else {
            // No documents found, use local fallback for initial data
            console.log('No documents found in Supabase, using local fallback for initial data');
            setDocuments(localDocuments);
            cacheTimestampRef.current[cacheKey] = Date.now();
          }
        } else {
          // Use localStorage
          console.log('Using localStorage for documents');
          setDocuments(localDocuments);
          cacheTimestampRef.current[cacheKey] = Date.now();
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        // Fallback to local storage
        setDocuments(localDocuments);
      } finally {
        // Use a shorter delay for initial loading
        setTimeout(() => {
          setLoading(false);
          loadingOperationRef.current = false;
          setInitialized(true);
        }, 250);
      }
    };
    
    fetchDocuments();
  }, [isAuthenticated, user, memoizedTeamId, localDocuments, isUsingFallback, tablesMissing.collaborative_documents]);
  
  // Memoize helper functions to prevent unecessary re-renders
  const fetchDocumentHistory = useCallback(async (documentId: string): Promise<DocumentVersion[]> => {
    // Check cache first
    if (DOCUMENT_HISTORY_CACHE.has(documentId) && !needsRefresh(cacheTimestampRef.current[`history_${documentId}`])) {
      return DOCUMENT_HISTORY_CACHE.get(documentId) || [];
    }
    
    try {
      const { data, error } = await supabase
        .from('document_history')
        .select('*')
        .eq('document_id', documentId)
        .order('version', { ascending: false });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Update cache
        DOCUMENT_HISTORY_CACHE.set(documentId, data);
        cacheTimestampRef.current[`history_${documentId}`] = Date.now();
        return data;
      }
    } catch (err) {
      console.error("Error fetching document history:", err);
    }
    
    // Try local storage
    const localVersionHistory = await queryLocalVersions('document_id', documentId);
    if (localVersionHistory && localVersionHistory.length > 0) {
      // Cache the result
      DOCUMENT_HISTORY_CACHE.set(documentId, localVersionHistory);
      cacheTimestampRef.current[`history_${documentId}`] = Date.now();
      return localVersionHistory;
    }
    
    // Use mock data as final fallback
    const mockVersions = MOCK_VERSIONS.filter(ver => ver.document_id === documentId);
    DOCUMENT_HISTORY_CACHE.set(documentId, mockVersions);
    cacheTimestampRef.current[`history_${documentId}`] = Date.now();
    return mockVersions;
  }, [queryLocalVersions]);
  
  const fetchChatMessages = useCallback(async (documentId: string): Promise<ChatMessage[]> => {
    // Check cache first
    if (MESSAGE_CACHE.has(documentId) && !needsRefresh(cacheTimestampRef.current[`messages_${documentId}`])) {
      return MESSAGE_CACHE.get(documentId) || [];
    }
    
    try {
      const { data, error } = await supabase
        .from('document_messages')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Update cache
        MESSAGE_CACHE.set(documentId, data);
        cacheTimestampRef.current[`messages_${documentId}`] = Date.now();
        return data;
      }
    } catch (err) {
      console.error("Error fetching chat messages:", err);
    }
    
    // Use messages from local storage as fallback
    const localChatMessages = localMessages.filter(msg => msg.document_id === documentId);
    if (localChatMessages.length > 0) {
      // Cache the result
      MESSAGE_CACHE.set(documentId, localChatMessages);
      cacheTimestampRef.current[`messages_${documentId}`] = Date.now();
      return localChatMessages;
    }
    
    // Use mock data as final fallback
    const mockMessages = MOCK_CHAT_MESSAGES.filter(msg => msg.document_id === documentId);
    MESSAGE_CACHE.set(documentId, mockMessages);
    cacheTimestampRef.current[`messages_${documentId}`] = Date.now();
    return mockMessages;
  }, [localMessages]);
  
  // Select document and fetch related data - optimize with caching
  const selectDocument = useCallback(async (documentId: string) => {
    if (!documentId) return null;
    if (loadingOperationRef.current) return null;
    
    // If the document is already selected, don't reload everything
    if (currentDocument?.id === documentId) {
      return currentDocument;
    }
    
    loadingOperationRef.current = true;
    try {
      setLoading(true);
      
      // Find document in cache first, then state, then backend
      let document = DOCUMENT_CACHE.get(documentId);
      
      if (!document) {
        // Find document in state
        document = documents.find(doc => doc.id === documentId);
      }
      
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
          
          // Cache the document
          if (document) {
            DOCUMENT_CACHE.set(documentId, document);
          }
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
          
          // Cache the document
          if (document) {
            DOCUMENT_CACHE.set(documentId, document);
          }
        }
      }
      
      // Only update state if document has changed to avoid unnecessary re-renders
      setCurrentDocument(document);
      setDocumentContent(document.content);
      
      // Use promise.all for parallel fetching but with optimized caching
      const historyPromise = fetchDocumentHistory(documentId);
      const chatPromise = fetchChatMessages(documentId);
      
      const [history, messages] = await Promise.all([historyPromise, chatPromise]);
      
      setDocumentHistory(history);
      setChatMessages(messages);
      
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
      // Faster loading state resolution
      setTimeout(() => {
        setLoading(false);
        loadingOperationRef.current = false;
      }, 200);
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
            if (payload.new.updated_by !== user?.id) {
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
          table: 'document_messages',
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
    type: string = "document"
  ) => {
    if (!isAuthenticated || !user) {
      throw new Error("You must be authenticated to create a document");
    }
    
    const newDocument: Omit<CollaborativeDocument, 'id' | 'created_at'> = {
      title,
      content,
      document_type: type,
      version: 1,
      created_by: user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
      is_archived: false,
      is_public: false,
      metadata: memoizedTeamId ? { team_id: memoizedTeamId } : {}
    };
    
    try {
      // Check if we should use Supabase or localStorage
      if (!isUsingFallback && !tablesMissing.collaborative_documents) {
        // Use Supabase
        console.log('Creating document in Supabase');
        const { data, error } = await supabase
          .from('collaborative_documents')
          .insert(newDocument)
          .select();
          
        if (error) {
          if (error.code === '42P01') {
            // Table doesn't exist
            setTablesMissing(prev => ({ ...prev, collaborative_documents: true }));
            MISSING_TABLES_CACHE.collaborative_documents = true;
            console.warn('Table collaborative_documents does not exist, using local fallback');
            const localDoc = await addLocalDocument(newDocument);
            setDocuments(prev => [...prev, localDoc]);
            return localDoc;
          } else {
            throw error;
          }
        }
        
        if (data && data.length > 0) {
          const createdDoc = data[0];
          setDocuments(prev => [...prev, createdDoc]);
          return createdDoc;
        }
      }
      
      // Use localStorage fallback
      const localDoc = await addLocalDocument(newDocument);
      setDocuments(prev => [...prev, localDoc]);
      return localDoc;
    } catch (err) {
      console.error('Error creating document:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Fallback to localStorage in case of error
      try {
        const localDoc = await addLocalDocument(newDocument);
        setDocuments(prev => [...prev, localDoc]);
        return localDoc;
      } catch (fallbackErr) {
        console.error('Error in localStorage fallback:', fallbackErr);
        throw err; // Rethrow original error
      }
    }
  };
  
  // Save document changes
  const saveDocument = async (content: string) => {
    if (!currentDocument || !isAuthenticated || !user) {
      throw new Error("No document selected or user not authenticated");
    }
    
    // Throttle requests - don't save more than once every 2 seconds
    const now = Date.now();
    const lastRequestTime = lastRequestTimeRef.current[currentDocument.id] || 0;
    if (now - lastRequestTime < 2000) {
      console.log('Throttling save request');
      return currentDocument;
    }
    
    lastRequestTimeRef.current[currentDocument.id] = now;
    
    const updatedDocument = {
      ...currentDocument,
      content,
      version: currentDocument.version + 1,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };
    
    // Create a version record
    const versionRecord: Omit<DocumentVersion, 'id' | 'created_at'> = {
      document_id: currentDocument.id,
      version: currentDocument.version,  // Store previous version
      content: currentDocument.content,  // Store previous content
      created_by: user.id
    };
    
    try {
      // Try to use Supabase if available
      if (!isUsingFallback && !tablesMissing.collaborative_documents) {
        // Update document in Supabase
        const { data, error } = await supabase
          .from('collaborative_documents')
          .update(updatedDocument)
          .eq('id', currentDocument.id)
          .select();
          
        if (error) {
          if (error.code === '42P01') {
            // Table doesn't exist
            setTablesMissing(prev => ({ ...prev, collaborative_documents: true }));
            MISSING_TABLES_CACHE.collaborative_documents = true;
            console.warn('Table collaborative_documents does not exist, using local fallback');
          } else {
            throw error;
          }
        } else if (data && data.length > 0) {
          // Document updated successfully
          setCurrentDocument(data[0]);
          setDocumentContent(content);
          
          // Update documents list
          setDocuments(prev => 
            prev.map(doc => doc.id === currentDocument.id ? data[0] : doc)
          );
          
          // Try to save version history if the table exists
          if (!tablesMissing.document_history) {
            try {
              const { error: versionError } = await supabase
                .from('document_history')
                .insert(versionRecord);
                
              if (versionError && versionError.code === '42P01') {
                setTablesMissing(prev => ({ ...prev, document_history: true }));
                MISSING_TABLES_CACHE.document_history = true;
              }
            } catch (versionErr) {
              console.error('Error saving version history to Supabase:', versionErr);
            }
          }
          
          return data[0];
        }
      }
      
      // Use localStorage fallback
      const localDoc = await updateLocalDocument(currentDocument.id, updatedDocument);
      if (localDoc) {
        setCurrentDocument(localDoc);
        setDocumentContent(content);
        
        // Update documents list
        setDocuments(prev => 
          prev.map(doc => doc.id === currentDocument.id ? localDoc : doc)
        );
        
        // Save version history locally
        await addLocalVersion(versionRecord);
        
        return localDoc;
      }
      
      throw new Error("Failed to update document");
    } catch (err) {
      console.error('Error saving document:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Last resort fallback to localStorage
      try {
        const localDoc = await updateLocalDocument(currentDocument.id, updatedDocument);
        if (localDoc) {
          setCurrentDocument(localDoc);
          setDocumentContent(content);
          // Update documents list
          setDocuments(prev => 
            prev.map(doc => doc.id === currentDocument.id ? localDoc : doc)
          );
          // Save version history locally
          await addLocalVersion(versionRecord);
          return localDoc;
        }
        throw new Error("Failed to update document in fallback storage");
      } catch (fallbackErr) {
        console.error('Error in localStorage fallback:', fallbackErr);
        throw err; // Rethrow original error
      }
    }
  };
  
  // Send a chat message
  const sendChatMessage = async (message: string) => {
    if (!currentDocument || !isAuthenticated || !user) {
      throw new Error("No document selected or user not authenticated");
    }
    
    const newMessage: Omit<ChatMessage, 'id' | 'created_at'> = {
      document_id: currentDocument.id,
      user_id: user.id,
      message,
      message_type: 'chat',
      is_system: false,
      metadata: {}
    };
    
    try {
      // Try Supabase if available
      if (!isUsingFallback && !tablesMissing.document_messages) {
        const { data, error } = await supabase
          .from('document_messages')
          .insert(newMessage)
          .select();
          
        if (error) {
          if (error.code === '42P01') {
            // Table doesn't exist
            setTablesMissing(prev => ({ ...prev, document_messages: true }));
            MISSING_TABLES_CACHE.document_messages = true;
            console.warn('Table document_messages does not exist, using local fallback');
          } else {
            throw error;
          }
        } else if (data && data.length > 0) {
          // Message sent successfully
          setChatMessages(prev => [...prev, data[0]]);
          return data[0];
        }
      }
      
      // Use localStorage fallback
      const localMessage = await addLocalMessage(newMessage);
      setChatMessages(prev => [...prev, localMessage]);
      return localMessage;
    } catch (err) {
      console.error('Error sending chat message:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Last resort fallback to localStorage
      try {
        const localMessage = await addLocalMessage(newMessage);
        setChatMessages(prev => [...prev, localMessage]);
        return localMessage;
      } catch (fallbackErr) {
        console.error('Error in localStorage fallback:', fallbackErr);
        throw err; // Rethrow original error
      }
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
            .from('document_history')
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
  
  const checkAndCreateMissingTables = useCallback(async (): Promise<Record<string, boolean>> => {
    try {
      // Check if we need to check tables again
      const now = Date.now();
      if (LAST_TABLE_CHECK && now - LAST_TABLE_CHECK < TABLE_CHECK_INTERVAL) {
        return MISSING_TABLES_CACHE;
      }
      
      // Update last check timestamp
      LAST_TABLE_CHECK = now;
      
      // Get table status
      const tableStatus = await checkTablesExist();
      
      // Update cache
      Object.entries(tableStatus).forEach(([table, exists]) => {
        MISSING_TABLES_CACHE[table as keyof typeof MISSING_TABLES_CACHE] = exists;
      });
      
      return tableStatus;
    } catch (error) {
      console.error("Error checking tables:", error);
      
      // Handle specific document_collaborators policy error
      if (error instanceof Error && 
          error.message?.includes('infinite recursion detected in policy for relation "document_collaborators"')) {
        console.warn("Detected recursive policy error in document_collaborators. Forcing fallback to local storage.");
        
        // Mark all collaboration tables as non-existent to force local storage use
        Object.keys(MISSING_TABLES_CACHE).forEach(table => {
          MISSING_TABLES_CACHE[table as keyof typeof MISSING_TABLES_CACHE] = false;
        });
        
        // Force using local storage
        setUseLocalStorage(true);
      }
      
      return MISSING_TABLES_CACHE;
    }
  }, []);
  
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
    loadDocumentVersion,
    isUsingLocalStorage: isUsingFallback || Object.values(tablesMissing).some(missing => missing),
    tablesMissing
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
    loadDocumentVersion,
    isUsingFallback,
    tablesMissing
  ]);
}; 