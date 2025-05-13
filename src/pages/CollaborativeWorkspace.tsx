import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import React from 'react';
import { Layout } from "@/components/Layout";
import { useAuth } from "@/lib/AuthContext.jsx";
import { useCollaboration } from "@/hooks/useCollaboration";
import { useRealTimeCollaboration } from "@/hooks/useRealTimeCollaboration";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Users, 
  Video, 
  FileEdit, 
  MessageSquare, 
  Share2, 
  PlusCircle, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  PhoneOff,
  Clock,
  History,
  Save,
  Loader2
} from "lucide-react";
import { Navigate } from "react-router-dom";

// Lazy load heavy components
const DocumentEditor = lazy(() => import('@/components/DocumentEditor'));

// Function to get initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Format timestamp for display
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

// Mock users for demo purposes - will later be replaced with real users
const COLLABORATORS = [
  { id: 'user-1', name: 'John Smith', email: 'john@example.com', role: 'Science Teacher', active: true },
  { id: 'user-2', name: 'Maria Garcia', email: 'maria@example.com', role: 'Math Teacher', active: false },
  { id: 'user-3', name: 'David Johnson', email: 'david@example.com', role: 'English Teacher', active: true },
];

export default function CollaborativeWorkspace() {
  const { user, isAuthenticated } = useAuth();
  const { teams } = useCollaboration();
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !user) {
      const timer = setTimeout(() => setRedirectToLogin(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);
  
  // Redirect to login page if needed
  if (redirectToLogin) {
    return <Navigate to="/login" />;
  }
  
  // Get active team ID using memoization to prevent unnecessary changes
  const [activeTeamId, setActiveTeamId] = useState<string | undefined>(undefined);
  
  // Set initial team ID in a separate effect to avoid flickering during re-renders
  useEffect(() => {
    if (teams && teams.length > 0 && !activeTeamId) {
      setActiveTeamId(teams[0]?.id);
    }
  }, [teams, activeTeamId]);
  
  // Reduce console logging to essentials to improve performance
  const logDebug = useCallback((message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CollabWorkspace] ${message}`, data || '');
    }
  }, []);
  
  // Use our real-time collaboration hook with memoized team ID
  const memoizedTeamId = useMemo(() => activeTeamId, [activeTeamId]);
  
  // Track component mount status to prevent state updates after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const {
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
  } = useRealTimeCollaboration(memoizedTeamId);
  
  // UI state variables with minimal dependencies
  const [activeTab, setActiveTab] = useState("documents");
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState<"lesson" | "assessment" | "rubric" | "note">("note");
  const [isCreating, setIsCreating] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const documentIdRef = useRef<string | null>(null);
  
  // Prevent state thrashing with a ref
  const lastUpdatedRef = useRef<number>(Date.now());
  const stateStabilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDocumentStateRef = useRef<{ content?: string; id?: string } | null>(null);
  
  // Enhanced loading state control
  const getStableLoading = useCallback(() => {
    // If it's been less than 300ms since the last update, force loading state
    // This prevents flickering from very short loading states
    const timeSinceLastUpdate = Date.now() - lastUpdatedRef.current;
    return loading || localLoading || timeSinceLastUpdate < 300;
  }, [loading, localLoading]);
  
  // Stable loading derived state that doesn't flicker
  const isLoading = useMemo(() => getStableLoading(), [getStableLoading]);
  
  // More efficient document selection with stability timeout
  const handleDocumentSelect = useCallback(async (documentId: string) => {
    // Skip if already selected
    if (documentIdRef.current === documentId) {
      return;
    }
    
    // Set flags immediately to prevent multiple triggers
    documentIdRef.current = documentId;
    lastUpdatedRef.current = Date.now();
    setLocalLoading(true);
    
    // Clear any pending timeouts
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    if (stateStabilityTimeoutRef.current) {
      clearTimeout(stateStabilityTimeoutRef.current);
    }
    
    try {
      // Execute document selection
      await selectDocument(documentId);
    } catch (error) {
      console.error("Error selecting document:", error);
    } finally {
      // Check if component is still mounted
      if (!isMountedRef.current) return;
      
      // Ensure minimum loading time of 300ms to prevent flickering
      const elapsed = Date.now() - lastUpdatedRef.current;
      const remainingTime = Math.max(300 - elapsed, 50);
      
      loadingTimeoutRef.current = setTimeout(() => {
        lastUpdatedRef.current = Date.now();
        if (isMountedRef.current) {
          setLocalLoading(false);
        }
        
        // Extra stability timeout to prevent immediate flicker after loading
        stateStabilityTimeoutRef.current = setTimeout(() => {
          // Nothing to do here, just preventing any state changes
        }, 100);
      }, remainingTime);
    }
  }, [selectDocument]);
  
  // Cleanup loading timeout
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (stateStabilityTimeoutRef.current) {
        clearTimeout(stateStabilityTimeoutRef.current);
      }
    };
  }, []);
  
  // Highly optimized content change handler with batch updates
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    
    // Store in ref first to avoid multiple renders
    pendingDocumentStateRef.current = {
      ...pendingDocumentStateRef.current,
      content: newContent
    };
    
    // Clear existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Batch update with delay
    loadingTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      if (pendingDocumentStateRef.current?.content) {
        setDocumentContent(pendingDocumentStateRef.current.content);
        pendingDocumentStateRef.current.content = undefined;
      }
    }, 50); // Small delay to batch changes
  }, [setDocumentContent]);
  
  // Handle saving document with throttling to prevent excessive API calls
  const handleSaveDocument = useCallback(async () => {
    if (isSaving || !currentDocument || !isMountedRef.current) return;
    
    setIsSaving(true);
    try {
      await saveDocument(documentContent);
      // Successfully saved
    } catch (error) {
      console.error("Error saving document:", error);
      if (isMountedRef.current) {
        toast.error("Failed to save document");
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [currentDocument, documentContent, saveDocument, isSaving]);
  
  // Auto-save functionality with debounce
  useEffect(() => {
    if (currentDocument && documentContent !== currentDocument.content) {
      const timer = setTimeout(() => {
        handleSaveDocument();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [documentContent, currentDocument, handleSaveDocument]);
  
  // Optimize document content updates
  // Instead of using useState for debouncedContent, use ref + forceUpdate pattern
  const contentRef = useRef(documentContent);
  const [, forceRender] = useState({});
  
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      contentRef.current = documentContent;
      if (isMountedRef.current) {
        forceRender({}); // Force a render after the RAF
      }
    });
    return () => cancelAnimationFrame(handle);
  }, [documentContent]);
  
  // Render the document editor with extreme optimization - memoized component
  const renderDocumentEditor = useMemo(() => {
    // Wrap in Suspense/lazy for code splitting
    return (
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }>
        <DocumentEditor 
          content={contentRef.current} 
          onChange={handleContentChange} 
        />
      </Suspense>
    );
  }, [handleContentChange]); // Only depend on the handler, not content
  
  // Handle sending a new chat message with debounce
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user || isSending || !isMountedRef.current) return;
    
    setIsSending(true);
    try {
      await sendChatMessage(newMessage);
      if (isMountedRef.current) {
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      if (isMountedRef.current) {
        toast.error("Failed to send message");
      }
    } finally {
      if (isMountedRef.current) {
        setIsSending(false);
      }
    }
  }, [newMessage, user, sendChatMessage, isSending]);
  
  // Handle creating a new document
  const handleCreateDocument = useCallback(async () => {
    if (!newDocTitle.trim() || isCreating || !isMountedRef.current) {
      toast.error("Please enter a title for the document");
      return;
    }
    
    setIsCreating(true);
    try {
      const newDoc = await createDocument(newDocTitle, "", newDocType);
      if (newDoc && isMountedRef.current) {
        toast.success("Document created successfully");
        setNewDocTitle("");
        setShowCreateForm(false);
        // Use a timeout to ensure state updates before selecting document
        setTimeout(() => {
          if (isMountedRef.current) {
            handleDocumentSelect(newDoc.id);
          }
        }, 50);
      } else if (isMountedRef.current) {
        toast.error("Failed to create document");
      }
    } catch (error) {
      console.error("Error creating document:", error);
      if (isMountedRef.current) {
        toast.error("Failed to create document");
      }
    } finally {
      if (isMountedRef.current) {
        setIsCreating(false);
      }
    }
  }, [newDocTitle, newDocType, createDocument, handleDocumentSelect, isCreating]);
  
  // Handle loading a specific document version
  const handleLoadVersion = useCallback(async (versionId: string) => {
    try {
      await loadDocumentVersion(versionId);
      if (isMountedRef.current) {
        toast.success("Document version loaded");
      }
    } catch (error) {
      console.error("Error loading document version:", error);
      if (isMountedRef.current) {
        toast.error("Failed to load document version");
      }
    }
  }, [loadDocumentVersion]);
  
  // Video conference handlers
  const initializeMedia = useCallback(async () => {
    try {
      if (videoEnabled && videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current && isMountedRef.current) {
            videoRef.current.srcObject = stream;
          }
          if (isMountedRef.current) {
            toast.success("Video enabled");
          }
        } catch (mediaError) {
          console.error("Error accessing media devices:", mediaError);
          if (isMountedRef.current) {
            toast.error("Failed to access camera");
            setVideoEnabled(false);
          }
        }
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      if (isMountedRef.current) {
        toast.error("Failed to access camera");
        setVideoEnabled(false);
      }
    }
  }, [videoEnabled]);
  
  // Effect to handle media changes
  useEffect(() => {
    if (videoEnabled) {
      initializeMedia();
    }
    
    // Cleanup function to stop media tracks
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoEnabled, initializeMedia]);
  
  // Handle toggling video
  const toggleVideo = useCallback(() => {
    setVideoEnabled(prev => !prev);
  }, []);
  
  // Handle toggling audio
  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => !prev);
    if (isMountedRef.current) {
      toast.success(`Microphone ${audioEnabled ? 'muted' : 'unmuted'}`);
    }
  }, [audioEnabled]);
  
  // Handle ending call
  const endCall = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    
    if (isMountedRef.current) {
      setVideoEnabled(false);
      setAudioEnabled(false);
      toast.info("Video conference ended");
    }
  }, []);
  
  // Lazy loaded components
  const DocumentEditorMemo = useMemo(() => React.memo(function DocumentEditor({ 
    content, 
    onChange 
  }: { 
    content: string, 
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void 
  }) {
    return (
      <Textarea
        className="w-full h-full rounded-none border-0 resize-none p-4 font-mono text-sm"
        value={content}
        onChange={onChange}
        placeholder="Start typing your document content..."
      />
    );
  }), []);
  
  // Show loading state with minimum duration
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium">Loading Collaborative Workspace</h3>
            <p className="text-muted-foreground">Please wait while we fetch your documents...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-6 w-full max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Collaborative Workspace</h1>
            <p className="text-muted-foreground mt-1">
              Real-time collaboration tools for document editing and video conferencing
            </p>
          </div>
          {teams && teams.length > 0 && (
            <Select 
              value={activeTeamId} 
              onValueChange={(value) => setActiveTeamId(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="documents">
              <FileEdit className="mr-2 h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="conference">
              <Video className="mr-2 h-4 w-4" />
              Video Conference
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Clock className="mr-2 h-4 w-4" />
              Recent Activity
            </TabsTrigger>
          </TabsList>
          
          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-7">
              {/* Document List */}
              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Collaborative Documents
                  </CardTitle>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {showCreateForm && (
                    <div className="mb-4 p-3 border rounded-md">
                      <h4 className="font-medium mb-2">Create New Document</h4>
                      <div className="space-y-2">
                        <Input
                          placeholder="Document Title"
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                        />
                        <Select 
                          value={newDocType} 
                          onValueChange={(value: any) => setNewDocType(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Document Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lesson">Lesson</SelectItem>
                            <SelectItem value="assessment">Assessment</SelectItem>
                            <SelectItem value="rubric">Rubric</SelectItem>
                            <SelectItem value="note">Note</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex justify-end space-x-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowCreateForm(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleCreateDocument}
                            disabled={isCreating}
                          >
                            {isCreating ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                Creating...
                              </>
                            ) : (
                              'Create'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {documents.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-2">No documents found</p>
                          <Button 
                            size="sm"
                            onClick={() => setShowCreateForm(true)}
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Create Document
                          </Button>
                        </div>
                      ) : (
                        documents.map((doc) => (
                          <div
                            key={doc.id}
                            className={`flex flex-col p-3 space-y-2 rounded-md cursor-pointer ${
                              currentDocument?.id === doc.id ? 'bg-muted' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleDocumentSelect(doc.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium truncate">{doc.title}</div>
                              <Badge variant="outline">{doc.document_type}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Last modified: {formatTimestamp(doc.updated_at)}
                            </div>
                            <div className="flex -space-x-2">
                              {/* In a real app, we would fetch collaborators for each document */}
                              {COLLABORATORS.slice(0, 2).map((collaborator) => (
                                <Avatar key={collaborator.id} className="h-6 w-6 border-2 border-background">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(collaborator.name)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Document Editor */}
              <Card className="md:col-span-5">
                <CardHeader className="pb-3">
                  {currentDocument ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{currentDocument.title}</CardTitle>
                        <CardDescription>
                          Version {currentDocument.version} • Last edited {formatTimestamp(currentDocument.updated_at)}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={handleSaveDocument} 
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <CardTitle>Select a document to edit</CardTitle>
                  )}
                </CardHeader>
                
                {currentDocument ? (
                  <CardContent className="p-0">
                    <div className="grid grid-cols-3 gap-0 h-[500px]">
                      {/* Main editor area */}
                      <div className="col-span-2 border-r">
                        <div className="w-full h-full">
                          {renderDocumentEditor}
                        </div>
                      </div>
                      
                      {/* Sidebar with collaborators, history, chat */}
                      <div className="flex flex-col h-full">
                        <Tabs defaultValue="collaborators" className="flex-1">
                          <div className="border-b px-4">
                            <TabsList className="w-full justify-start">
                              <TabsTrigger value="collaborators" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                Collaborators
                              </TabsTrigger>
                              <TabsTrigger value="history" className="text-xs">
                                <History className="h-3 w-3 mr-1" />
                                History
                              </TabsTrigger>
                              <TabsTrigger value="chat" className="text-xs">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Chat
                              </TabsTrigger>
                            </TabsList>
                          </div>
                          
                          <TabsContent value="collaborators" className="p-4 h-full">
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium">Active Now</h4>
                              {activeCollaborators.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No active collaborators</p>
                              ) : (
                                // In a real app, we would fetch user details for each collaborator
                                activeCollaborators.map(collaborator => {
                                  // For demo purposes only
                                  const mockUser = COLLABORATORS.find(c => c.id === collaborator.user_id) || 
                                    { id: collaborator.user_id, name: "Unknown User", role: "Collaborator" };
                                  
                                  return (
                                    <div key={collaborator.id} className="flex items-center space-x-2">
                                      <div className="relative">
                                        <Avatar className="h-8 w-8">
                                          <AvatarFallback>{getInitials(mockUser.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500"></div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{mockUser.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{mockUser.role}</p>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                              
                              <Separator className="my-2" />
                              
                              <h4 className="text-sm font-medium">All Collaborators</h4>
                              {/* In a real app, we would fetch team members or document collaborators */}
                              {COLLABORATORS.filter(c => !c.active).map(collaborator => (
                                <div key={collaborator.id} className="flex items-center space-x-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>{getInitials(collaborator.name)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{collaborator.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{collaborator.role}</p>
                                  </div>
                                </div>
                              ))}
                              
                              <Button variant="outline" size="sm" className="w-full mt-4">
                                <PlusCircle className="h-3 w-3 mr-2" />
                                Invite
                              </Button>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="history" className="p-4 h-full">
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium">Version History</h4>
                              <div className="space-y-2">
                                {documentHistory.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">No version history available</p>
                                ) : (
                                  documentHistory.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-2 text-sm hover:bg-muted rounded-md">
                                      <div className="flex items-center space-x-2">
                                        <Badge variant="outline">v{item.version}</Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {formatTimestamp(item.created_at)}
                                        </span>
                                      </div>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 px-2"
                                        onClick={() => handleLoadVersion(item.id)}
                                      >
                                        View
                                      </Button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="chat" className="flex flex-col h-full">
                            <ScrollArea className="flex-1 p-4">
                              <div className="space-y-4">
                                {chatMessages.length === 0 ? (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    No messages yet. Start the conversation!
                                  </p>
                                ) : (
                                  chatMessages.map((msg) => {
                                    // For demo purposes only
                                    const sender = COLLABORATORS.find(c => c.id === msg.user_id) || 
                                      { name: "Unknown User" };
                                    
                                    return (
                                      <div key={msg.id} className="flex space-x-2">
                                        <Avatar className="h-8 w-8">
                                          <AvatarFallback>
                                            {getInitials(sender.name)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">
                                              {sender.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              {formatTimestamp(msg.created_at)}
                                            </span>
                                          </div>
                                          <p className="text-sm">{msg.message}</p>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </ScrollArea>
                            <div className="p-4 border-t">
                              <div className="flex space-x-2">
                                <Input 
                                  placeholder="Type a message..." 
                                  value={newMessage}
                                  onChange={e => setNewMessage(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                  disabled={isSending}
                                />
                                <Button 
                                  size="sm" 
                                  onClick={handleSendMessage}
                                  disabled={isSending}
                                >
                                  {isSending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Send'
                                  )}
                                </Button>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent className="flex items-center justify-center h-[500px] text-muted-foreground">
                    {documents.length === 0 ? (
                      <div className="text-center">
                        <p className="mb-2">No documents found</p>
                        <Button 
                          size="sm"
                          onClick={() => setShowCreateForm(true)}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create Document
                        </Button>
                      </div>
                    ) : (
                      "Select a document from the list to start editing"
                    )}
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>
          
          {/* Video Conference Tab */}
          <TabsContent value="conference" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Video Conferencing</CardTitle>
                <CardDescription>
                  Connect with team members through video conferencing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Main video area */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-muted rounded-lg aspect-video flex items-center justify-center overflow-hidden relative">
                      {videoEnabled ? (
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          muted 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">Camera is turned off</p>
                        </div>
                      )}
                      
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                        <Button 
                          size="icon" 
                          variant={audioEnabled ? "default" : "secondary"}
                          onClick={toggleAudio}
                        >
                          {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                        </Button>
                        <Button 
                          size="icon" 
                          variant={videoEnabled ? "default" : "secondary"}
                          onClick={toggleVideo}
                        >
                          {videoEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                        </Button>
                        <Button 
                          size="icon" 
                          variant="destructive"
                          onClick={endCall}
                        >
                          <PhoneOff className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {COLLABORATORS.filter(c => c.active).map(collaborator => (
                        <div key={collaborator.id} className="relative">
                          <div className="bg-muted rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                            <Avatar className="h-16 w-16">
                              <AvatarFallback className="text-xl">{getInitials(collaborator.name)}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="absolute bottom-2 left-2 text-sm bg-background/80 px-2 py-0.5 rounded-md">
                            {collaborator.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Sidebar with controls and chat */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Meeting Controls</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="meeting-name">Meeting Name</Label>
                            <Input id="meeting-name" defaultValue="Team Weekly Planning" />
                          </div>
                          <div className="space-y-2">
                            <Label>Invite Participants</Label>
                            <Select defaultValue="user-2">
                              <SelectTrigger>
                                <SelectValue placeholder="Select a team member" />
                              </SelectTrigger>
                              <SelectContent>
                                {COLLABORATORS.map(collaborator => (
                                  <SelectItem key={collaborator.id} value={collaborator.id}>
                                    {collaborator.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-between">
                            <Button variant="outline" size="sm">Share Screen</Button>
                            <Button variant="outline" size="sm">Record</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="h-[300px] flex flex-col">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Meeting Chat</CardTitle>
                      </CardHeader>
                      <ScrollArea className="flex-1 px-4">
                        <div className="space-y-4">
                          {chatMessages.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No messages yet. Start the conversation!
                            </p>
                          ) : (
                            chatMessages.map((msg) => {
                              // For demo purposes only
                              const sender = COLLABORATORS.find(c => c.id === msg.user_id) || 
                                { name: "Unknown User" };
                              
                              return (
                                <div key={msg.id} className="flex space-x-2">
                                  <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarFallback>
                                      {getInitials(sender.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="text-xs">
                                      <span className="font-medium">{sender.name}</span>
                                      <span className="text-muted-foreground ml-2">
                                        {new Date(msg.created_at).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    <p className="text-sm">{msg.message}</p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </ScrollArea>
                      <div className="p-4 border-t mt-auto">
                        <div className="flex space-x-2">
                          <Input 
                            placeholder="Type a message..." 
                            className="text-sm"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            disabled={isSending}
                          />
                          <Button 
                            size="sm" 
                            onClick={handleSendMessage}
                            disabled={isSending}
                          >
                            {isSending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Send'
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Collaboration Activity</CardTitle>
                <CardDescription>Track recent changes and activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    {documentHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No recent activity</p>
                      </div>
                    ) : (
                      documentHistory.slice(0, 10).map((version) => {
                        // For demo purposes only
                        const user = COLLABORATORS.find(c => c.id === version.created_by) || 
                          { id: version.created_by, name: "Unknown User" };
                        
                        return (
                          <div key={version.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback>
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <p className="text-sm">
                                <span className="font-medium">{user.name}</span>
                                {' '}
                                created version {version.version} of
                                {' '}
                                <span className="font-medium">
                                  {currentDocument?.title || "Unknown Document"}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatTimestamp(version.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View All Activity</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
} 