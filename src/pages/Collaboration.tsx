import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Users, 
  MessageSquare, 
  Share2, 
  FileText, 
  Clock, 
  Search, 
  Plus, 
  Settings, 
  UserPlus, 
  Mail, 
  CheckCircle2,
  X,
  MoreHorizontal,
  Send
} from "lucide-react";

// Mock data for teams
const mockTeams = [
  { 
    id: 1, 
    name: "Science Department", 
    members: 8, 
    lastActive: "2 hours ago",
    avatar: "/avatars/team-science.png"
  },
  { 
    id: 2, 
    name: "Math Teachers", 
    members: 12, 
    lastActive: "5 mins ago",
    avatar: "/avatars/team-math.png"
  },
  { 
    id: 3, 
    name: "English Department", 
    members: 6, 
    lastActive: "Yesterday",
    avatar: "/avatars/team-english.png"
  },
  { 
    id: 4, 
    name: "History Curriculum", 
    members: 4, 
    lastActive: "3 days ago",
    avatar: "/avatars/team-history.png"
  },
];

// Mock data for shared content
const mockSharedContent = [
  {
    id: 1,
    title: "Algebra Lesson Plan",
    type: "Lesson",
    sharedBy: "Alex Johnson",
    sharedDate: "2023-10-15",
    avatar: "/avatars/01.png"
  },
  {
    id: 2,
    title: "Biology Quiz - Cellular Respiration",
    type: "Assessment",
    sharedBy: "Maria Garcia",
    sharedDate: "2023-10-14",
    avatar: "/avatars/02.png"
  },
  {
    id: 3,
    title: "Literary Analysis Template",
    type: "Template",
    sharedBy: "James Wilson",
    sharedDate: "2023-10-12",
    avatar: "/avatars/03.png"
  },
  {
    id: 4,
    title: "Chemistry Lab - Acid Base Reactions",
    type: "Lab",
    sharedBy: "Sarah Lee",
    sharedDate: "2023-10-10",
    avatar: "/avatars/04.png"
  },
];

// Mock data for recent activity
const mockActivity = [
  {
    id: 1,
    user: "Alex Johnson",
    action: "commented on",
    item: "Algebra Lesson Plan",
    time: "10 minutes ago",
    avatar: "/avatars/01.png"
  },
  {
    id: 2,
    user: "Maria Garcia",
    action: "shared",
    item: "Biology Quiz - Cellular Respiration",
    time: "2 hours ago",
    avatar: "/avatars/02.png"
  },
  {
    id: 3,
    user: "James Wilson",
    action: "edited",
    item: "Literary Analysis Template",
    time: "Yesterday at 3:45 PM",
    avatar: "/avatars/03.png"
  },
  {
    id: 4,
    user: "Sarah Lee",
    action: "created",
    item: "Chemistry Lab - Acid Base Reactions",
    time: "2 days ago",
    avatar: "/avatars/04.png"
  },
];

// Mock data for pending invites
const mockInvites = [
  {
    id: 1,
    email: "robert.smith@school.edu",
    team: "Science Department",
    sentDate: "2023-10-15"
  },
  {
    id: 2,
    email: "jennifer.davis@school.edu",
    team: "Math Teachers",
    sentDate: "2023-10-14"
  }
];

