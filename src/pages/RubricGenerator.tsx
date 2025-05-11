import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { mockRubrics } from "@/data/mockFolders";
import { Rubric, RubricCriteria } from "@/types/folders";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, Plus, Save, Download, Trash2, PlusCircle, Wand2, Copy, Pencil } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { cn } from "@/lib/utils";

export default function RubricGenerator() {
  const [rubrics, setRubrics] = useState<Rubric[]>(mockRubrics);
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [isCreatingRubric, setIsCreatingRubric] = useState<boolean>(false);
  const [isAddingCriteria, setIsAddingCriteria] = useState<boolean>(false);
  const [newRubricTitle, setNewRubricTitle] = useState<string>("");
  const [newRubricDescription, setNewRubricDescription] = useState<string>("");
  const [newCriteriaName, setNewCriteriaName] = useState<string>("");
  const [newCriteriaDescription, setNewCriteriaDescription] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [assignmentType, setAssignmentType] = useState<string>("");
  const [assignmentDescription, setAssignmentDescription] = useState<string>("");
  const [gradeLevel, setGradeLevel] = useState<string>("");
  
  // Handle create new rubric
  const handleCreateRubric = () => {
    if (!newRubricTitle) {
      toast.error("Please enter a title for the rubric");
      return;
    }
    
    const newRubric: Rubric = {
      id: uuidv4(),
      title: newRubricTitle,
      description: newRubricDescription || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      criteria: [],
      totalPoints: 0
    };
    
    setRubrics([...rubrics, newRubric]);
    setSelectedRubric(newRubric);
    setIsCreatingRubric(false);
    setNewRubricTitle("");
    setNewRubricDescription("");
    toast.success("Rubric created successfully");
  };
  
  // Handle add new criteria
  const handleAddCriteria = () => {
    if (!selectedRubric) return;
    if (!newCriteriaName) {
      toast.error("Please enter a name for the criteria");
      return;
    }
    
    const newCriteria: RubricCriteria = {
      id: uuidv4(),
      name: newCriteriaName,
      description: newCriteriaDescription,
      levels: [
        { score: 4, description: "Excellent" },
        { score: 3, description: "Good" },
        { score: 2, description: "Satisfactory" },
        { score: 1, description: "Needs Improvement" }
      ]
    };
    
    const updatedRubric = { ...selectedRubric };
    updatedRubric.criteria = [...updatedRubric.criteria, newCriteria];
    updatedRubric.totalPoints = updatedRubric.criteria.reduce((sum, criteria) => sum + Math.max(...criteria.levels.map(level => level.score)), 0);
    
    setSelectedRubric(updatedRubric);
    setRubrics(rubrics.map(rubric => rubric.id === selectedRubric.id ? updatedRubric : rubric));
    setIsAddingCriteria(false);
    setNewCriteriaName("");
    setNewCriteriaDescription("");
    toast.success("Criteria added successfully");
  };
  
  // Handle generate rubric
  const handleGenerateRubric = () => {
    if (!assignmentType || !gradeLevel) {
      toast.error("Please select an assignment type and grade level");
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // In a real app, this would be an API call to generate a rubric
      const newRubric: Rubric = {
        id: uuidv4(),
        title: `${assignmentType} Rubric - ${gradeLevel}`,
        description: assignmentDescription || `Rubric for evaluating ${assignmentType.toLowerCase()} assignments`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        criteria: [
          {
            id: uuidv4(),
            name: "Content",
            description: "Quality and relevance of content",
            levels: [
              { score: 4, description: "Exceptional content that exceeds expectations" },
              { score: 3, description: "Strong content that meets all requirements" },
              { score: 2, description: "Adequate content that meets basic requirements" },
              { score: 1, description: "Limited content that does not meet requirements" }
            ]
          },
          {
            id: uuidv4(),
            name: "Organization",
            description: "Structure and flow of ideas",
            levels: [
              { score: 4, description: "Exceptionally well-organized with clear flow" },
              { score: 3, description: "Well-organized with good flow" },
              { score: 2, description: "Basic organization with some flow issues" },
              { score: 1, description: "Poor organization with significant flow issues" }
            ]
          },
          {
            id: uuidv4(),
            name: "Mechanics",
            description: "Grammar, spelling, and formatting",
            levels: [
              { score: 4, description: "No errors in grammar, spelling, or formatting" },
              { score: 3, description: "Few minor errors in grammar, spelling, or formatting" },
              { score: 2, description: "Several errors in grammar, spelling, or formatting" },
              { score: 1, description: "Numerous errors in grammar, spelling, or formatting" }
            ]
          }
        ],
        totalPoints: 12
      };
      
      setRubrics([...rubrics, newRubric]);
      setSelectedRubric(newRubric);
      setIsGenerating(false);
      toast.success("Rubric generated successfully");
      
      // Reset form
      setAssignmentType("");
      setAssignmentDescription("");
      setGradeLevel("");
    }, 2000);
  };
  
  // Handle delete criteria
  const handleDeleteCriteria = (criteriaId: string) => {
    if (!selectedRubric) return;
    
    const updatedRubric = { ...selectedRubric };
    updatedRubric.criteria = updatedRubric.criteria.filter(criteria => criteria.id !== criteriaId);
    updatedRubric.totalPoints = updatedRubric.criteria.reduce((sum, criteria) => sum + Math.max(...criteria.levels.map(level => level.score)), 0);
    
    setSelectedRubric(updatedRubric);
    setRubrics(rubrics.map(rubric => rubric.id === selectedRubric.id ? updatedRubric : rubric));
    toast.success("Criteria deleted successfully");
  };
  
  // Handle update level description
  const handleUpdateLevelDescription = (criteriaId: string, levelIndex: number, description: string) => {
    if (!selectedRubric) return;
    
    const updatedRubric = { ...selectedRubric };
    const criteriaIndex = updatedRubric.criteria.findIndex(criteria => criteria.id === criteriaId);
    
    if (criteriaIndex === -1) return;
    
    updatedRubric.criteria[criteriaIndex].levels[levelIndex].description = description;
    
    setSelectedRubric(updatedRubric);
    setRubrics(rubrics.map(rubric => rubric.id === selectedRubric.id ? updatedRubric : rubric));
  };
  
  // Handle duplicate rubric
  const handleDuplicateRubric = (rubric: Rubric) => {
    const duplicatedRubric: Rubric = {
      ...rubric,
      id: uuidv4(),
      title: `${rubric.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      criteria: rubric.criteria.map(criteria => ({
        ...criteria,
        id: uuidv4()
      }))
    };
    
    setRubrics([...rubrics, duplicatedRubric]);
    toast.success("Rubric duplicated successfully");
  };
  
  // Handle delete rubric
  const handleDeleteRubric = (rubricId: string) => {
    const updatedRubrics = rubrics.filter(rubric => rubric.id !== rubricId);
    setRubrics(updatedRubrics);
    
    if (selectedRubric && selectedRubric.id === rubricId) {
      setSelectedRubric(updatedRubrics.length > 0 ? updatedRubrics[0] : null);
    }
    
    toast.success("Rubric deleted successfully");
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rubric Generator</h1>
            <p className="text-muted-foreground">Create and manage assessment rubrics</p>
          </div>
        </div>
        
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <Tabs defaultValue="rubrics">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="rubrics">My Rubrics</TabsTrigger>
                <TabsTrigger value="generator">Generate New Rubric</TabsTrigger>
              </TabsList>
              
              {/* My Rubrics Tab */}
              <TabsContent value="rubrics" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">My Rubrics</h2>
                  <Dialog open={isCreatingRubric} onOpenChange={setIsCreatingRubric}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Rubric
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Rubric</DialogTitle>
                        <DialogDescription>
                          Create a new rubric for your assessments.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="rubric-title">Rubric Title</Label>
                          <Input
                            id="rubric-title"
                            placeholder="e.g., Essay Writing Rubric"
                            value={newRubricTitle}
                            onChange={(e) => setNewRubricTitle(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="rubric-description">Description (Optional)</Label>
                          <Textarea
                            id="rubric-description"
                            placeholder="Describe the purpose of this rubric..."
                            value={newRubricDescription}
                            onChange={(e) => setNewRubricDescription(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreatingRubric(false)}>Cancel</Button>
                        <Button onClick={handleCreateRubric}>Create Rubric</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Rubrics List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rubrics.map((rubric) => (
                    <Card
                      key={rubric.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedRubric?.id === rubric.id ? "border-primary" : "border-border"
                      )}
                      onClick={() => setSelectedRubric(rubric)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{rubric.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {rubric.description || "No description"}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateRubric(rubric);
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRubric(rubric.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Criteria: {rubric.criteria.length}</span>
                          <span className="font-medium">Total: {rubric.totalPoints} points</span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(rubric.createdAt).toLocaleDateString()}
                        </p>
                      </CardFooter>
                    </Card>
                  ))}
                  
                  {rubrics.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                      <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="font-medium mb-1">No rubrics yet</h3>
                      <p className="text-sm mb-4">Create a new rubric or generate one</p>
                      <Button onClick={() => setIsCreatingRubric(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Rubric
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Selected Rubric Details */}
                {selectedRubric && (
                  <Card className="glass-card mt-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{selectedRubric.title}</CardTitle>
                          <CardDescription>{selectedRubric.description || "No description"}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Dialog open={isAddingCriteria} onOpenChange={setIsAddingCriteria}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add Criteria
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add New Criteria</DialogTitle>
                                <DialogDescription>
                                  Add a new evaluation criteria to your rubric.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="criteria-name">Criteria Name</Label>
                                  <Input
                                    id="criteria-name"
                                    placeholder="e.g., Content, Organization, Creativity"
                                    value={newCriteriaName}
                                    onChange={(e) => setNewCriteriaName(e.target.value)}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="criteria-description">Description</Label>
                                  <Textarea
                                    id="criteria-description"
                                    placeholder="Describe what this criteria evaluates..."
                                    value={newCriteriaDescription}
                                    onChange={(e) => setNewCriteriaDescription(e.target.value)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddingCriteria(false)}>Cancel</Button>
                                <Button onClick={handleAddCriteria}>Add Criteria</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button variant="outline" size="sm">
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-6">
                          {selectedRubric.criteria.length > 0 ? (
                            selectedRubric.criteria.map((criteria) => (
                              <Card key={criteria.id} className="border border-border">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                  <div>
                                    <CardTitle className="text-base">{criteria.name}</CardTitle>
                                    <CardDescription>{criteria.description}</CardDescription>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => handleDeleteCriteria(criteria.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-[100px]">Score</TableHead>
                                        <TableHead>Description</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {criteria.levels.map((level, index) => (
                                        <TableRow key={index}>
                                          <TableCell className="font-medium">{level.score}</TableCell>
                                          <TableCell>
                                            <Textarea
                                              value={level.description}
                                              className="min-h-[60px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none p-0"
                                              onChange={(e) => handleUpdateLevelDescription(criteria.id, index, e.target.value)}
                                            />
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <div className="py-8 text-center text-muted-foreground">
                              <p>No criteria added yet. Add criteria to complete your rubric.</p>
                              <Button className="mt-4" variant="outline" onClick={() => setIsAddingCriteria(true)}>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add Criteria
                              </Button>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <p className="text-sm text-muted-foreground">
                        Total Points: {selectedRubric.totalPoints}
                      </p>
                    </CardFooter>
                  </Card>
                )}
              </TabsContent>
              
              {/* Generate Rubric Tab */}
              <TabsContent value="generator">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Generate Rubric</CardTitle>
                    <CardDescription>
                      Generate a rubric based on your assignment details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="assignment-type">Assignment Type</Label>
                        <Select value={assignmentType} onValueChange={setAssignmentType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select assignment type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Essay">Essay</SelectItem>
                            <SelectItem value="Presentation">Presentation</SelectItem>
                            <SelectItem value="Project">Project</SelectItem>
                            <SelectItem value="Lab Report">Lab Report</SelectItem>
                            <SelectItem value="Research Paper">Research Paper</SelectItem>
                            <SelectItem value="Creative Writing">Creative Writing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="grade-level">Grade Level</Label>
                        <Select value={gradeLevel} onValueChange={setGradeLevel}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Elementary">Elementary School</SelectItem>
                            <SelectItem value="Middle">Middle School</SelectItem>
                            <SelectItem value="High">High School</SelectItem>
                            <SelectItem value="College">College/University</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="assignment-description">Assignment Description (Optional)</Label>
                      <Textarea
                        id="assignment-description"
                        placeholder="Describe the assignment in detail..."
                        className="min-h-[150px]"
                        value={assignmentDescription}
                        onChange={(e) => setAssignmentDescription(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleGenerateRubric} disabled={isGenerating}>
                        <Wand2 className="h-4 w-4 mr-2" />
                        {isGenerating ? "Generating..." : "Generate Rubric"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
} 