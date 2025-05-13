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
      <div className="container mx-auto py-4 sm:py-6 px-3 sm:px-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Library</h1>
            <p className="text-muted-foreground text-sm">Organize and manage your content</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Input 
              placeholder="Search folders..." 
              className="w-full sm:w-64 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={resetToMockData} className="flex items-center gap-1 text-xs h-9">
                <RefreshCw className="h-3.5 w-3.5" />
              Reset Data
            </Button>
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
              <DialogTrigger asChild>
                  <Button className="flex items-center gap-1 text-xs h-9 w-full sm:w-auto">
                    <FolderPlus className="h-3.5 w-3.5" />
                  <span>New Folder</span>
                </Button>
              </DialogTrigger>
                <DialogContent className="max-w-md">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
          {/* Folders Sidebar */}
          <Card className="md:col-span-4 lg:col-span-3 glass-card">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-lg">Folders</CardTitle>
              <CardDescription>
                {folders.length} folders
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 px-3 sm:px-6 pb-3 sm:pb-6">
              <ScrollArea className="h-[350px] sm:h-[500px] pr-3 sm:pr-4">
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
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFolderExpanded(folder.id);
                              }}
                            >
                              {folder.children.length > 0 && (
                                expandedFolders.includes(folder.id) 
                                  ? <ChevronDown className="h-3.5 w-3.5" /> 
                                  : <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              className={cn(
                                "flex-1 justify-start text-left font-normal text-xs sm:text-sm py-1.5 h-7",
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
                                <div className="flex items-center gap-1.5">
                                  <FolderOpen className="h-3.5 w-3.5" />
                                  <span className="truncate">{folder.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{folder.items.length}</span>
                              </div>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNewFolderParentId(folder.id);
                                    setIsCreateSubfolderOpen(true);
                                  }}
                                  className="text-xs"
                                >
                                  <FolderPlus className="h-3.5 w-3.5 mr-2" />
                                  Add Subfolder
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsShareDialogOpen(true);
                                  }}
                                  className="text-xs"
                                >
                                  <Share2 className="h-3.5 w-3.5 mr-2" />
                                  Share Folder
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    promptDeleteFolder(folder.id);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Delete Folder
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {/* Render subfolders if expanded */}
                          {expandedFolders.includes(folder.id) && folder.children.length > 0 && (
                            <div className="pl-6 space-y-1">
                              {folder.children.map((subfolder) => (
                                <div key={subfolder.id} className="flex items-center">
                                  <Button
                                    variant="ghost"
                                    className={cn(
                                      "w-full justify-start text-left font-normal text-xs sm:text-sm py-1.5 h-7",
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
                                    <div className="flex items-center gap-1.5">
                                      <FolderOpen className="h-3.5 w-3.5" />
                                      <span className="truncate">{subfolder.name}</span>
                                    </div>
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52">
                                      <DropdownMenuItem 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsShareDialogOpen(true);
                                        }}
                                        className="text-xs"
                                      >
                                        <Share2 className="h-3.5 w-3.5 mr-2" />
                                        Share Folder
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        className="text-destructive focus:text-destructive text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          promptDeleteFolder(subfolder.id);
                                        }}
                                      >
                                        <Trash2 className="h-3.5 w-3.5 mr-2" />
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
                    <div className="py-10 text-center text-muted-foreground">
                      {searchTerm ? "No folders found" : "No folders yet"}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Folder Content */}
          <div className="md:col-span-8 lg:col-span-9">
            {selectedFolder ? (
              <Card className="glass-card">
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                      <CardTitle className="text-xl">{selectedFolder.name}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                      {selectedFolder.description || "No description"}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openEditFolderDialog(selectedFolder)}
                          className="text-xs"
                      >
                          <PenLine className="h-3.5 w-3.5 mr-2" />
                        Edit Folder
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsShareDialogOpen(true)}
                          className="text-xs"
                      >
                          <Share2 className="h-3.5 w-3.5 mr-2" />
                        Share Folder
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                          className="text-destructive focus:text-destructive text-xs"
                        onClick={() => promptDeleteFolder(selectedFolder.id)}
                      >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete Folder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="px-0 pt-0">
                  <div className="overflow-x-auto no-scrollbar pb-1">
                    <Tabs defaultValue="all" className="w-full">
                      <div className="px-3 sm:px-6">
                        <TabsList className="h-9 px-1.5 w-full sm:w-auto">
                          <TabsTrigger value="all" className="text-xs py-1.5 px-3">All</TabsTrigger>
                          <TabsTrigger value="lessons" className="text-xs py-1.5 px-3">Lessons</TabsTrigger>
                          <TabsTrigger value="labs" className="text-xs py-1.5 px-3">Labs</TabsTrigger>
                          <TabsTrigger value="assessments" className="text-xs py-1.5 px-3">Assessments</TabsTrigger>
                    </TabsList>
                      </div>
                      <TabsContent value="all" className="mt-4 px-3 sm:px-6">
                      {selectedFolder.items.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {selectedFolder.items.map((item) => (
                              <Card key={item.id} className="overflow-hidden border border-border/40">
                                <CardHeader className="bg-muted/50 p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                    {getContentTypeIcon(item.type)}
                                    <span className="text-xs font-medium uppercase">{item.type}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                        className="h-7 w-7"
                                      onClick={() => handleViewVersionHistory(item.contentId)}
                                    >
                                        <History className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                        className="h-7 w-7"
                                      onClick={() => promptRemoveItem(item.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                                <CardContent className="p-3">
                                  <h3 className="font-semibold truncate text-sm">{item.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Version: {item.version || 1} • Updated: {new Date(item.updatedAt).toLocaleDateString()}
                                </p>
                              </CardContent>
                                <CardFooter className="p-3 pt-0 flex justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                    className="text-xs h-7"
                                  onClick={() => handleViewContent(item)}
                                >
                                  View
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      ) : (
                          <div className="py-8 sm:py-12 text-center text-muted-foreground">
                            <File className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground/50" />
                            <h3 className="font-medium mb-1 text-sm sm:text-base">No items in this folder</h3>
                            <p className="text-xs sm:text-sm">Save lessons, labs, or assessments to this folder</p>
                          <Button 
                              className="mt-3 sm:mt-4 text-xs h-8" 
                            variant="outline"
                            onClick={() => setIsAddContentOpen(true)}
                          >
                              <FilePlus2 className="h-3.5 w-3.5 mr-1.5" />
                            Add Content
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                      <TabsContent value="lessons" className="mt-4 px-3 sm:px-6">
                      {selectedFolder.items.filter(item => item.type === 'lesson').length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {selectedFolder.items
                            .filter(item => item.type === 'lesson')
                            .map((item) => (
                                <Card key={item.id} className="overflow-hidden border border-border/40">
                                  <CardHeader className="bg-muted/50 p-3">
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <Book className="h-3.5 w-3.5" />
                                      <span className="text-xs font-medium uppercase">Lesson</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                          className="h-7 w-7"
                                        onClick={() => handleViewVersionHistory(item.contentId)}
                                      >
                                          <History className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                          className="h-7 w-7"
                                        onClick={() => promptRemoveItem(item.id)}
                                      >
                                          <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                  <CardContent className="p-3">
                                    <h3 className="font-semibold truncate text-sm">{item.title}</h3>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Version: {item.version || 1} • Updated: {new Date(item.updatedAt).toLocaleDateString()}
                                  </p>
                                </CardContent>
                                  <CardFooter className="p-3 pt-0 flex justify-end">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                      className="text-xs h-7"
                                    onClick={() => handleViewContent(item)}
                                  >
                                    View
                                  </Button>
                                </CardFooter>
                              </Card>
                            ))}
                        </div>
                      ) : (
                          <div className="py-8 sm:py-12 text-center text-muted-foreground">
                            <Book className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground/50" />
                            <h3 className="font-medium mb-1 text-sm sm:text-base">No lessons in this folder</h3>
                            <p className="text-xs sm:text-sm">Save lessons to this folder</p>
                        </div>
                      )}
                    </TabsContent>
                      <TabsContent value="labs" className="mt-4 px-3 sm:px-6">
                      {selectedFolder.items.filter(item => item.type === 'lab').length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {selectedFolder.items
                            .filter(item => item.type === 'lab')
                            .map((item) => (
                                <Card key={item.id} className="overflow-hidden border border-border/40">
                                  <CardHeader className="bg-muted/50 p-3">
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <Beaker className="h-3.5 w-3.5" />
                                      <span className="text-xs font-medium uppercase">Lab</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                          className="h-7 w-7"
                                        onClick={() => handleViewVersionHistory(item.contentId)}
                                      >
                                          <History className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                          className="h-7 w-7"
                                        onClick={() => promptRemoveItem(item.id)}
                                      >
                                          <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                  <CardContent className="p-3">
                                    <h3 className="font-semibold truncate text-sm">{item.title}</h3>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Version: {item.version || 1} • Updated: {new Date(item.updatedAt).toLocaleDateString()}
                                  </p>
                                </CardContent>
                                  <CardFooter className="p-3 pt-0 flex justify-end">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                      className="text-xs h-7"
                                    onClick={() => handleViewContent(item)}
                                  >
                                    View
                                  </Button>
                                </CardFooter>
                              </Card>
                            ))}
                        </div>
                      ) : (
                          <div className="py-8 sm:py-12 text-center text-muted-foreground">
                            <Beaker className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground/50" />
                            <h3 className="font-medium mb-1 text-sm sm:text-base">No labs in this folder</h3>
                            <p className="text-xs sm:text-sm">Save labs to this folder</p>
                        </div>
                      )}
                    </TabsContent>
                      <TabsContent value="assessments" className="mt-4 px-3 sm:px-6">
                      {selectedFolder.items.filter(item => item.type === 'assessment').length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {selectedFolder.items
                            .filter(item => item.type === 'assessment')
                            .map((item) => (
                                <Card key={item.id} className="overflow-hidden border border-border/40">
                                  <CardHeader className="bg-muted/50 p-3">
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                      <span className="text-xs font-medium uppercase">Assessment</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                          className="h-7 w-7"
                                        onClick={() => handleViewVersionHistory(item.contentId)}
                                      >
                                          <History className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                          className="h-7 w-7"
                                        onClick={() => promptRemoveItem(item.id)}
                                      >
                                          <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                  <CardContent className="p-3">
                                    <h3 className="font-semibold truncate text-sm">{item.title}</h3>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Version: {item.version || 1} • Updated: {new Date(item.updatedAt).toLocaleDateString()}
                                  </p>
                                </CardContent>
                                  <CardFooter className="p-3 pt-0 flex justify-end">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                      className="text-xs h-7"
                                    onClick={() => handleViewContent(item)}
                                  >
                                    View
                                  </Button>
                                </CardFooter>
                              </Card>
                            ))}
                        </div>
                      ) : (
                          <div className="py-8 sm:py-12 text-center text-muted-foreground">
                            <FileSpreadsheet className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground/50" />
                            <h3 className="font-medium mb-1 text-sm sm:text-base">No assessments in this folder</h3>
                            <p className="text-xs sm:text-sm">Save assessments to this folder</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full glass-card flex items-center justify-center">
                <CardContent className="py-8 sm:py-12 text-center">
                  <FolderOpen className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg sm:text-xl font-medium mb-1 sm:mb-2">No folder selected</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6">Select a folder from the sidebar or create a new one</p>
                  <Button 
                    onClick={() => setIsCreateFolderOpen(true)}
                    className="text-xs sm:text-sm h-8 sm:h-9"
                  >
                    <FolderPlus className="h-3.5 w-3.5 mr-1.5" />
                    Create New Folder
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Version History Dialog */}
            {showVersionHistory && selectedContentId && (
              <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
                <DialogContent className="max-w-lg sm:max-w-2xl max-h-[90vh] w-[95vw] sm:w-auto p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <History className="h-4 w-4 sm:h-5 sm:w-5" />
                      Version History: {selectedContent?.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                      View and restore previous versions of this content
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-2 sm:py-4">
                    {selectedContent && (
                      <Card className="mb-3 sm:mb-4 bg-muted/20">
                        <CardHeader className="py-2 sm:py-3 px-3 sm:px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {getContentTypeIcon(selectedContent.type)}
                              <CardTitle className="text-sm sm:text-base">{selectedContent.title}</CardTitle>
                            </div>
                            <Badge variant="outline" className="text-xs py-0.5 px-1.5 h-auto">
                              {selectedContent.type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-2 px-3 sm:px-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                            <span>Current Version: {selectedContent.version || 1}</span>
                            <span>Last Updated: {new Date(selectedContent.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    <ScrollArea className="h-[250px] sm:h-[320px] pr-3 sm:pr-4">
                      {getContentVersions(selectedContentId).map((version) => (
                        <Card key={version.id} className="mb-3 sm:mb-4">
                          <CardHeader className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <CardTitle className="text-sm sm:text-base flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  Version {version.version}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  {new Date(version.createdAt).toLocaleString()} • {version.createdBy}
                                </CardDescription>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-xs h-7 sm:h-8"
                                onClick={() => handleRestoreVersion(version)}
                              >
                                Restore
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-4 pt-0">
                            <p className="text-xs text-muted-foreground">{version.notes || "No notes"}</p>
                            <div className="mt-2 p-2 sm:p-3 bg-muted/30 rounded-md">
                              <pre className="text-xs overflow-auto whitespace-pre-wrap max-h-[100px] sm:max-h-none">
                                {JSON.stringify(version.data, null, 2)}
                              </pre>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </ScrollArea>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowVersionHistory(false)} className="text-xs sm:text-sm h-8 sm:h-9">Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Create Subfolder Dialog */}
        <Dialog open={isCreateSubfolderOpen} onOpenChange={setIsCreateSubfolderOpen}>
          <DialogContent className="max-w-md w-[95vw] sm:w-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Create Subfolder</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Create a new subfolder to better organize your content.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="subfolder-name" className="text-xs sm:text-sm">Subfolder Name</Label>
                <Input 
                  id="subfolder-name" 
                  placeholder="Enter subfolder name" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="subfolder-description" className="text-xs sm:text-sm">Description (Optional)</Label>
                <Textarea 
                  id="subfolder-description" 
                  placeholder="Enter subfolder description"
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  className="text-xs sm:text-sm min-h-[60px] sm:min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateSubfolderOpen(false)} className="text-xs sm:text-sm h-8 sm:h-9">Cancel</Button>
              <Button onClick={handleCreateSubfolder} className="text-xs sm:text-sm h-8 sm:h-9">Create Subfolder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Folder Dialog */}
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent className="max-w-md w-[95vw] sm:w-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Share Folder</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Share this folder with other teachers in your school or district.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="share-email" className="text-xs sm:text-sm">Email Address</Label>
                <Input 
                  id="share-email" 
                  type="email"
                  placeholder="colleague@school.edu" 
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsShareDialogOpen(false)} className="text-xs sm:text-sm h-8 sm:h-9">Cancel</Button>
              <Button onClick={handleShareFolder} className="text-xs sm:text-sm h-8 sm:h-9">Share</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Content Dialog */}
        <Dialog open={isAddContentOpen} onOpenChange={setIsAddContentOpen}>
          <DialogContent className="max-w-md w-[95vw] sm:w-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Add Content</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Add new content to this folder.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="content-title" className="text-xs sm:text-sm">Title</Label>
                <Input 
                  id="content-title" 
                  placeholder="Enter content title" 
                  value={newContentTitle}
                  onChange={(e) => setNewContentTitle(e.target.value)}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="content-type" className="text-xs sm:text-sm">Content Type</Label>
                <Select 
                  value={newContentType} 
                  onValueChange={(value) => setNewContentType(value as ContentType)}
                >
                  <SelectTrigger id="content-type" className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson" className="text-xs sm:text-sm">Lesson</SelectItem>
                    <SelectItem value="lab" className="text-xs sm:text-sm">Lab</SelectItem>
                    <SelectItem value="assessment" className="text-xs sm:text-sm">Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddContentOpen(false)} className="text-xs sm:text-sm h-8 sm:h-9">Cancel</Button>
              <Button onClick={handleAddContent} className="text-xs sm:text-sm h-8 sm:h-9">Add Content</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Folder Dialog */}
        <Dialog open={isEditFolderOpen} onOpenChange={setIsEditFolderOpen}>
          <DialogContent className="max-w-md w-[95vw] sm:w-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Edit Folder</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Edit the details of this folder.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="folder-name" className="text-xs sm:text-sm">Folder Name</Label>
                <Input 
                  id="folder-name" 
                  placeholder="Enter folder name" 
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="folder-description" className="text-xs sm:text-sm">Description (Optional)</Label>
                <Textarea 
                  id="folder-description" 
                  placeholder="Enter folder description"
                  value={editFolderDescription}
                  onChange={(e) => setEditFolderDescription(e.target.value)}
                  className="text-xs sm:text-sm min-h-[60px] sm:min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditFolderOpen(false)} className="text-xs sm:text-sm h-8 sm:h-9">Cancel</Button>
              <Button onClick={handleEditFolder} className="text-xs sm:text-sm h-8 sm:h-9">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Folder Confirmation Dialog */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="max-w-md w-[95vw] sm:w-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Confirm Deletion</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Are you sure you want to delete this folder? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-3 sm:mt-4">
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} className="text-xs sm:text-sm h-8 sm:h-9">Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteFolder} className="text-xs sm:text-sm h-8 sm:h-9">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Item Confirmation Dialog */}
        <Dialog open={isRemoveItemConfirmOpen} onOpenChange={setIsRemoveItemConfirmOpen}>
          <DialogContent className="max-w-md w-[95vw] sm:w-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Confirm Removal</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Are you sure you want to remove this item from the folder? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-3 sm:mt-4">
              <Button variant="outline" onClick={() => setIsRemoveItemConfirmOpen(false)} className="text-xs sm:text-sm h-8 sm:h-9">Cancel</Button>
              <Button variant="destructive" onClick={handleRemoveItem} className="text-xs sm:text-sm h-8 sm:h-9">Remove</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
} 