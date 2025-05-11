import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockDifferentiationOptions } from "@/data/mockFolders";
import { DifferentiationOption } from "@/types/folders";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Sparkles, Save, Download, Upload, PlusCircle, Wand2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

export default function DifferentiationHelper() {
  const [originalContent, setOriginalContent] = useState<string>("");
  const [contentTitle, setContentTitle] = useState<string>("");
  const [contentSubject, setContentSubject] = useState<string>("");
  const [contentGradeLevel, setContentGradeLevel] = useState<string>("");
  const [differentiationOptions, setDifferentiationOptions] = useState<DifferentiationOption[]>(mockDifferentiationOptions);
  const [selectedOption, setSelectedOption] = useState<DifferentiationOption | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAddingOption, setIsAddingOption] = useState<boolean>(false);
  const [newOptionName, setNewOptionName] = useState<string>("");
  const [newOptionDescription, setNewOptionDescription] = useState<string>("");
  
  // Handle generate differentiation options
  const handleGenerateDifferentiation = () => {
    if (!originalContent) {
      toast.error("Please enter the original content to differentiate");
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // In a real app, this would be an API call to generate differentiation options
      const newOptions: DifferentiationOption[] = [
        {
          id: uuidv4(),
          name: "Visual Learners",
          description: "Adaptations for students who learn best through visual aids",
          modifications: [
            {
              section: "Introduction",
              original: originalContent.substring(0, 100),
              modified: "Visual adaptation: " + originalContent.substring(0, 100)
            },
            {
              section: "Main Content",
              original: originalContent.substring(100, 200),
              modified: "Visual adaptation: " + originalContent.substring(100, 200)
            }
          ]
        },
        {
          id: uuidv4(),
          name: "Auditory Learners",
          description: "Adaptations for students who learn best through listening",
          modifications: [
            {
              section: "Introduction",
              original: originalContent.substring(0, 100),
              modified: "Auditory adaptation: " + originalContent.substring(0, 100)
            },
            {
              section: "Main Content",
              original: originalContent.substring(100, 200),
              modified: "Auditory adaptation: " + originalContent.substring(100, 200)
            }
          ]
        },
        {
          id: uuidv4(),
          name: "Kinesthetic Learners",
          description: "Adaptations for students who learn best through physical activities",
          modifications: [
            {
              section: "Introduction",
              original: originalContent.substring(0, 100),
              modified: "Kinesthetic adaptation: " + originalContent.substring(0, 100)
            },
            {
              section: "Main Content",
              original: originalContent.substring(100, 200),
              modified: "Kinesthetic adaptation: " + originalContent.substring(100, 200)
            }
          ]
        }
      ];
      
      setDifferentiationOptions([...differentiationOptions, ...newOptions]);
      setIsGenerating(false);
      toast.success("Differentiation options generated successfully");
    }, 2000);
  };
  
  // Handle add new option
  const handleAddOption = () => {
    if (!newOptionName) {
      toast.error("Please enter a name for the new option");
      return;
    }
    
    const newOption: DifferentiationOption = {
      id: uuidv4(),
      name: newOptionName,
      description: newOptionDescription,
      modifications: []
    };
    
    setDifferentiationOptions([...differentiationOptions, newOption]);
    setIsAddingOption(false);
    setNewOptionName("");
    setNewOptionDescription("");
    toast.success("New differentiation option added");
  };
  
  // Handle select option
  const handleSelectOption = (option: DifferentiationOption) => {
    setSelectedOption(option);
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Differentiation Helper</h1>
            <p className="text-muted-foreground">Create differentiated versions of your content for various learner needs</p>
          </div>
        </div>
        
        <div className="grid grid-cols-12 gap-6">
          {/* Content Input */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Original Content</CardTitle>
                <CardDescription>
                  Enter the content you want to differentiate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter content title"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Enter subject"
                      value={contentSubject}
                      onChange={(e) => setContentSubject(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="grade-level">Grade Level</Label>
                    <Select value={contentGradeLevel} onValueChange={setContentGradeLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elementary">Elementary School</SelectItem>
                        <SelectItem value="middle">Middle School</SelectItem>
                        <SelectItem value="high">High School</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter your lesson content here..."
                    className="min-h-[300px]"
                    value={originalContent}
                    onChange={(e) => setOriginalContent(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Content
                  </Button>
                  <Button onClick={handleGenerateDifferentiation} disabled={isGenerating}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    {isGenerating ? "Generating..." : "Generate Differentiation"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Differentiation Options */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="glass-card h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Differentiation Options</CardTitle>
                    <CardDescription>
                      Select a differentiation option to view or edit
                    </CardDescription>
                  </div>
                  <Dialog open={isAddingOption} onOpenChange={setIsAddingOption}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Differentiation Option</DialogTitle>
                        <DialogDescription>
                          Create a new differentiation option for your content.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="option-name">Option Name</Label>
                          <Input
                            id="option-name"
                            placeholder="e.g., ELL Support, Advanced Learners"
                            value={newOptionName}
                            onChange={(e) => setNewOptionName(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="option-description">Description</Label>
                          <Textarea
                            id="option-description"
                            placeholder="Describe this differentiation option..."
                            value={newOptionDescription}
                            onChange={(e) => setNewOptionDescription(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddingOption(false)}>Cancel</Button>
                        <Button onClick={handleAddOption}>Add Option</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-1 gap-4">
                    {differentiationOptions.map((option) => (
                      <Card
                        key={option.id}
                        className={`border cursor-pointer transition-colors ${
                          selectedOption?.id === option.id
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => handleSelectOption(option)}
                      >
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{option.name}</CardTitle>
                            <Badge variant="outline" className="ml-2">
                              {option.modifications.length} modifications
                            </Badge>
                          </div>
                          <CardDescription>{option.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                    {differentiationOptions.length === 0 && (
                      <div className="py-8 text-center text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="font-medium mb-1">No differentiation options yet</h3>
                        <p className="text-sm mb-4">Generate options or add them manually</p>
                        <Button variant="outline" onClick={() => setIsAddingOption(true)}>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* Selected Option Details */}
          {selectedOption && (
            <div className="col-span-12">
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedOption.name}</CardTitle>
                      <CardDescription>{selectedOption.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline">
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {selectedOption.modifications.map((mod, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span>{mod.section}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-muted-foreground">Original</Label>
                              <Card className="bg-muted/30">
                                <CardContent className="p-4">
                                  <p>{mod.original}</p>
                                </CardContent>
                              </Card>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-primary">Modified</Label>
                              <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="p-4">
                                  <Textarea
                                    value={mod.modified}
                                    className="min-h-[100px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none p-0"
                                    onChange={(e) => {
                                      const updatedOption = { ...selectedOption };
                                      updatedOption.modifications[index].modified = e.target.value;
                                      setSelectedOption(updatedOption);
                                    }}
                                  />
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  
                  {selectedOption.modifications.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      <p>No modifications yet. Generate or add them manually.</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    Tip: Click on a modification to edit it
                  </p>
                  <Button>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate More Modifications
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 