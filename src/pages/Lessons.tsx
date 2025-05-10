import { useState, useEffect, Component, ErrorInfo, ReactNode, useRef } from "react";
import { Layout } from "@/components/Layout";
import { LessonGenerator } from "@/components/lessons/LessonGenerator";
import { LessonDisplay } from "@/components/lessons/LessonDisplay";
import { TeacherToolbox } from "@/components/lessons/TeacherToolbox";
import { LessonResult } from "@/types/lessons";
import { ContentCard } from "@/components/dashboard/ContentCard";
import { lessons } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateTeachingTip } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter, Book, Download, BookmarkCheck, Keyboard, KeyboardShortcuts } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Error boundary component to catch rendering errors
class ErrorBoundary extends Component<
  { children: ReactNode, fallback?: ReactNode },
  { hasError: boolean, error: Error | null }
> {
  constructor(props: { children: ReactNode, fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
          <div className="text-sm">
            {this.state.error?.message || "An unknown error occurred"}
          </div>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Teaching tip loading skeleton
const TeachingTipSkeleton = () => (
  <Card className="bg-primary/5 border border-primary/20 mb-6">
    <CardContent className="flex items-center justify-between p-3 sm:p-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-6 w-6 ml-2 sm:ml-4 rounded-full" />
    </CardContent>
  </Card>
);

// Keyboard shortcuts dialog content
const KeyboardShortcutsDialog = () => (
  <ScrollArea className="h-[300px] rounded-md">
    <div className="p-2">
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">General</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between border rounded px-3 py-1.5">
            <span>Toggle Dark Mode</span>
            <Badge variant="outline" className="ml-2">Alt + D</Badge>
          </div>
          <div className="flex items-center justify-between border rounded px-3 py-1.5">
            <span>Toggle Teacher Tools</span>
            <Badge variant="outline" className="ml-2">Alt + T</Badge>
          </div>
          <div className="flex items-center justify-between border rounded px-3 py-1.5">
            <span>Refresh Teaching Tip</span>
            <Badge variant="outline" className="ml-2">Alt + R</Badge>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Lesson Creation</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between border rounded px-3 py-1.5">
            <span>Generate Lesson</span>
            <Badge variant="outline" className="ml-2">Alt + G</Badge>
          </div>
          <div className="flex items-center justify-between border rounded px-3 py-1.5">
            <span>Focus Model Selector</span>
            <Badge variant="outline" className="ml-2">Alt + M</Badge>
          </div>
          <div className="flex items-center justify-between border rounded px-3 py-1.5">
            <span>Reset Form</span>
            <Badge variant="outline" className="ml-2">Alt + C</Badge>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-2">Navigation</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between border rounded px-3 py-1.5">
            <span>Create New Tab</span>
            <Badge variant="outline" className="ml-2">Alt + 1</Badge>
          </div>
          <div className="flex items-center justify-between border rounded px-3 py-1.5">
            <span>Saved Lessons Tab</span>
            <Badge variant="outline" className="ml-2">Alt + 2</Badge>
          </div>
          <div className="flex items-center justify-between border rounded px-3 py-1.5">
            <span>Bookmarked Tab</span>
            <Badge variant="outline" className="ml-2">Alt + 3</Badge>
          </div>
        </div>
      </div>
    </div>
  </ScrollArea>
);

export default function Lessons() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("create");
  const [generatedLesson, setGeneratedLesson] = useState<LessonResult | null>(null);
  const [savedLessons, setSavedLessons] = useState(lessons);
  const [bookmarkedLessons, setBookmarkedLessons] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [teachingTip, setTeachingTip] = useState("");
  const [isLoadingTip, setIsLoadingTip] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showToolbox, setShowToolbox] = useState(false);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const teachingTipRef = useRef<HTMLDivElement>(null);
  
  const handleLessonGenerated = (lesson: LessonResult) => {
    setGeneratedLesson(lesson);
    // Save to localStorage for persistence
    try {
      const existingLessons = JSON.parse(localStorage.getItem("generatedLessons") || "[]");
      localStorage.setItem("generatedLessons", JSON.stringify([...existingLessons, lesson]));
    } catch (e) {
      console.error("Failed to save lesson to localStorage", e);
    }
  };
  
  const handleReset = () => {
    setGeneratedLesson(null);
  };

  const fetchRandomTip = async (showToast = true) => {
    setIsLoadingTip(true);
    try {
      // Use a recommended model - try Llama 4 Scout for education content
      const tip = await generateTeachingTip("education", "meta-llama/llama-4-scout:free");
      setTeachingTip(tip);
      if (showToast) {
        toast.success("Teaching tip refreshed");
      }
    } catch (error) {
      console.error("Failed to fetch teaching tip:", error);
      
      // Handle error with informative message
      if (showToast) {
        toast.error("Unable to load teaching tip. The AI model may be temporarily unavailable.", {
          duration: 4000,
          action: {
            label: "Try Again",
            onClick: () => fetchRandomTip()
          }
        });
      }
      
      // Keep previous tip if available, only clear if this is initial load
      if (!teachingTip) {
        setTeachingTip("");
      }
    } finally {
      setIsLoadingTip(false);
    }
  };

  // Load bookmarked lessons
  const loadBookmarks = () => {
    try {
      const bookmarked = JSON.parse(localStorage.getItem('bookmarkedLessons') || '[]');
      setBookmarkedLessons(bookmarked);
      toast.success("Bookmarks refreshed");
    } catch (e) {
      console.error("Failed to load bookmarks", e);
      toast.error("Failed to load bookmarks");
    }
  };

  // Keyboard shortcut handler
  const handleKeyDown = (e: KeyboardEvent) => {
    // General shortcuts
    if (e.altKey) {
      switch (e.key) {
        case 'd': // Toggle dark mode
          const darkModeButton = document.querySelector('[aria-label="Toggle theme"]');
          if (darkModeButton) {
            (darkModeButton as HTMLButtonElement).click();
          }
          break;
        case 't': // Toggle teacher tools
          setShowToolbox(!showToolbox);
          break;
        case 'r': // Refresh teaching tip
          if (teachingTipRef.current) {
            fetchRandomTip();
          }
          break;
        case '1': // Navigate to Create New tab
          setActiveTab("create");
          break;
        case '2': // Navigate to Saved Lessons tab
          setActiveTab("saved");
          break;
        case '3': // Navigate to Bookmarked tab
          setActiveTab("bookmarked");
          break;
      }
    }
  };

  // Fetch teaching tip on component mount
  useEffect(() => {
    fetchRandomTip(false);
    loadBookmarks();
    
    // Check for previously generated lesson in localStorage
    try {
      const savedLessons = JSON.parse(localStorage.getItem("generatedLessons") || "[]");
      if (savedLessons.length > 0) {
        // Optional: restore most recent lesson
        // setGeneratedLesson(savedLessons[savedLessons.length - 1]);
      }
    } catch (e) {
      console.error("Failed to load lessons from localStorage", e);
    }

    // Add keyboard shortcut event listener
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showToolbox]);
  
  // Filter lessons based on search query and grade filter
  const filteredLessons = savedLessons.filter((lesson) => {
    const matchesSearch = 
      searchQuery === "" || 
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesGrade = 
      gradeFilter === "all" || 
      lesson.gradeLevel === gradeFilter;
      
    const matchesSubject =
      subjectFilter === "all" ||
      lesson.subject.toLowerCase().includes(subjectFilter.toLowerCase());
      
    return matchesSearch && matchesGrade && matchesSubject;
  });
  
  return (
    <TooltipProvider>
    <Layout>
      <div className="w-full h-full min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Lessons</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Create and manage AI-generated lesson plans
              </p>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
                <Dialog open={keyboardShortcutsOpen} onOpenChange={setKeyboardShortcutsOpen}>
                  <DialogTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <Keyboard className="h-4 w-4" />
                          <span className="sr-only">Keyboard shortcuts</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Keyboard shortcuts</TooltipContent>
                    </Tooltip>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Keyboard Shortcuts</DialogTitle>
                      <DialogDescription>
                        Quickly navigate and control EdGenie using these keyboard shortcuts.
                      </DialogDescription>
                    </DialogHeader>
                    <KeyboardShortcutsDialog />
                  </DialogContent>
                </Dialog>
                
                <Tooltip>
                  <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowToolbox(!showToolbox)}
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                {showToolbox ? "Hide Toolbox" : "Teacher Tools"}
              </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Alt + T</p>
                  </TooltipContent>
                </Tooltip>
                
              <DarkModeToggle />
            </div>
          </div>

            <div ref={teachingTipRef}>
              {isLoadingTip ? (
                <TeachingTipSkeleton />
              ) : teachingTip ? (
            <Card className="bg-primary/5 border border-primary/20 hover:shadow-md transition-shadow duration-200 mb-6">
              <CardContent className="flex items-center justify-between p-3 sm:p-4">
                <p className="text-xs sm:text-sm italic flex-1">{teachingTip}</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 sm:ml-4 flex-shrink-0" 
                          onClick={() => fetchRandomTip()} 
                  disabled={isLoadingTip}
                          aria-label="Refresh teaching tip"
                >
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isLoadingTip ? 'animate-spin' : ''}`} />
                </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>New teaching tip (Alt+R)</p>
                      </TooltipContent>
                    </Tooltip>
              </CardContent>
            </Card>
              ) : null}
            </div>

          <div className={`grid ${showToolbox ? 'lg:grid-cols-4' : 'grid-cols-1'} gap-6`}>
            <div className={`${showToolbox ? 'lg:col-span-3' : 'w-full'} space-y-6`}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full">
                <div className="overflow-x-auto">
                  <TabsList className="mb-2 w-full sm:w-auto flex justify-start">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TabsTrigger value="create" className="flex-1 sm:flex-initial text-xs sm:text-sm">
                            Create New
                          </TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Alt+1</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TabsTrigger value="saved" className="flex-1 sm:flex-initial text-xs sm:text-sm">
                            Saved Lessons
                          </TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Alt+2</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TabsTrigger value="bookmarked" className="flex-1 sm:flex-initial text-xs sm:text-sm">
                            Bookmarked
                          </TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Alt+3</TooltipContent>
                      </Tooltip>
                  </TabsList>
                </div>
                
                  <TabsContent value="create" className="mt-4 w-full focus-visible:outline-none focus-visible:ring-0">
                  <ErrorBoundary>
                    {generatedLesson ? (
                      <LessonDisplay lesson={generatedLesson} onReset={handleReset} />
                    ) : (
                      <LessonGenerator onLessonGenerated={handleLessonGenerated} />
                    )}
                  </ErrorBoundary>
                </TabsContent>
                
                  <TabsContent value="saved" className="space-y-6 mt-4 focus-visible:outline-none focus-visible:ring-0">
                  <ErrorBoundary>
                    <Card className="overflow-hidden">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="relative w-full sm:max-w-xs">
                          <Input 
                            placeholder="Search lessons..." 
                                className="w-full text-sm pr-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                              {searchQuery && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                                  onClick={() => setSearchQuery("")}
                                  aria-label="Clear search"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </Button>
                              )}
                            </div>
                          <div className="flex gap-3 w-full sm:w-auto">
                              <Tooltip>
                                <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              onClick={() => setShowFilters(!showFilters)}
                              className="flex items-center gap-2 text-xs sm:text-sm flex-1 sm:flex-initial"
                              size="sm"
                            >
                              <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>Filters</span>
                            </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  <p>{showFilters ? 'Hide' : 'Show'} grade and subject filters</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                            <Button 
                              variant="outline"
                              size="sm"
                              className="text-xs sm:text-sm flex-1 sm:flex-initial"
                              onClick={() => {
                                setSearchQuery("");
                                setGradeFilter("all");
                                setSubjectFilter("all");
                              }}
                            >
                              Clear
                            </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  <p>Reset all search filters</p>
                                </TooltipContent>
                              </Tooltip>
                          </div>
                        </div>
                        
                        {showFilters && (
                            <div className="flex flex-col sm:flex-row gap-4 mt-6 animate-in fade-in-50 duration-300">
                            <Select 
                              value={gradeFilter} 
                              onValueChange={setGradeFilter}
                            >
                              <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                                <SelectValue placeholder="Filter by grade level" />
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
                            
                            <Select 
                              value={subjectFilter} 
                              onValueChange={setSubjectFilter}
                            >
                              <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                                <SelectValue placeholder="Filter by subject" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Subjects</SelectItem>
                                <SelectItem value="math">Mathematics</SelectItem>
                                <SelectItem value="science">Science</SelectItem>
                                <SelectItem value="english">English/Language Arts</SelectItem>
                                <SelectItem value="history">History/Social Studies</SelectItem>
                                <SelectItem value="art">Art</SelectItem>
                                <SelectItem value="music">Music</SelectItem>
                                <SelectItem value="pe">Physical Education</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {filteredLessons.length === 0 ? (
                      <div className="text-center py-12 bg-background rounded-lg shadow-sm border">
                        <p className="text-muted-foreground text-sm">No lessons match your search criteria.</p>
                        <Button 
                          variant="link" 
                          onClick={() => {
                            setSearchQuery("");
                            setGradeFilter("all");
                            setSubjectFilter("all");
                          }}
                          className="text-xs sm:text-sm mt-2"
                        >
                          Clear filters
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredLessons.map((lesson) => (
                          <ContentCard
                            key={lesson.id}
                            title={lesson.title}
                            description={`Grade ${lesson.gradeLevel} • ${lesson.duration}`}
                            tags={lesson.tags}
                            onClick={() => navigate(`/lessons/${lesson.id}`)}
                            className="hover:shadow-md transition-shadow duration-200"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                                <Book className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span>{lesson.subject}</span>
                              </div>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 sm:h-7 sm:w-7"
                                      aria-label="Download lesson"
                                    >
                                <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="left">Download lesson</TooltipContent>
                                </Tooltip>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">
                              {lesson.overview}
                            </p>
                          </ContentCard>
                        ))}
                      </div>
                    )}
                  </ErrorBoundary>
                </TabsContent>
                
                  <TabsContent value="bookmarked" className="space-y-6 mt-4 focus-visible:outline-none focus-visible:ring-0">
                  <ErrorBoundary>
                    {bookmarkedLessons.length === 0 ? (
                      <div className="text-center py-12 bg-background rounded-lg shadow-sm border">
                        <p className="text-muted-foreground text-sm">No bookmarked lessons yet.</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                          Click the bookmark icon on any lesson to save it here for quick access.
                        </p>
                        <Button 
                          variant="link" 
                          onClick={() => setActiveTab("saved")}
                          className="mt-4 text-xs sm:text-sm"
                        >
                          Browse lessons
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {bookmarkedLessons.map((bookmark) => (
                          <Card key={bookmark.id} className="hover:shadow-md transition-shadow duration-200">
                            <CardContent className="p-4 sm:p-5">
                              <div className="flex justify-between items-start">
                                <h3 className="font-medium text-sm sm:text-base">{bookmark.title}</h3>
                                <BookmarkCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 ml-2" />
                              </div>
                              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mt-2">
                                <Book className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span>{bookmark.subject} • Grade {bookmark.gradeLevel}</span>
                              </div>
                              <div className="flex justify-end mt-4 sm:mt-5">
                                <Button 
                                  size="sm" 
                                  className="text-xs sm:text-sm"
                                  onClick={() => {
                                    // In a real app, this would load the lesson
                                    toast.info("This would load the lesson");
                                  }}
                                >
                                  View Lesson
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end">
                        <Tooltip>
                          <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs sm:text-sm" 
                        onClick={loadBookmarks}
                      >
                        Refresh Bookmarks
                      </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>Update the bookmarks list</p>
                          </TooltipContent>
                        </Tooltip>
                    </div>
                  </ErrorBoundary>
                </TabsContent>
              </Tabs>
            </div>
            
            {showToolbox && (
                <div className="lg:col-span-1 animate-in slide-in-from-right-8 duration-300">
                <ErrorBoundary>
                  <TeacherToolbox />
                </ErrorBoundary>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
    </TooltipProvider>
  );
}
