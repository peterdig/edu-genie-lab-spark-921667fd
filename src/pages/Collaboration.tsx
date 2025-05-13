import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, MessageSquare, Share2, FileText, Clock, Search, PlusCircle, UserPlus, Trash2, Edit, Check, X, Mail, AlertTriangle } from "lucide-react";
import { useCollaboration } from "@/hooks/useCollaboration";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/lib/AuthContext.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Function to get initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Map role to badge color
const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'owner': return 'default';
    case 'admin': return 'secondary';
    case 'member': return 'outline';
    default: return 'outline';
  }
};

export default function Collaboration() {
  const [activeTab, setActiveTab] = useState("teams");
  const [newTeamOpen, setNewTeamOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [resourceType, setResourceType] = useState<'lesson' | 'assessment' | 'template' | 'rubric'>('lesson');
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view');
  const [shareOpen, setShareOpen] = useState(false);
  
  const {
    teams,
    teamMembers,
    sharedResources,
    loading,
    error,
    searchResults,
    searchUsers,
    getUserTeams,
    getTeamMembers,
    getTeamSharedResources,
    createTeam,
    updateTeam,
    deleteTeam,
    inviteToTeam,
    shareResource,
    unshareResource,
    removeTeamMember,
    usingFallback,
    isAuthenticated
  } = useCollaboration();
  
  // Filtered user teams
  const userTeams = getUserTeams();
  
  // Get authentication status from AuthContext
  const { isAuthenticated: authContextStatus } = useAuth();
  
  // Set the first team as selected if none is selected and teams are loaded
  useEffect(() => {
    if (!loading && userTeams.length > 0 && !selectedTeam) {
      setSelectedTeam(userTeams[0].id);
    }
  }, [loading, userTeams, selectedTeam]);
  
  // Filter members of the selected team
  const teamMembersList = selectedTeam 
    ? getTeamMembers(selectedTeam)
    : [];
  
  // Get shared resources for the selected team
  const teamResources = selectedTeam
    ? getTeamSharedResources(selectedTeam)
    : [];
  
  // Handle team creation
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error("Team name is required");
      return;
    }
    
    try {
      await createTeam(newTeamName, newTeamDescription);
      toast.success("Team created successfully");
      setNewTeamName("");
      setNewTeamDescription("");
      setNewTeamOpen(false);
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error("Failed to create team");
    }
  };
  
  // Handle user invitation
  const handleInviteUser = async (userId: string) => {
    if (!selectedTeam) {
      toast.error("No team selected");
      return;
    }
    
    try {
      await inviteToTeam(selectedTeam, userId, inviteRole);
      toast.success("User invited successfully");
      setInviteOpen(false);
    } catch (error) {
      console.error("Error inviting user:", error);
      toast.error("Failed to invite user");
    }
  };
  
  // Handle resource sharing
  const handleShareResource = async () => {
    if (!selectedTeam || !selectedResource) {
      toast.error("Team and resource are required");
      return;
    }
    
    try {
      await shareResource(selectedResource, resourceType, selectedTeam, sharePermission);
      toast.success("Resource shared successfully");
      setShareOpen(false);
    } catch (error) {
      console.error("Error sharing resource:", error);
      toast.error("Failed to share resource");
    }
  };
  
  // Handle team deletion
  const handleDeleteTeam = async (teamId: string) => {
    try {
      await deleteTeam(teamId);
      toast.success("Team deleted successfully");
      
      // If the deleted team was selected, clear the selection
      if (selectedTeam === teamId) {
        setSelectedTeam(null);
      }
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error("Failed to delete team");
    }
  };
  
  // Handle removing a team member
  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeTeamMember(memberId);
      toast.success("Member removed successfully");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };
  
  // Handle unsharing a resource
  const handleUnshareResource = async (shareId: string) => {
    try {
      await unshareResource(shareId);
      toast.success("Resource unshared successfully");
    } catch (error) {
      console.error("Error unsharing resource:", error);
      toast.error("Failed to unshare resource");
    }
  };
  
  // Update search results when search term changes
  useEffect(() => {
    searchUsers(searchTerm);
  }, [searchTerm]);

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center">
                An error occurred while loading collaboration data.
              </p>
              <p className="text-muted-foreground text-sm text-center mt-2">
                {error.message || "Please try again later."}
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }
  
  // Authentication check for non-fallback mode
  if (!isAuthenticated && !usingFallback) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Authentication Required</CardTitle>
              <CardDescription className="text-center">
                Please log in to access collaboration features.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => window.location.href = '/login'}
                className="mt-2"
              >
                Log In
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 w-full max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Collaboration</h1>
            <p className="text-muted-foreground mt-1">
              Work with other teachers and share resources
            </p>
          </div>
          {usingFallback && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-300">
              Using localStorage (Offline Mode)
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="teams">
              <Users className="mr-2 h-4 w-4" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="shared">
              <Share2 className="mr-2 h-4 w-4" />
              Shared Content
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Clock className="mr-2 h-4 w-4" />
              Recent Activity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="teams" className="space-y-4">
            {/* Create Team Dialog */}
            <Dialog open={newTeamOpen} onOpenChange={setNewTeamOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                  <DialogDescription>
                    Create a new collaboration team with other teachers
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Team Name</Label>
                    <Input
                      id="name"
                      placeholder="Science Department"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Collaboration team for science teachers"
                      value={newTeamDescription}
                      onChange={(e) => setNewTeamDescription(e.target.value)}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewTeamOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateTeam}>Create Team</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Invite User Dialog */}
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite Team Members</DialogTitle>
                  <DialogDescription>
                    Search and invite other teachers to collaborate
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="role">Member Role</Label>
                    <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="search">Search Users</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Name, email or role"
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="rounded-md border h-[200px]">
                    <ScrollArea className="h-full scrollbar-none smooth-scroll">
                      {searchResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                          <p className="text-sm text-muted-foreground">No users found</p>
                        </div>
                      ) : (
                        <div className="p-1">
                          {searchResults.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-sm">
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium leading-none">{user.name}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                              <Button size="sm" onClick={() => handleInviteUser(user.id)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Invite
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Teams content */}
            <div className="grid gap-4 md:grid-cols-7">
              {/* Teams List */}
              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Your Teams
                  </CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => setNewTeamOpen(true)}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="animate-spin w-6 h-6 border-2 border-primary border-opacity-50 border-t-primary rounded-full" />
                    </div>
                  ) : userTeams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 space-y-2">
                      <p className="text-sm text-muted-foreground text-center">
                        You don't have any teams yet
                      </p>
                      <Button size="sm" onClick={() => setNewTeamOpen(true)}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Create Team
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px] scrollbar-none smooth-scroll">
                      <div className="space-y-1">
                        {userTeams.map((team) => (
                          <div
                            key={team.id}
                            className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                              team.id === selectedTeam ? 'bg-muted' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => setSelectedTeam(team.id)}
                          >
                            <div>
                              <p className="font-medium text-sm">{team.name}</p>
                              {team.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                  {team.description}
                                </p>
                              )}
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the team and remove all members.
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDeleteTeam(team.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Team Details */}
              <Card className="md:col-span-5">
                <CardHeader>
                  <CardTitle>
                    {selectedTeam ? userTeams.find(t => t.id === selectedTeam)?.name || 'Team Details' : 'Team Details'}
                  </CardTitle>
                  <CardDescription>
                    {selectedTeam 
                      ? userTeams.find(t => t.id === selectedTeam)?.description || 'Manage team members and resources'
                      : 'Select a team to view details'}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {!selectedTeam ? (
                    <div className="flex flex-col items-center justify-center h-40 space-y-2">
                      <p className="text-sm text-muted-foreground text-center">
                        Select a team to view details
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Team Members */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-sm">Team Members</h3>
                          <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {teamMembersList.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No members found
                            </p>
                          ) : (
                            <div className="divide-y">
                              {teamMembersList.map((member) => {
                                const user = searchResults.find(u => u.id === member.user_id) || {
                                  name: 'Unknown User',
                                  email: 'unknown@example.com',
                                  role: 'Unknown'
                                };
                                
                                return (
                                  <div key={member.id} className="flex items-center justify-between py-2">
                                    <div className="flex items-center space-x-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="text-sm font-medium">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Badge variant={getRoleBadgeVariant(member.role)}>{member.role}</Badge>
                                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRemoveMember(member.id)}>
                                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Shared Resources */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-sm">Shared Resources</h3>
                          <Button size="sm" variant="outline" onClick={() => setShareOpen(true)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {teamResources.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No shared resources
                            </p>
                          ) : (
                            <div className="divide-y">
                              {teamResources.map((resource) => (
                                <div key={resource.id} className="flex items-center justify-between py-2">
                                  <div className="flex items-center space-x-3">
                                    <div className="bg-muted rounded-md h-9 w-9 flex items-center justify-center">
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{resource.resource_id}</p>
                                      <div className="flex items-center space-x-2">
                                        <Badge variant="outline" className="text-xs">
                                          {resource.resource_type}
                                        </Badge>
                                        <Badge variant={resource.permission === 'edit' ? 'default' : 'secondary'} className="text-xs">
                                          {resource.permission}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleUnshareResource(resource.id)}>
                                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Share Resource Dialog */}
                      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Share a Resource</DialogTitle>
                            <DialogDescription>
                              Share lessons, assessments and other content with your team
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-2">
                            <div className="space-y-2">
                              <Label htmlFor="resource-id">Resource ID</Label>
                              <Input
                                id="resource-id"
                                placeholder="Enter resource ID"
                                value={selectedResource || ''}
                                onChange={(e) => setSelectedResource(e.target.value)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="resource-type">Resource Type</Label>
                              <Select value={resourceType} onValueChange={(value: any) => setResourceType(value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="lesson">Lesson</SelectItem>
                                  <SelectItem value="assessment">Assessment</SelectItem>
                                  <SelectItem value="template">Template</SelectItem>
                                  <SelectItem value="rubric">Rubric</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="permission">Permission</Label>
                              <Select value={sharePermission} onValueChange={(value: any) => setSharePermission(value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select permission" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="view">View Only</SelectItem>
                                  <SelectItem value="edit">Edit</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShareOpen(false)}>Cancel</Button>
                            <Button onClick={handleShareResource}>Share Resource</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="shared" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Shared with You</CardTitle>
                <CardDescription>Content shared with you from other teachers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="animate-spin w-6 h-6 border-2 border-primary border-opacity-50 border-t-primary rounded-full" />
                    </div>
                  ) : sharedResources.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 space-y-2 text-center">
                      <p className="text-sm text-muted-foreground">
                        No content has been shared with you yet
                      </p>
                      <p className="text-xs text-muted-foreground">
                        When other teachers share content with you, it will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {sharedResources.map((resource) => (
                        <Card key={resource.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{resource.resource_type}</Badge>
                              <Badge variant={resource.permission === 'edit' ? 'default' : 'secondary'} className="ml-auto">
                                {resource.permission}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <h3 className="font-medium text-sm">{resource.resource_id}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Shared by: {resource.shared_by}
                            </p>
                          </CardContent>
                          <CardFooter className="flex justify-between pt-0">
                            <Button size="sm" variant="outline">
                              <FileText className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your team's recent collaboration activity</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-opacity-50 border-t-primary rounded-full" />
                  </div>
                ) : (
                  <div className="relative space-y-4">
                    <div className="flex flex-col space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-start space-x-4 p-2 rounded-md hover:bg-muted/50">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{getInitials(searchResults[i % searchResults.length]?.name || 'User')}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="font-medium">{searchResults[i % searchResults.length]?.name || 'User'}</span>
                              {' '}
                              {i === 0 ? 'shared a lesson plan' : i === 1 ? 'commented on your assessment' : i === 2 ? 'joined your team' : i === 3 ? 'edited a shared document' : 'added a new resource'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {`${i * 2 + 1} ${i === 0 ? 'hour' : 'hours'} ago`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background to-transparent h-full w-full" style={{ top: '70%' }}></div>
                    <div className="flex justify-center">
                      <Button variant="outline" size="sm">
                        View All Activity
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
} 