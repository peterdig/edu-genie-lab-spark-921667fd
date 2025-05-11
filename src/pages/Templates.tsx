import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Check, Edit, Plus, Search, Share, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTemplates } from "@/hooks/useTemplates";
import { useSharedTemplates } from "@/hooks/useSharedTemplates";
import { Template } from "@/lib/supabase";

// Mock user for demo purposes
const CURRENT_USER_ID = 'current-user-id';

const Templates = () => {
  const { toast } = useToast();
  const {
    templates,
    loading,
    error,
    getCategories,
    getTags,
    filterByCategory,
    filterByTag,
    searchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    cloneTemplate,
    useTemplate,
    isUsingFallback
  } = useTemplates();

  const {
    shareDialogOpen,
    setShareDialogOpen,
    templateToShare,
    shareEmail,
    setShareEmail,
    sharePermission,
    setSharePermission,
    getSharedTemplates,
    handleShareTemplate,
    handleShareSubmit
  } = useSharedTemplates();

  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "date">("date");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "",
    tags: [] as string[],
    isPublic: false,
    sections: [{ title: "", content: "", placeholder: "" }]
  });
  const [newTag, setNewTag] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Filter and sort templates
  useEffect(() => {
    let result = [...templates];
    
    // Apply search filter
    if (searchQuery) {
      result = searchTemplates(searchQuery);
    }
    
    // Apply category filter
    if (selectedCategory) {
      result = result.filter(t => t.category === selectedCategory);
    }
    
    // Apply tag filter
    if (selectedTag) {
      result = result.filter(t => 
        t.tags && Array.isArray(t.tags) && t.tags.includes(selectedTag)
      );
    }
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else {
        return new Date(b.updated_at || b.created_at).getTime() - 
               new Date(a.updated_at || a.created_at).getTime();
      }
    });
    
    setFilteredTemplates(result);
  }, [templates, searchQuery, selectedCategory, selectedTag, sortBy]);

  // Handle template selection
  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setPreviewMode(true);
  };

  // Handle adding a new tag
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (newTemplate.tags.includes(newTag.trim())) {
      toast({
        title: "Duplicate Tag",
        description: "This tag has already been added.",
        variant: "destructive",
      });
      return;
    }
    
    setNewTemplate(prev => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()]
    }));
    setNewTag("");
  };

  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    setNewTemplate(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Handle adding a new section
  const handleAddSection = () => {
    setNewTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, { title: "", content: "", placeholder: "" }]
    }));
  };

  // Handle removing a section
  const handleRemoveSection = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  // Handle section change
  const handleSectionChange = (index: number, field: string, value: string) => {
    setNewTemplate(prev => {
      const updatedSections = [...prev.sections];
      updatedSections[index] = {
        ...updatedSections[index],
        [field]: value
      };
      return {
        ...prev,
        sections: updatedSections
      };
    });
  };

  // Handle template creation
  const handleCreateTemplate = async () => {
    try {
      if (!newTemplate.name.trim()) {
        toast({
          title: "Missing Information",
          description: "Template name is required.",
          variant: "destructive",
        });
        return;
      }

      if (!newTemplate.category.trim()) {
        toast({
          title: "Missing Information",
          description: "Category is required.",
          variant: "destructive",
        });
        return;
      }

      // Format sections for template content
      const content = {
        sections: newTemplate.sections.map(section => ({
          title: section.title,
          content: section.content,
          placeholder: section.placeholder
        }))
      };

      await createTemplate(
        newTemplate.name,
        newTemplate.description,
        content,
        newTemplate.category,
        newTemplate.tags,
        newTemplate.isPublic
      );

      toast({
        title: "Template Created",
        description: "Your template has been successfully created.",
      });

      // Reset form and close dialog
      setNewTemplate({
        name: "",
        description: "",
        category: "",
        tags: [],
        isPublic: false,
        sections: [{ title: "", content: "", placeholder: "" }]
      });
      setCreateDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error Creating Template",
        description: "There was an error creating your template. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle template cloning
  const handleCloneTemplate = async (template: Template) => {
    try {
      await cloneTemplate(template.id);
      toast({
        title: "Template Cloned",
        description: `A copy of "${template.name}" has been created.`,
      });
    } catch (error) {
      toast({
        title: "Error Cloning Template",
        description: "There was an error cloning the template. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle template deletion
  const handleDeleteTemplate = async (template: Template) => {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      try {
        await deleteTemplate(template.id);
        setSelectedTemplate(null);
        setPreviewMode(false);
        toast({
          title: "Template Deleted",
          description: `"${template.name}" has been deleted.`,
        });
      } catch (error) {
        toast({
          title: "Error Deleting Template",
          description: "There was an error deleting the template. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle using a template
  const handleUseTemplate = (template: Template) => {
    try {
      const templateData = useTemplate(template.id);
      
      // In a real app, this would navigate to a content creation page 
      // with the template pre-loaded
      toast({
        title: "Template Applied",
        description: `"${template.name}" has been applied. Redirecting...`,
      });
      
      // Simulate navigation
      setTimeout(() => {
        toast({
          title: "Create New Content",
          description: "You can now create your content using the selected template.",
        });
      }, 1500);
    } catch (error) {
      toast({
        title: "Error Using Template",
        description: "There was an error applying the template. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load templates. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Content Templates</h1>
              <p className="text-muted-foreground">
                Browse, create, and use standardized templates for educational content
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 md:mt-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                  <DialogDescription>
                    Design a template for consistent content creation
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input
                          id="template-name"
                          placeholder="e.g., Lab Report Template"
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="template-category">Category</Label>
                        <Input
                          id="template-category"
                          placeholder="e.g., Science"
                          value={newTemplate.category}
                          onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="template-description">Description</Label>
                        <Textarea
                          id="template-description"
                          placeholder="Describe what this template is for..."
                          className="h-[104px]"
                          value={newTemplate.description}
                          onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newTemplate.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={handleAddTag}>
                        Add
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold">Template Sections</Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddSection}>
                        Add Section
                      </Button>
                    </div>
                    
                    {newTemplate.sections.map((section, index) => (
                      <div key={index} className="space-y-3 p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`section-title-${index}`} className="font-medium">
                            Section {index + 1}
                          </Label>
                          {newTemplate.sections.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSection(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Input
                          id={`section-title-${index}`}
                          placeholder="Section Title"
                          value={section.title}
                          onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                        />
                        <Textarea
                          placeholder="Default content (optional)"
                          value={section.content}
                          onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
                          className="h-20"
                        />
                        <Textarea
                          placeholder="Placeholder text to guide users"
                          value={section.placeholder}
                          onChange={(e) => handleSectionChange(index, 'placeholder', e.target.value)}
                          className="h-20"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTemplate}>Create Template</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="browse">Browse Templates</TabsTrigger>
              <TabsTrigger value="my-templates">My Templates</TabsTrigger>
              <TabsTrigger value="shared">Shared with Me</TabsTrigger>
            </TabsList>
            
            <TabsContent value="browse" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search templates..."
                          className="pl-8"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={selectedCategory || ""}
                          onValueChange={(value) => setSelectedCategory(value || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Categories</SelectItem>
                            {getCategories().map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Tags</Label>
                        <Select
                          value={selectedTag || ""}
                          onValueChange={(value) => setSelectedTag(value || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All Tags" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Tags</SelectItem>
                            {getTags().map((tag) => (
                              <SelectItem key={tag} value={tag}>
                                {tag}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Sort By</Label>
                        <Select
                          value={sortBy}
                          onValueChange={(value) => setSortBy(value as "name" | "date")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sort By" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">Newest First</SelectItem>
                            <SelectItem value="name">Alphabetical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory(null);
                            setSelectedTag(null);
                            setSortBy("date");
                          }}
                        >
                          Reset Filters
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {isUsingFallback && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Storage Info</AlertTitle>
                      <AlertDescription>
                        Using local storage for templates. Add Supabase credentials in .env for cloud storage.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="md:col-span-3">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Templates</CardTitle>
                      <CardDescription>
                        {filteredTemplates.length} templates found
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {previewMode && selectedTemplate ? (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setPreviewMode(false);
                                setSelectedTemplate(null);
                              }}
                            >
                              Back to Templates
                            </Button>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline"
                                onClick={() => handleCloneTemplate(selectedTemplate)}
                              >
                                Clone Template
                              </Button>
                              <Button onClick={() => handleUseTemplate(selectedTemplate)}>
                                Use Template
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <h2 className="text-2xl font-bold">{selectedTemplate.name}</h2>
                              <p className="text-muted-foreground">{selectedTemplate.description}</p>
                              
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline">{selectedTemplate.category}</Badge>
                                {selectedTemplate.tags?.map((tag) => (
                                  <Badge key={tag} variant="secondary">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-6">
                              <h3 className="text-lg font-semibold">Template Structure</h3>
                              
                              <div className="space-y-4">
                                {selectedTemplate.content?.sections?.map((section, index) => (
                                  <div key={index} className="p-4 border rounded-md">
                                    <h4 className="font-medium mb-2">{section.title}</h4>
                                    {section.content && (
                                      <div className="mb-2 p-2 bg-muted/50 rounded">
                                        <p className="text-sm">{section.content}</p>
                                      </div>
                                    )}
                                    <p className="text-sm text-muted-foreground italic">
                                      {section.placeholder}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {filteredTemplates.length === 0 ? (
                            <div className="text-center py-10">
                              <p className="text-muted-foreground">No templates found</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {filteredTemplates.map((template) => (
                                <Card 
                                  key={template.id} 
                                  className="hover:border-primary cursor-pointer transition-all"
                                  onClick={() => handleSelectTemplate(template)}
                                >
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">{template.name}</CardTitle>
                                    <CardDescription className="line-clamp-2">
                                      {template.description}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="pb-2">
                                    <Badge variant="outline" className="mb-2">
                                      {template.category}
                                    </Badge>
                                    <div className="text-xs text-muted-foreground">
                                      {template.content?.sections?.length || 0} sections
                                    </div>
                                  </CardContent>
                                  <CardFooter className="pt-0 flex justify-between">
                                    <div className="flex flex-wrap gap-1">
                                      {template.tags?.slice(0, 2).map((tag) => (
                                        <Badge key={tag} variant="secondary" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                      {template.tags && template.tags.length > 2 && (
                                        <Badge variant="secondary" className="text-xs">
                                          +{template.tags.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUseTemplate(template);
                                      }}
                                    >
                                      Use
                                    </Button>
                                  </CardFooter>
                                </Card>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="my-templates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Templates</CardTitle>
                  <CardDescription>
                    Templates you've created or cloned
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isUsingFallback ? (
                    <div className="text-center py-10">
                      <h3 className="text-lg font-medium">User Authentication Required</h3>
                      <p className="text-muted-foreground mt-2">
                        To save your personal templates and access them across devices, please configure Supabase in the .env file.
                      </p>
                      <Button className="mt-4" onClick={() => setActiveTab("browse")}>
                        Browse Public Templates
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredTemplates.filter(t => t.created_by === CURRENT_USER_ID).length === 0 ? (
                        <div className="text-center py-10">
                          <h3 className="text-lg font-medium">No Personal Templates Yet</h3>
                          <p className="text-muted-foreground mt-2">
                            Create your first template or clone an existing one to get started.
                          </p>
                          <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Template
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredTemplates
                            .filter(t => t.created_by === CURRENT_USER_ID)
                            .map((template) => (
                              <Card 
                                key={template.id} 
                                className="hover:border-primary cursor-pointer transition-all"
                                onClick={() => handleSelectTemplate(template)}
                              >
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg">{template.name}</CardTitle>
                                  <CardDescription className="line-clamp-2">
                                    {template.description}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-2">
                                  <Badge variant="outline" className="mb-2">
                                    {template.category}
                                  </Badge>
                                  <div className="text-xs text-muted-foreground">
                                    {template.content?.sections?.length || 0} sections
                                  </div>
                                </CardContent>
                                <CardFooter className="pt-0 flex justify-between">
                                  <div className="flex flex-wrap gap-1">
                                    {template.tags?.slice(0, 2).map((tag) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {template.tags && template.tags.length > 2 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{template.tags.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleShareTemplate(template);
                                      }}
                                    >
                                      Share
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTemplate(template);
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </CardFooter>
                              </Card>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="shared" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shared Templates</CardTitle>
                  <CardDescription>
                    Templates shared with you by other users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isUsingFallback ? (
                    <div className="text-center py-10">
                      <h3 className="text-lg font-medium">User Authentication Required</h3>
                      <p className="text-muted-foreground mt-2">
                        To access templates shared with you, please configure Supabase in the .env file.
                      </p>
                      <Button className="mt-4" onClick={() => setActiveTab("browse")}>
                        Browse Public Templates
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {getSharedTemplates().length === 0 ? (
                        <div className="text-center py-10">
                          <h3 className="text-lg font-medium">No Shared Templates</h3>
                          <p className="text-muted-foreground mt-2">
                            No one has shared any templates with you yet.
                          </p>
                          <Button className="mt-4" onClick={() => setActiveTab("browse")}>
                            Browse Public Templates
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {getSharedTemplates().map((template) => (
                            <Card 
                              key={template.id} 
                              className="hover:border-primary cursor-pointer transition-all"
                              onClick={() => handleSelectTemplate(template)}
                            >
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                  {template.description}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="pb-2">
                                <Badge variant="outline" className="mb-2">
                                  {template.category}
                                </Badge>
                                <div className="text-xs text-muted-foreground">
                                  {template.content?.sections?.length || 0} sections
                                </div>
                              </CardContent>
                              <CardFooter className="pt-0 flex justify-between">
                                <div className="flex flex-wrap gap-1">
                                  {template.tags?.slice(0, 2).map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {template.tags && template.tags.length > 2 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{template.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUseTemplate(template);
                                  }}
                                >
                                  Use
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Share Dialog */}
          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Share Template</DialogTitle>
                <DialogDescription>
                  Share "{templateToShare?.name}" with another user or team
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="share-email">Email Address</Label>
                  <Input
                    id="share-email"
                    placeholder="colleague@example.com"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="share-permission">Permission</Label>
                  <Select
                    value={sharePermission}
                    onValueChange={(value) => setSharePermission(value as "view" | "edit")}
                  >
                    <SelectTrigger id="share-permission">
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View only</SelectItem>
                      <SelectItem value="edit">Can edit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleShareSubmit}>Share</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Layout>
  );
};

export default Templates; 