export default function Collaboration() {
  const [activeTab, setActiveTab] = useState("teams");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [teams, setTeams] = useState(mockTeams);
  const [invites, setInvites] = useState(mockInvites);
  const [sharedContent, setSharedContent] = useState(mockSharedContent);
  
  // New team form state
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: ""
  });
  
  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    email: "",
    team: "",
    message: ""
  });
  
  // Share content form state
  const [shareForm, setShareForm] = useState({
    contentType: "lesson",
    title: "",
    recipients: "",
    message: ""
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, formType: string) => {
    const { name, value } = e.target;
    
    switch (formType) {
      case "team":
        setNewTeam(prev => ({ ...prev, [name]: value }));
        break;
      case "invite":
        setInviteForm(prev => ({ ...prev, [name]: value }));
        break;
      case "share":
        setShareForm(prev => ({ ...prev, [name]: value }));
        break;
    }
  };

  // Handle team creation
  const handleCreateTeam = () => {
    // Validate form
    if (!newTeam.name.trim()) {
      toast.error("Please enter a team name");
      return;
    }
    
    // Create new team object
    const newTeamObj = {
      id: Date.now(),
      name: newTeam.name,
      members: 1,
      lastActive: "Just now",
      avatar: "/avatars/team-default.png"
    };
    
    // Add to teams
    setTeams(prev => [newTeamObj, ...prev]);
    
    // Show success message
    toast.success(`Team "${newTeam.name}" created successfully`);
    
    // Reset form
    setNewTeam({
      name: "",
      description: ""
    });
    
    // Close dialog
    setIsCreateTeamDialogOpen(false);
  };

  // Handle sending invite
  const handleSendInvite = () => {
    // Validate form
    if (!inviteForm.email.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    
    if (!inviteForm.team) {
      toast.error("Please select a team");
      return;
    }
    
    // Create new invite object
    const newInvite = {
      id: Date.now(),
      email: inviteForm.email,
      team: inviteForm.team,
      sentDate: new Date().toISOString().split('T')[0]
    };
    
    // Add to invites
    setInvites(prev => [newInvite, ...prev]);
    
    // Show success message
    toast.success(`Invite sent to ${inviteForm.email}`);
    
    // Reset form
    setInviteForm({
      email: "",
      team: "",
      message: ""
    });
    
    // Close dialog
    setIsInviteDialogOpen(false);
    
    // Switch to Invites tab
    setActiveTab("invites");
  };

  // Handle sharing content
  const handleShareContent = () => {
    // Validate form
    if (!shareForm.title.trim()) {
      toast.error("Please enter a content title");
      return;
    }
    
    if (!shareForm.recipients.trim()) {
      toast.error("Please enter recipients");
      return;
    }
    
    // Create new shared content object
    const newSharedContent = {
      id: Date.now(),
      title: shareForm.title,
      type: shareForm.contentType.charAt(0).toUpperCase() + shareForm.contentType.slice(1),
      sharedBy: "You",
      sharedDate: new Date().toISOString().split('T')[0],
      avatar: "/avatars/you.png"
    };
    
    // Add to shared content
    setSharedContent(prev => [newSharedContent, ...prev]);
    
    // Show success message
    toast.success(`Content shared with ${shareForm.recipients.split(',').length} recipient(s)`);
    
    // Reset form
    setShareForm({
      contentType: "lesson",
      title: "",
      recipients: "",
      message: ""
    });
    
    // Close dialog
    setIsShareDialogOpen(false);
    
    // Switch to Shared Content tab
    setActiveTab("shared");
  };

  // Handle canceling an invite
  const handleCancelInvite = (inviteId: number) => {
    setInvites(prev => prev.filter(invite => invite.id !== inviteId));
    toast.success("Invite canceled");
  };

  // Handle resending an invite
  const handleResendInvite = (inviteId: number) => {
    toast.success("Invite resent");
  };

  // Filter teams based on search
  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter shared content based on search
  const filteredSharedContent = sharedContent.filter(content => 
    content.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    content.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    content.sharedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Collaboration</h1>
            <p className="text-muted-foreground mt-1">
              Work together with your colleagues and share educational content
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Colleagues
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Invite Colleagues</DialogTitle>
                  <DialogDescription>
                    Invite colleagues to collaborate on your educational content
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      placeholder="colleague@school.edu"
                      value={inviteForm.email}
                      onChange={(e) => handleInputChange(e, "invite")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="team">Select Team</Label>
                    <Select 
                      name="team" 
                      value={inviteForm.team} 
                      onValueChange={(value) => 
                        setInviteForm(prev => ({ ...prev, team: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.name}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="message">Personal Message (Optional)</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Add a personal message to your invitation..."
                      value={inviteForm.message}
                      onChange={(e) => handleInputChange(e, "invite")}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendInvite}>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invite
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search teams, shared content, or colleagues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
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
            <TabsTrigger value="invites">
              <Mail className="mr-2 h-4 w-4" />
              Invites
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="teams" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Teams</h2>
              <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Create New Team</DialogTitle>
                    <DialogDescription>
                      Create a team to collaborate with your colleagues
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Team Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Enter team name"
                        value={newTeam.name}
                        onChange={(e) => handleInputChange(e, "team")}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Enter team description"
                        value={newTeam.description}
                        onChange={(e) => handleInputChange(e, "team")}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateTeamDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTeam}>Create Team</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTeams.map((team) => (
                <Card key={team.id}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={team.avatar} alt={team.name} />
                      <AvatarFallback>{team.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{team.name}</CardTitle>
                      <CardDescription>{team.members} members</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-2 h-4 w-4" />
                      Active {team.lastActive}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" onClick={() => toast.success("Chat opened")}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Chat
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.success("Team content opened")}>
                      <FileText className="mr-2 h-4 w-4" />
                      Content
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.success("Team settings opened")}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              <Card 
                className="flex flex-col items-center justify-center h-[200px] border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsCreateTeamDialogOpen(true)}
              >
                <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Create a new team</p>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="shared" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Shared Content</h2>
              <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Content
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Share Content</DialogTitle>
                    <DialogDescription>
                      Share your educational content with colleagues
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contentType">Content Type</Label>
                      <Select 
                        name="contentType" 
                        value={shareForm.contentType} 
                        onValueChange={(value) => 
                          setShareForm(prev => ({ ...prev, contentType: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lesson">Lesson</SelectItem>
                          <SelectItem value="assessment">Assessment</SelectItem>
                          <SelectItem value="lab">Lab</SelectItem>
                          <SelectItem value="template">Template</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="title">Content Title</Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="Enter content title"
                        value={shareForm.title}
                        onChange={(e) => handleInputChange(e, "share")}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="recipients">Recipients</Label>
                      <Input
                        id="recipients"
                        name="recipients"
                        placeholder="Enter email addresses (comma separated)"
                        value={shareForm.recipients}
                        onChange={(e) => handleInputChange(e, "share")}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="shareMessage">Message (Optional)</Label>
                      <Textarea
                        id="shareMessage"
                        name="message"
                        placeholder="Add a message..."
                        value={shareForm.message}
                        onChange={(e) => handleInputChange(e, "share")}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleShareContent}>Share</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Recently Shared With You</CardTitle>
                <CardDescription>Content shared by your colleagues</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {filteredSharedContent.map((content) => (
                    <div key={content.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={content.avatar} alt={content.sharedBy} />
                          <AvatarFallback>{content.sharedBy.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{content.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline">{content.type}</Badge>
                            <span>Shared by {content.sharedBy}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => toast.success("Content opened")}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => toast.success("Options opened")}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>See what's happening in your teams</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {mockActivity.map((activity) => (
                    <div key={activity.id} className="mb-4 last:mb-0">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activity.avatar} alt={activity.user} />
                          <AvatarFallback>{activity.user.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">{activity.user}</span>{" "}
                            {activity.action}{" "}
                            <span 
                              className="font-medium cursor-pointer hover:underline"
                              onClick={() => toast.success(`Opening ${activity.item}`)}
                            >
                              {activity.item}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="invites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Invites</CardTitle>
                <CardDescription>Colleagues you've invited to collaborate</CardDescription>
              </CardHeader>
              <CardContent>
                {invites.length > 0 ? (
                  <div className="space-y-4">
                    {invites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{invite.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Invited to {invite.team} on {invite.sentDate}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleResendInvite(invite.id)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleCancelInvite(invite.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No pending invites</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => setIsInviteDialogOpen(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Send New Invite
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
} 