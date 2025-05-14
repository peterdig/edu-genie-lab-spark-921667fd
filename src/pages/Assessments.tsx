import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { AssessmentGenerator } from "@/components/assessments/AssessmentGenerator";
import { AssessmentDisplay } from "@/components/assessments/AssessmentDisplay";
import { AssessmentResult } from "@/types/assessments";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  X, 
  FileText, 
  Filter as FilterIcon, 
  ChevronDown, 
  ChevronUp, 
  ChevronsLeft, 
  ChevronsRight, 
  ChevronLeft,
  ChevronRight,
  Loader, 
  SortAsc, 
  RefreshCcw,
  Download,
  Clock,
  BookOpen
} from "lucide-react";
import { assessments } from "@/data/mockData";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ReactNode } from "react";

// Number of items per page
const ITEMS_PER_PAGE = 6;

// Feature card components for consistent styling
interface FeatureCardProps {
  children: ReactNode;
  className?: string;
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
  <Card className={cn('group relative rounded-xl shadow-md transition-all hover:shadow-lg', className)}>
    <CardDecorator />
    {children}
  </Card>
);

const CardDecorator = () => (
  <>
    <span className="border-primary absolute -left-px -top-px block size-2 border-l-2 border-t-2 rounded-tl"></span>
    <span className="border-primary absolute -right-px -top-px block size-2 border-r-2 border-t-2 rounded-tr"></span>
    <span className="border-primary absolute -bottom-px -left-px block size-2 border-b-2 border-l-2 rounded-bl"></span>
    <span className="border-primary absolute -bottom-px -right-px block size-2 border-b-2 border-r-2 rounded-br"></span>
  </>
);

