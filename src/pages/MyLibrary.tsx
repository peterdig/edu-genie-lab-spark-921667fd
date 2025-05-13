import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Folder, ContentItem, FolderTree, ContentVersion, ContentType } from "@/types/folders";
import { mockFolders, mockContentItems, mockFolderTree, mockContentVersions } from "@/data/mockFolders";
import { ChevronRight, FolderOpen, FolderPlus, File, Trash2, FilePlus2, PenLine, Book, Beaker, FileSpreadsheet, MoreHorizontal, ChevronDown, History, Clock, Share2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function MyLibrary() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderTree, setFolderTree] = useState<FolderTree[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateSubfolderOpen, setIsCreateSubfolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [contentVersions, setContentVersions] = useState<ContentVersion[]>([]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [newContentTitle, setNewContentTitle] = useState("");
  const [newContentType, setNewContentType] = useState<ContentType>("lesson");
  const navigate = useNavigate();
  
  // New state for edit folder dialog
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [editFolderDescription, setEditFolderDescription] = useState("");
  
  // New state for delete confirmation
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const [isRemoveItemConfirmOpen, setIsRemoveItemConfirmOpen] = useState(false);
  
  // State for selected content
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  // Reset to initial mock data (for testing)
  const resetToMockData = () => {
    localStorage.removeItem('library-folders');
    localStorage.removeItem('library-folder-tree');
    localStorage.removeItem('library-content-versions');
    setFolders(mockFolders);
    setFolderTree(mockFolderTree);
    setContentVersions(mockContentVersions);
    
    // Initialize with first folder selected
    if (mockFolders.length > 0) {
      setSelectedFolder(mockFolders[0]);
    }
    
    // Initialize with root folders expanded
    const rootFolderIds = mockFolderTree
      .filter(folder => folder.children.length > 0)
      .map(folder => folder.id);
    setExpandedFolders(rootFolderIds);
    
    toast.success("Library data has been reset to defaults");
  };

  // Initialize with mock data
  useEffect(() => {
    const savedFolders = localStorage.getItem('library-folders');
    const savedFolderTree = localStorage.getItem('library-folder-tree');
    const savedContentVersions = localStorage.getItem('library-content-versions');
    
    if (savedFolders && savedFolderTree) {
      try {
        setFolders(JSON.parse(savedFolders));
        setFolderTree(JSON.parse(savedFolderTree));
        
        if (savedContentVersions) {
          setContentVersions(JSON.parse(savedContentVersions));
        } else {
          setContentVersions(mockContentVersions);
        }
        
        // Initialize with first folder selected
        const parsedFolders = JSON.parse(savedFolders);
        if (parsedFolders.length > 0) {
          setSelectedFolder(parsedFolders[0]);
        }
        
        // Initialize with root folders expanded
        const parsedFolderTree = JSON.parse(savedFolderTree);
        const rootFolderIds = parsedFolderTree
          .filter(folder => folder.children.length > 0)
          .map(folder => folder.id);
        setExpandedFolders(rootFolderIds);
      } catch (error) {
        console.error("Failed to parse saved library data:", error);
        resetToMockData();
      }
    } else {
      setFolders(mockFolders);
      setFolderTree(mockFolderTree);
      setContentVersions(mockContentVersions);
      
      // Initialize with first folder selected
      if (mockFolders.length > 0) {
        setSelectedFolder(mockFolders[0]);
      }
      
      // Initialize with root folders expanded
      const rootFolderIds = mockFolderTree
        .filter(folder => folder.children.length > 0)
        .map(folder => folder.id);
      setExpandedFolders(rootFolderIds);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (folders.length > 0) {
      localStorage.setItem('library-folders', JSON.stringify(folders));
    }
    if (folderTree.length > 0) {
      localStorage.setItem('library-folder-tree', JSON.stringify(folderTree));
    }
    if (contentVersions.length > 0) {
      localStorage.setItem('library-content-versions', JSON.stringify(contentVersions));
    }
  }, [folders, folderTree, contentVersions]);

  // Toggle expanded state of a folder
  const toggleFolderExpanded = (folderId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId) 
        : [...prev, folderId]
    );
  };

  // Find a folder in the tree by ID
  const findFolderInTree = (id: string, tree: FolderTree[]): FolderTree | null => {
    for (const folder of tree) {
      if (folder.id === id) {
        return folder;
      }
      if (folder.children.length > 0) {
        const found = findFolderInTree(id, folder.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  // Create a new folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("Folder name is required");
      return;
    }

    const newFolder: Folder = {
      id: uuidv4(),
      name: newFolderName,
      description: newFolderDescription || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: []
    };

    setFolders([...folders, newFolder]);
    setIsCreateFolderOpen(false);
    setNewFolderName("");
    setNewFolderDescription("");
    toast.success("Folder created successfully");
  };

  // Create a new subfolder
  const handleCreateSubfolder = () => {
    if (!newFolderName.trim()) {
      toast.error("Folder name is required");
      return;
    }

    if (!newFolderParentId) {
      toast.error("Parent folder is required");
      return;
    }

    const newFolder: FolderTree = {
      id: uuidv4(),
      name: newFolderName,
      description: newFolderDescription || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentId: newFolderParentId,
      children: [],
      items: []
    };

    // Update the folder tree
    const updateFolderChildren = (tree: FolderTree[]): FolderTree[] => {
      return tree.map(folder => {
        if (folder.id === newFolderParentId) {
          return {
            ...folder,
            children: [...folder.children, newFolder]
          };
        }
        if (folder.children.length > 0) {
          return {
            ...folder,
            children: updateFolderChildren(folder.children)
          };
        }
        return folder;
      });
    };

    const updatedFolderTree = updateFolderChildren(folderTree);
    setFolderTree(updatedFolderTree);
    
    // Expand the parent folder
    if (!expandedFolders.includes(newFolderParentId)) {
      setExpandedFolders([...expandedFolders, newFolderParentId]);
    }
    
    setIsCreateSubfolderOpen(false);
    setNewFolderName("");
    setNewFolderDescription("");
    setNewFolderParentId(undefined);
    toast.success("Subfolder created successfully");
  };

  // Edit folder
  const handleEditFolder = () => {
    if (!editingFolder) return;
    
    if (!editFolderName.trim()) {
      toast.error("Folder name is required");
      return;
    }
    
    // Update folders list
    const updatedFolders = folders.map(folder => 
      folder.id === editingFolder.id
        ? { 
            ...folder, 
            name: editFolderName,
            description: editFolderDescription || undefined,
            updatedAt: new Date().toISOString()
          }
        : folder
    );
    setFolders(updatedFolders);
    
    // Update folder tree
    const updateFolderInTree = (tree: FolderTree[]): FolderTree[] => {
      return tree.map(folder => {
        if (folder.id === editingFolder.id) {
          return {
            ...folder,
            name: editFolderName,
            description: editFolderDescription || undefined,
            updatedAt: new Date().toISOString()
          };
        }
        
        if (folder.children.length > 0) {
          return {
            ...folder,
            children: updateFolderInTree(folder.children)
          };
        }
        
        return folder;
      });
    };
    
    const updatedFolderTree = updateFolderInTree(folderTree);
    setFolderTree(updatedFolderTree);
    
    // Update selected folder if it's the one being edited
    if (selectedFolder && selectedFolder.id === editingFolder.id) {
      setSelectedFolder({
        ...selectedFolder,
        name: editFolderName,
        description: editFolderDescription || undefined,
        updatedAt: new Date().toISOString()
      });
    }
    
    setIsEditFolderOpen(false);
    toast.success("Folder updated successfully");
  };

  // Open edit folder dialog
  const openEditFolderDialog = (folder: Folder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setEditFolderDescription(folder.description || "");
    setIsEditFolderOpen(true);
  };

  // Prompt for folder deletion confirmation
  const promptDeleteFolder = (folderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFolderToDelete(folderId);
    setIsDeleteConfirmOpen(true);
  };

  // Handle delete folder with confirmation
  const handleDeleteFolder = () => {
    if (!folderToDelete) return;
    
    // Check if it's a root folder or a subfolder
    const isRootFolder = folders.some(f => f.id === folderToDelete);
    
    if (isRootFolder) {
      const updatedFolders = folders.filter(folder => folder.id !== folderToDelete);
      setFolders(updatedFolders);
      
      // Also remove from folder tree
      setFolderTree(folderTree.filter(folder => folder.id !== folderToDelete));
    } else {
      // It's a subfolder, need to update the tree
      const updateFolderTree = (tree: FolderTree[]): FolderTree[] => {
        return tree.map(folder => {
          // Check direct children
          const filteredChildren = folder.children.filter(child => child.id !== folderToDelete);
          
          if (filteredChildren.length !== folder.children.length) {
            // Found and removed the folder
            return {
              ...folder,
              children: filteredChildren
            };
          }
          
          // Check deeper in the tree
          if (folder.children.length > 0) {
            return {
              ...folder,
              children: updateFolderTree(folder.children)
            };
          }
          
          return folder;
        });
      };
      
      setFolderTree(updateFolderTree(folderTree));
    }
    
    // Update selected folder if needed
    if (selectedFolder && selectedFolder.id === folderToDelete) {
      setSelectedFolder(folders.length > 0 ? folders[0] : null);
    }
    
    setIsDeleteConfirmOpen(false);
    setFolderToDelete(null);
    toast.success("Folder deleted successfully");
  };

  // Prompt for item removal confirmation
  const promptRemoveItem = (itemId: string) => {
    setItemToRemove(itemId);
    setIsRemoveItemConfirmOpen(true);
  };

  // Handle remove item with confirmation
  const handleRemoveItem = () => {
    if (!selectedFolder || !itemToRemove) return;
    
    const updatedItems = selectedFolder.items.filter(item => item.id !== itemToRemove);
    const updatedFolder = { ...selectedFolder, items: updatedItems };
    
    setSelectedFolder(updatedFolder);
    setFolders(folders.map(folder => 
      folder.id === selectedFolder.id ? updatedFolder : folder
    ));
    
    // Also update the folder tree
    const updateFolderItemsInTree = (tree: FolderTree[]): FolderTree[] => {
      return tree.map(folder => {
        if (folder.id === selectedFolder.id) {
          return {
            ...folder,
            items: updatedItems
          };
        }
        if (folder.children.length > 0) {
          return {
            ...folder,
            children: updateFolderItemsInTree(folder.children)
          };
        }
        return folder;
      });
    };
    
    setFolderTree(updateFolderItemsInTree(folderTree));
    
    setIsRemoveItemConfirmOpen(false);
    setItemToRemove(null);
    toast.success("Item removed from folder");
  };

  // Handle viewing content version history
  const handleViewVersionHistory = (contentId: string) => {
    // Find the versions for this content
    const versions = contentVersions.filter(version => version.contentId === contentId);
    
    if (versions.length === 0) {
      toast.info("No version history available for this content");
      return;
    }
    
    // Set the content item for display in the modal
    const contentItem = selectedFolder?.items.find(item => item.contentId === contentId) || null;
    setSelectedContent(contentItem);
    
    setSelectedContentId(contentId);
    setShowVersionHistory(true);
  };

  // Get versions for selected content
  const getContentVersions = (contentId: string) => {
    return contentVersions.filter(version => version.contentId === contentId)
      .sort((a, b) => b.version - a.version);
  };

  // Handle restore version
  const handleRestoreVersion = (version: ContentVersion) => {
    if (!selectedFolder || !selectedContentId) return;
    
    // Find the content item to update
    const updatedItems = selectedFolder.items.map(item => {
      if (item.contentId === selectedContentId) {
        // Create a new content version
        const newVersion: ContentVersion = {
          id: uuidv4(),
          contentId: selectedContentId,
          version: version.version,
          data: version.data,
          createdAt: new Date().toISOString(),
          createdBy: "You (restored)",
          notes: `Restored from version ${version.version}`
        };
        
        // Add the new version to the versions list
        setContentVersions([...contentVersions, newVersion]);
        
        // Update the item with the restored version
        return {
          ...item,
          version: version.version,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    
    // Update the folder with the new items
    const updatedFolder = { ...selectedFolder, items: updatedItems };
    setSelectedFolder(updatedFolder);
    
    // Update the folders list
    setFolders(folders.map(folder => 
      folder.id === selectedFolder.id ? updatedFolder : folder
    ));
    
    // Also update the folder tree
    const updateFolderItemsInTree = (tree: FolderTree[]): FolderTree[] => {
      return tree.map(folder => {
        if (folder.id === selectedFolder.id) {
          return {
            ...folder,
            items: updatedItems
          };
        }
        if (folder.children.length > 0) {
          return {
            ...folder,
            children: updateFolderItemsInTree(folder.children)
          };
        }
        return folder;
      });
    };
    
    setFolderTree(updateFolderItemsInTree(folderTree));
    
    toast.success(`Restored to version ${version.version}`);
    setShowVersionHistory(false);
  };

  // Handle share folder
  const handleShareFolder = () => {
    if (!shareEmail.trim()) {
      toast.error("Email address is required");
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    // In a real app, this would call an API to share the folder
    toast.success(`Folder shared with ${shareEmail}`);
    setIsShareDialogOpen(false);
    setShareEmail("");
  };

  // Handle add content
  const handleAddContent = () => {
    if (!selectedFolder) {
      toast.error("Please select a folder first");
      return;
    }

    if (!newContentTitle.trim()) {
      toast.error("Content title is required");
      return;
    }

    const newContent: ContentItem = {
      id: uuidv4(),
      title: newContentTitle,
      type: newContentType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contentId: `${newContentType}-${uuidv4().split('-')[0]}`,
      version: 1
    };

    // Create a new version for this content
    const newVersion: ContentVersion = {
      id: uuidv4(),
      contentId: newContent.contentId,
      version: 1,
      data: {
        title: newContent.title,
        type: newContent.type,
        createdAt: newContent.createdAt
      },
      createdAt: new Date().toISOString(),
      createdBy: "You",
      notes: "Initial creation"
    };
    
    // Add the new version to the versions list
    setContentVersions([...contentVersions, newVersion]);

    // Update selected folder
    const updatedFolder = {
      ...selectedFolder,
      items: [...selectedFolder.items, newContent]
    };
    
    setSelectedFolder(updatedFolder);
    
    // Update folders list
    setFolders(folders.map(folder => 
      folder.id === selectedFolder.id ? updatedFolder : folder
    ));
    
    // Also update folder tree if needed
    const updateFolderItemsInTree = (tree: FolderTree[]): FolderTree[] => {
      return tree.map(folder => {
        if (folder.id === selectedFolder.id) {
          return {
            ...folder,
            items: [...folder.items, newContent]
          };
        }
        if (folder.children.length > 0) {
          return {
            ...folder,
            children: updateFolderItemsInTree(folder.children)
          };
        }
        return folder;
      });
    };
    
    setFolderTree(updateFolderItemsInTree(folderTree));
    
    setIsAddContentOpen(false);
    setNewContentTitle("");
    setNewContentType("lesson");
    toast.success("Content added successfully");
  };

  // Handle view content
  const handleViewContent = (item: ContentItem) => {
    // First, check if this content already exists in the appropriate collection
    // If not, create a toast message that in a real implementation this would navigate to the content
    switch (item.type) {
      case 'lesson':
        // In a full implementation, this would navigate to the lesson detail page
        // navigate(`/lessons/${item.contentId}`);
        toast.info(`Viewing lesson: ${item.title}`);
        break;
      case 'lab':
        // For labs, we could navigate to the labs page with the ID
        navigate(`/labs`);
        toast.info(`Navigating to Labs section`);
        break;
      case 'assessment':
        // In a full implementation, this would navigate to the assessment detail page
        // navigate(`/assessments/${item.contentId}`);
        toast.info(`Viewing assessment: ${item.title}`);
        break;
      default:
        toast.info(`Viewing ${item.type}: ${item.title}`);
    }
  };

  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <Book className="h-4 w-4" />;
      case 'lab':
        return <Beaker className="h-4 w-4" />;
      case 'assessment':
        return <FileSpreadsheet className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Library</h1>
            <p className="text-muted-foreground">Organize and manage your content</p>
          </div>
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Search folders..." 
              className="w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline" size="sm" onClick={resetToMockData} className="flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              Reset Data
            </Button>
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <FolderPlus className="h-4 w-4" />
                  <span>New Folder</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                  <DialogDescription>
                    Create a new folder to organize your content.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Folder Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Enter folder name" 
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Enter folder description"
                      value={newFolderDescription}
                      onChange={(e) => setNewFolderDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateFolder}>Create Folder</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Folders Sidebar */}
          <Card className="col-span-3 glass-card">
            <CardHeader>
              <CardTitle>Folders</CardTitle>
              <CardDescription>
                {folders.length} folders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-1">
                  {/* Render root folders and their subfolders */}
                  {folderTree.length > 0 ? (
                    folderTree
                      .filter(folder => folder.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((folder) => (
                        <div key={folder.id} className="space-y-1">
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFolderExpanded(folder.id);
                              }}
                            >
                              {folder.children.length > 0 && (
                                expandedFolders.includes(folder.id) 
                                  ? <ChevronDown className="h-4 w-4" /> 
                                  : <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              className={cn(
                                "flex-1 justify-start text-left font-normal",
                                selectedFolder?.id === folder.id && "bg-accent"
                              )}
                              onClick={() => {
                                // Find the corresponding flat folder
                                const flatFolder = folders.find(f => f.id === folder.id);
                                if (flatFolder) {
                                  setSelectedFolder(flatFolder);
                                } else {
                                  // If not found in flat folders, create one from the tree
                                  const newFolder: Folder = {
                                    id: folder.id,
                                    name: folder.name,
                                    description: folder.description,
                                    createdAt: folder.createdAt,
                                    updatedAt: folder.updatedAt,
                                    parentId: folder.parentId,
                                    items: folder.items
                                  };
                                  setSelectedFolder(newFolder);
                                }
                                
                                // If it has children, expand it
                                if (folder.children.length > 0 && !expandedFolders.includes(folder.id)) {
                                  toggleFolderExpanded(folder.id);
                                }
                              }}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <FolderOpen className="h-4 w-4" />
                                  <span className="truncate">{folder.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{folder.items.length}</span>
                              </div>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNewFolderParentId(folder.id);
                                    setIsCreateSubfolderOpen(true);
                                  }}
                                >
                                  <FolderPlus className="h-4 w-4 mr-2" />
                                  Add Subfolder
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsShareDialogOpen(true);
                                  }}
                                >
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share Folder
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    promptDeleteFolder(folder.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Folder
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {/* Render subfolders if expanded */}
                          {expandedFolders.includes(folder.id) && folder.children.length > 0 && (
                            <div className="pl-8 space-y-1">
                              {folder.children.map((subfolder) => (
                                <div key={subfolder.id} className="flex items-center">
                                  <Button
                                    variant="ghost"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      selectedFolder?.id === subfolder.id && "bg-accent"
                                    )}
                                    onClick={() => {
                                      // Create a flat folder from the subfolder
                                      const flatFolder: Folder = {
                                        id: subfolder.id,
                                        name: subfolder.name,
                                        description: subfolder.description,
                                        createdAt: subfolder.createdAt,
                                        updatedAt: subfolder.updatedAt,
                                        parentId: subfolder.parentId,
                                        items: subfolder.items
                                      };
                                      setSelectedFolder(flatFolder);
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <FolderOpen className="h-4 w-4" />
                                      <span className="truncate">{subfolder.name}</span>
                                    </div>
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsShareDialogOpen(true);
                                        }}
                                      >
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Share Folder
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        className="text-destructive focus:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          promptDeleteFolder(subfolder.id);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Folder
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      {searchTerm ? "No folders found" : "No folders yet"}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Folder Content */}
          <div className="col-span-9">
            {selectedFolder ? (
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{selectedFolder.name}</CardTitle>
                    <CardDescription>
                      {selectedFolder.description || "No description"}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openEditFolderDialog(selectedFolder)}
                      >
                        <PenLine className="h-4 w-4 mr-2" />
                        Edit Folder
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsShareDialogOpen(true)}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Folder
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => promptDeleteFolder(selectedFolder.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Folder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all">
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="lessons">Lessons</TabsTrigger>
                      <TabsTrigger value="labs">Labs</TabsTrigger>
                      <TabsTrigger value="assessments">Assessments</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="mt-4">
                      {selectedFolder.items.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedFolder.items.map((item) => (
                            <Card key={item.id} className="overflow-hidden">
                              <CardHeader className="bg-muted/50 p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {getContentTypeIcon(item.type)}
                                    <span className="text-xs font-medium uppercase">{item.type}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleViewVersionHistory(item.contentId)}
                                    >
                                      <History className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => promptRemoveItem(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4">
                                <h3 className="font-semibold truncate">{item.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Version: {item.version || 1} • Updated: {new Date(item.updatedAt).toLocaleDateString()}
                                </p>
                              </CardContent>
                              <CardFooter className="p-4 pt-0 flex justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewContent(item)}
                                >
                                  View
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-muted-foreground">
                          <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <h3 className="font-medium mb-1">No items in this folder</h3>
                          <p className="text-sm">Save lessons, labs, or assessments to this folder</p>
                          <Button 
                            className="mt-4" 
                            variant="outline"
                            onClick={() => setIsAddContentOpen(true)}
                          >
                            <FilePlus2 className="h-4 w-4 mr-2" />
                            Add Content
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="lessons">
                      {selectedFolder.items.filter(item => item.type === 'lesson').length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedFolder.items
                            .filter(item => item.type === 'lesson')
                            .map((item) => (
                              <Card key={item.id} className="overflow-hidden">
                                <CardHeader className="bg-muted/50 p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Book className="h-4 w-4" />
                                      <span className="text-xs font-medium uppercase">Lesson</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleViewVersionHistory(item.contentId)}
                                      >
                                        <History className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => promptRemoveItem(item.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                  <h3 className="font-semibold truncate">{item.title}</h3>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Version: {item.version || 1} • Updated: {new Date(item.updatedAt).toLocaleDateString()}
                                  </p>
                                </CardContent>
                                <CardFooter className="p-4 pt-0 flex justify-end">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleViewContent(item)}
                                  >
                                    View
                                  </Button>
                                </CardFooter>
                              </Card>
                            ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-muted-foreground">
                          <Book className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <h3 className="font-medium mb-1">No lessons in this folder</h3>
                          <p className="text-sm">Save lessons to this folder</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="labs">
                      {selectedFolder.items.filter(item => item.type === 'lab').length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedFolder.items
                            .filter(item => item.type === 'lab')
                            .map((item) => (
                              <Card key={item.id} className="overflow-hidden">
                                <CardHeader className="bg-muted/50 p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Beaker className="h-4 w-4" />
                                      <span className="text-xs font-medium uppercase">Lab</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleViewVersionHistory(item.contentId)}
                                      >
                                        <History className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => promptRemoveItem(item.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                  <h3 className="font-semibold truncate">{item.title}</h3>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Version: {item.version || 1} • Updated: {new Date(item.updatedAt).toLocaleDateString()}
                                  </p>
                                </CardContent>
                                <CardFooter className="p-4 pt-0 flex justify-end">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleViewContent(item)}
                                  >
                                    View
                                  </Button>
                                </CardFooter>
                              </Card>
                            ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-muted-foreground">
                          <Beaker className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <h3 className="font-medium mb-1">No labs in this folder</h3>
                          <p className="text-sm">Save labs to this folder</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="assessments">
                      {selectedFolder.items.filter(item => item.type === 'assessment').length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedFolder.items
                            .filter(item => item.type === 'assessment')
                            .map((item) => (
                              <Card key={item.id} className="overflow-hidden">
                                <CardHeader className="bg-muted/50 p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <FileSpreadsheet className="h-4 w-4" />
                                      <span className="text-xs font-medium uppercase">Assessment</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleViewVersionHistory(item.contentId)}
                                      >
                                        <History className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => promptRemoveItem(item.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                  <h3 className="font-semibold truncate">{item.title}</h3>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Version: {item.version || 1} • Updated: {new Date(item.updatedAt).toLocaleDateString()}
                                  </p>
                                </CardContent>
                                <CardFooter className="p-4 pt-0 flex justify-end">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleViewContent(item)}
                                  >
                                    View
                                  </Button>
                                </CardFooter>
                              </Card>
                            ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-muted-foreground">
                          <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <h3 className="font-medium mb-1">No assessments in this folder</h3>
                          <p className="text-sm">Save assessments to this folder</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full glass-card flex items-center justify-center">
                <CardContent className="py-12 text-center">
                  <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-medium mb-2">No folder selected</h3>
                  <p className="text-muted-foreground mb-6">Select a folder from the sidebar or create a new one</p>
                  <Button onClick={() => setIsCreateFolderOpen(true)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Create New Folder
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Version History Dialog */}
            {showVersionHistory && selectedContentId && (
              <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Version History: {selectedContent?.title}
                    </DialogTitle>
                    <DialogDescription>
                      View and restore previous versions of this content
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    {selectedContent && (
                      <Card className="mb-4 bg-muted/20">
                        <CardHeader className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getContentTypeIcon(selectedContent.type)}
                              <CardTitle className="text-base">{selectedContent.title}</CardTitle>
                            </div>
                            <Badge variant="outline">
                              {selectedContent.type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Current Version: {selectedContent.version || 1}</span>
                            <span>Last Updated: {new Date(selectedContent.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    <ScrollArea className="h-[320px] pr-4">
                      {getContentVersions(selectedContentId).map((version) => (
                        <Card key={version.id} className="mb-4">
                          <CardHeader className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Version {version.version}
                                </CardTitle>
                                <CardDescription>
                                  {new Date(version.createdAt).toLocaleString()} • {version.createdBy}
                                </CardDescription>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRestoreVersion(version)}
                              >
                                Restore
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <p className="text-sm text-muted-foreground">{version.notes || "No notes"}</p>
                            <div className="mt-2 p-3 bg-muted/30 rounded-md">
                              <pre className="text-xs overflow-auto whitespace-pre-wrap">
                                {JSON.stringify(version.data, null, 2)}
                              </pre>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </ScrollArea>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowVersionHistory(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Create Subfolder Dialog */}
        <Dialog open={isCreateSubfolderOpen} onOpenChange={setIsCreateSubfolderOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Subfolder</DialogTitle>
              <DialogDescription>
                Create a new subfolder to better organize your content.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="subfolder-name">Subfolder Name</Label>
                <Input 
                  id="subfolder-name" 
                  placeholder="Enter subfolder name" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subfolder-description">Description (Optional)</Label>
                <Textarea 
                  id="subfolder-description" 
                  placeholder="Enter subfolder description"
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateSubfolderOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateSubfolder}>Create Subfolder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Folder Dialog */}
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Folder</DialogTitle>
              <DialogDescription>
                Share this folder with other teachers in your school or district.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="share-email">Email Address</Label>
                <Input 
                  id="share-email" 
                  type="email"
                  placeholder="colleague@school.edu" 
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleShareFolder}>Share</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Content Dialog */}
        <Dialog open={isAddContentOpen} onOpenChange={setIsAddContentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Content</DialogTitle>
              <DialogDescription>
                Add new content to this folder.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="content-title">Title</Label>
                <Input 
                  id="content-title" 
                  placeholder="Enter content title" 
                  value={newContentTitle}
                  onChange={(e) => setNewContentTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content-type">Content Type</Label>
                <Select 
                  value={newContentType} 
                  onValueChange={(value) => setNewContentType(value as ContentType)}
                >
                  <SelectTrigger id="content-type">
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson">Lesson</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddContentOpen(false)}>Cancel</Button>
              <Button onClick={handleAddContent}>Add Content</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Folder Dialog */}
        <Dialog open={isEditFolderOpen} onOpenChange={setIsEditFolderOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Folder</DialogTitle>
              <DialogDescription>
                Edit the details of this folder.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input 
                  id="folder-name" 
                  placeholder="Enter folder name" 
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="folder-description">Description (Optional)</Label>
                <Textarea 
                  id="folder-description" 
                  placeholder="Enter folder description"
                  value={editFolderDescription}
                  onChange={(e) => setEditFolderDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditFolderOpen(false)}>Cancel</Button>
              <Button onClick={handleEditFolder}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Folder Confirmation Dialog */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this folder? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteFolder}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Item Confirmation Dialog */}
        <Dialog open={isRemoveItemConfirmOpen} onOpenChange={setIsRemoveItemConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Removal</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this item from the folder? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRemoveItemConfirmOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRemoveItem}>Remove</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
} 