export default function Assessments() {
  const navigate = useNavigate();
  const { id: assessmentId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState(assessmentId ? "view" : "create");
  const [generatedAssessment, setGeneratedAssessment] = useState<AssessmentResult | null>(null);
  
  // State for saved assessments with caching
  const [savedAssessments, setSavedAssessments] = useState<AssessmentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentResult | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [questionTypeFilter, setQuestionTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting state
  const [sortField, setSortField] = useState<"date" | "questions" | "title">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  // Load assessments with caching
  useEffect(() => {
    const loadAssessments = async () => {
      setIsLoading(true);
      
      try {
        // Try to load from local storage first
        const cachedData = localStorage.getItem('savedAssessments');
        
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setSavedAssessments(parsedData);
          
          // If we have an assessmentId from the URL, find that assessment
          if (assessmentId) {
            const found = parsedData.find((a: AssessmentResult) => a.id === assessmentId);
            if (found) {
              setSelectedAssessment(found);
              setActiveTab("view");
            } else {
              // Assessment not found, redirect to main assessments page
              navigate('/assessments');
              toast.error("Assessment not found");
            }
          }
          
          setIsLoading(false);
          return;
        }
        
        // If no cache, use mock data (in real app, this would be an API call)
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Add timestamps for sorting by date
        const assessmentsWithDate = assessments.map(assessment => ({
          ...assessment,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
        }));
        
        setSavedAssessments(assessmentsWithDate);
        
        // If we have an assessmentId, find that assessment
        if (assessmentId) {
          const found = assessmentsWithDate.find((a: AssessmentResult) => a.id === assessmentId);
          if (found) {
            setSelectedAssessment(found);
            setActiveTab("view");
          } else {
            // Assessment not found, redirect to main assessments page
            navigate('/assessments');
            toast.error("Assessment not found");
          }
        }
        
        // Cache the result
        localStorage.setItem('savedAssessments', JSON.stringify(assessmentsWithDate));
      } catch (error) {
        console.error("Failed to load assessments:", error);
        toast.error("Failed to load assessments. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAssessments();
  }, [assessmentId, navigate]);
  
  // Handle assessment generation
  const handleAssessmentGenerated = (assessment: AssessmentResult) => {
    setGeneratedAssessment(assessment);
    
    // Cache the generated assessment
    try {
      const newAssessment = {
        ...assessment,
        createdAt: new Date().toISOString()
      };
      
      const updated = [newAssessment, ...savedAssessments];
      setSavedAssessments(updated);
      
      // Update the cache
      localStorage.setItem('savedAssessments', JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to cache assessment:", error);
    }
  };
  
  // Handle reset
  const handleReset = () => {
    setGeneratedAssessment(null);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setGradeFilter("all");
    setSubjectFilter("all");
    setQuestionTypeFilter("all");
  };
  
  // Refresh the assessment list
  const refreshAssessments = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      // In a real app, this would refetch from API
      setSavedAssessments([...savedAssessments]);
      setIsLoading(false);
      toast.success("Assessment list refreshed");
    }, 500);
  };
  
  // Toggle sort direction or change sort field
  const handleSort = (field: "date" | "questions" | "title") => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };
  
  // Filter and sort assessments
  const filteredAssessments = useMemo(() => {
    // First, filter the assessments
    let result = savedAssessments.filter(assessment => {
      const matchesSearch = 
        searchQuery === "" || 
        assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assessment.tags && assessment.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
        
      const matchesGrade = 
        gradeFilter === "all" || 
        assessment.gradeLevel === gradeFilter;
        
      const matchesSubject =
        subjectFilter === "all" ||
        assessment.subject.toLowerCase().includes(subjectFilter.toLowerCase());
      
      // In a real app, we'd have question types to filter by
      const matchesQuestionType = questionTypeFilter === "all"; // Placeholder
        
      return matchesSearch && matchesGrade && matchesSubject && matchesQuestionType;
    });
    
    // Then, sort the filtered results
    result.sort((a, b) => {
      if (sortField === "date") {
        return sortDirection === "desc" 
          ? new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
          : new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime();
      } else if (sortField === "questions") {
        return sortDirection === "desc" 
          ? b.questions.length - a.questions.length
          : a.questions.length - b.questions.length;
      } else { // title
        return sortDirection === "desc" 
          ? b.title.localeCompare(a.title)
          : a.title.localeCompare(b.title);
      }
    });
    
    return result;
  }, [savedAssessments, searchQuery, gradeFilter, subjectFilter, questionTypeFilter, sortField, sortDirection]);
  
  // Paginate assessments
  const paginatedAssessments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAssessments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAssessments, currentPage]);
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(filteredAssessments.length / ITEMS_PER_PAGE));
  
  // Handle page changes
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Get percentage of each question type (for visualization)
  const getQuestionTypePercentage = (assessment: AssessmentResult, type: string) => {
    // This is a placeholder. In a real app, each question would have a type property
    // For now, return random percentages for demonstration
    const types = {
      "multiple-choice": Math.floor(Math.random() * 60) + 20,
      "short-answer": Math.floor(Math.random() * 40),
      "essay": Math.floor(Math.random() * 30)
    };
    
    return types[type as keyof typeof types] || 0;
  };
  
  return (
    <Layout>
      <div className="space-y-6 px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Assessments</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Create and manage AI-generated assessments and quizzes
          </p>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => {
            setActiveTab(value);
            // Clear selected assessment if switching to a different tab
            if (value !== "view" && selectedAssessment) {
              setSelectedAssessment(null);
              // Update URL if switching from view mode
              if (assessmentId) {
                navigate('/assessments');
              }
            }
          }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center overflow-x-auto">
            <TabsList className="mb-2">
              <TabsTrigger value="create" className="data-[state=active]:bg-primary/10 text-sm sm:text-base">
                Create New
                <kbd className="ml-2 bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded hidden sm:inline-block">Alt+1</kbd>
              </TabsTrigger>
              <TabsTrigger value="saved" className="data-[state=active]:bg-primary/10 text-sm sm:text-base">
                Saved Assessments
                <kbd className="ml-2 bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded hidden sm:inline-block">Alt+2</kbd>
              </TabsTrigger>
              {/* Add the hidden tab for viewing individual assessments inside the TabsList */}
              {selectedAssessment && (
                <TabsTrigger value="view" className="hidden">View Assessment</TabsTrigger>
              )}
            </TabsList>
          </div>
          
          <TabsContent value="create" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
            {generatedAssessment ? (
              <AssessmentDisplay assessment={generatedAssessment} onReset={handleReset} />
            ) : (
              <AssessmentGenerator onAssessmentGenerated={handleAssessmentGenerated} />
            )}
          </TabsContent>
          
          {/* View individual assessment tab */}
          <TabsContent value="view" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
            {selectedAssessment ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mr-4"
                    onClick={() => {
                      setSelectedAssessment(null);
                      setActiveTab("saved");
                      navigate('/assessments');
                    }}
                  >
                    ← Back to Assessments
                  </Button>
                </div>
                <AssessmentDisplay 
                  assessment={selectedAssessment} 
                  onReset={() => {
                    setSelectedAssessment(null);
                    setActiveTab("saved");
                    navigate('/assessments');
                  }} 
                />
              </div>
            ) : (
              <div className="flex items-center justify-center p-8">
                <p>No assessment selected. Please select an assessment from the saved list.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="saved" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <FeatureCard>
              <CardHeader className="pb-0">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search assessments..." 
                      className="pl-8 pr-8 w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="h-3.5 w-3.5" />
                        <span className="sr-only">Clear search</span>
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <FilterIcon className="h-3.5 w-3.5" />
                      <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <SortAsc className="h-3.5 w-3.5" />
                          <span>Sort</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className={cn("flex justify-between", sortField === "date" && "text-primary font-medium")}
                          onClick={() => handleSort("date")}
                        >
                          <span>Date</span>
                          {sortField === "date" && (sortDirection === "desc" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />)}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className={cn("flex justify-between", sortField === "title" && "text-primary font-medium")}
                          onClick={() => handleSort("title")}
                        >
                          <span>Title</span>
                          {sortField === "title" && (sortDirection === "desc" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />)}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className={cn("flex justify-between", sortField === "questions" && "text-primary font-medium")}
                          onClick={() => handleSort("questions")}
                        >
                          <span>Questions</span>
                          {sortField === "questions" && (sortDirection === "desc" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />)}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={refreshAssessments}
                      className="h-8 w-8"
                      disabled={isLoading}
                    >
                      <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                      <span className="sr-only">Refresh</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {showFilters && (
                <CardContent className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in-50 duration-300">
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Grade Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      <SelectItem value="k-2">K-2</SelectItem>
                      <SelectItem value="3-5">3-5</SelectItem>
                      <SelectItem value="6-8">6-8</SelectItem>
                      <SelectItem value="9-12">9-12</SelectItem>
                      <SelectItem value="college">College</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      <SelectItem value="math">Mathematics</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="history">History</SelectItem>
                      <SelectItem value="art">Arts</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={questionTypeFilter} onValueChange={setQuestionTypeFilter}>
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Question Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      <SelectItem value="short-answer">Short Answer</SelectItem>
                      <SelectItem value="essay">Essay/Long Form</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {(gradeFilter !== "all" || subjectFilter !== "all" || questionTypeFilter !== "all" || searchQuery) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearFilters}
                      className="text-xs sm:col-span-3"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </CardContent>
              )}
            </FeatureCard>
            
            {isLoading ? (
              // Loading skeleton
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <FeatureCard key={index} className="h-[230px] animate-pulse">
                    <CardContent className="p-4 h-full flex flex-col">
                      <div className="h-5 bg-muted rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                      <div className="h-16 bg-muted rounded w-full mb-4 mt-auto"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </FeatureCard>
                ))}
              </div>
            ) : paginatedAssessments.length === 0 ? (
              // Empty state
              <div className="text-center py-12 border rounded-lg bg-background">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No assessments found</h3>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                  {filteredAssessments.length === 0 ? 
                    "You haven't created any assessments yet. Try creating a new one!" : 
                    "No assessments match your current filters. Try adjusting your search criteria."}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => filteredAssessments.length === 0 ? setActiveTab("create") : clearFilters()}
                >
                  {filteredAssessments.length === 0 ? "Create Assessment" : "Clear Filters"}
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedAssessments.map((assessment) => (
                    <FeatureCard 
                      key={assessment.id} 
                      className="hover:border-primary/30 transition-colors cursor-pointer overflow-hidden"
                    >
                      <CardContent className="p-3 sm:p-4" onClick={() => navigate(`/assessments/${assessment.id}`)}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-sm sm:text-base line-clamp-1">{assessment.title}</h3>
                          <Badge variant="outline" className="bg-primary/5 text-primary text-xs shrink-0 ml-2">
                            {assessment.questions.length} Q
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1 mb-3 text-xs text-muted-foreground">
                          <BookOpen className="h-3 w-3 shrink-0" />
                          <span className="line-clamp-1">Grade {assessment.gradeLevel} • {assessment.subject}</span>
                        </div>
                        
                        {/* Question type visualization */}
                        <div className="mb-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Multiple Choice</span>
                            <span className="font-medium">{getQuestionTypePercentage(assessment, "multiple-choice")}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="bg-primary h-full" 
                              style={{ width: `${getQuestionTypePercentage(assessment, "multiple-choice")}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 pt-2 border-t text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>{formatDate(assessment.createdAt)}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </FeatureCard>
                  ))}
                </div>
                
                {/* Pagination controls - improved for mobile */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 gap-2">
                    <p className="text-xs text-muted-foreground text-center sm:text-left">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredAssessments.length)} of {filteredAssessments.length} assessments
                    </p>
                    
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <span className="text-xs px-2">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
