import { useState, useEffect, Component, ErrorInfo, ReactNode, useRef, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { LessonGenerator } from "@/components/lessons/LessonGenerator";
import { LessonDisplay } from "@/components/lessons/LessonDisplay";
import { TeacherToolbox } from "@/components/lessons/TeacherToolbox";
import { LessonResult } from "@/types/lessons";
import { ContentCard } from "@/components/dashboard/ContentCard";
import { lessons } from "@/data/mockData";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateTeachingTip } from "@/lib/api";
import { fetchRecommendedModels } from "@/lib/openrouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter, Book, Download, BookmarkCheck, Keyboard, Clock, Save, SortAsc } from "lucide-react";
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
import { Label } from "@/components/ui/label";

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

// Get recent lessons from localStorage or create default (same function as in Dashboard)
const getRecentLessons = (): {id: string, timestamp: number}[] => {
  try {
    const stored = localStorage.getItem('recentLessons');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error reading recent lessons from localStorage:', e);
    return [];
  }
};

// Add a lesson to recent lessons (same function as in Dashboard)
const addRecentLesson = (lessonId: string) => {
  try {
    const recent = getRecentLessons();
    
    // Remove the lesson if it already exists in the list
    const filtered = recent.filter(l => l.id !== lessonId);
    
    // Add the lesson with current timestamp to the beginning
    const updated = [{ id: lessonId, timestamp: Date.now() }, ...filtered];
    
    // Limit to 5 most recent lessons
    const limited = updated.slice(0, 5);
    
    localStorage.setItem('recentLessons', JSON.stringify(limited));
    return limited;
  } catch (e) {
    console.error('Error updating recent lessons in localStorage:', e);
    return [];
  }
};

// Get saved lessons from localStorage
const getSavedLessons = (): LessonResult[] => {
  try {
    const stored = localStorage.getItem('savedLessons');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error reading saved lessons from localStorage:', e);
    return [];
  }
};

export default function Lessons() {
  const navigate = useNavigate();
  const { lessonId } = useParams(); // Get lessonId from URL if available
  const [activeTab, setActiveTab] = useState("create");
  const [generatedLesson, setGeneratedLesson] = useState<LessonResult | null>(null);
  const [savedLessonsList, setSavedLessonsList] = useState<LessonResult[]>([]);
  const [bookmarkedLessons, setBookmarkedLessons] = useState<any[]>([]);
  const [recentLessons, setRecentLessons] = useState<LessonResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [teachingTip, setTeachingTip] = useState("");
  const [isLoadingTip, setIsLoadingTip] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showToolbox, setShowToolbox] = useState(false);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const teachingTipRef = useRef<HTMLDivElement>(null);
  const [sortOptionsOpen, setSortOptionsOpen] = useState(false);
  const [filterOptionsOpen, setFilterOptionsOpen] = useState(false);
  
  // Handle specific lesson viewing if ID is provided in URL
  useEffect(() => {
    if (lessonId) {
      // First check mock data
      let lesson = lessons.find(l => l.id === lessonId);
      
      // If not in mock data, check saved lessons
      if (!lesson) {
        const savedLessons = getSavedLessons();
        lesson = savedLessons.find(l => l.id === lessonId);
      }
      
      // If not in saved lessons, check localStorage for generated lessons
      if (!lesson) {
        try {
          const generatedLessons = JSON.parse(localStorage.getItem("generatedLessons") || "[]");
          lesson = generatedLessons.find((l: LessonResult) => l.id === lessonId);
        } catch (e) {
          console.error("Failed to load generated lessons:", e);
        }
      }
      
      if (lesson) {
        setGeneratedLesson(lesson);
        setActiveTab("create"); // Switch to create tab to show the lesson
        // Add to recent lessons
        addRecentLesson(lessonId);
      } else {
        toast.error("Lesson not found");
        navigate("/lessons");
      }
    }
  }, [lessonId, navigate]);
  
  // Load recent and saved lessons
  useEffect(() => {
    // Load recent lessons
    const recentIds = getRecentLessons();
    if (recentIds.length > 0) {
      // Get lesson details for each ID in the recent list
      const recentDetails = recentIds
        .map(recent => {
          const lesson = lessons.find(l => l.id === recent.id);
          return lesson ? { ...lesson, timestamp: recent.timestamp } : null;
        })
        .filter(Boolean) as (LessonResult & { timestamp: number })[];
      
      setRecentLessons(recentDetails);
    }
    
    // Load saved lessons
    const savedLessons = getSavedLessons();
    setSavedLessonsList(savedLessons);
    
  }, []);
  
  const handleLessonGenerated = (lesson: LessonResult) => {
    setGeneratedLesson(lesson);
    // Save to localStorage for persistence
    try {
      const existingLessons = JSON.parse(localStorage.getItem("generatedLessons") || "[]");
      localStorage.setItem("generatedLessons", JSON.stringify([...existingLessons, lesson]));
      // Also add to recent lessons
      addRecentLesson(lesson.id);
    } catch (e) {
      console.error("Failed to save lesson to localStorage", e);
    }
  };
  
  const handleReset = () => {
    setGeneratedLesson(null);
  };

  const fetchRandomTip = async (showToast = true, selectedModel?: string) => {
    setIsLoadingTip(true);
    try {
      let modelToUse = selectedModel || localStorage.getItem("defaultModel");

      if (!modelToUse) {
        const recommended = await fetchRecommendedModels();
        if (recommended && recommended.length > 0) {
          modelToUse = recommended[0];
          // Also save this newly fetched recommended model as the default for next time
          localStorage.setItem("defaultModel", modelToUse);
        } else {
          modelToUse = "meta-llama/llama-3.1-8b-instruct:free"; 
          console.warn("No default or recommended model found, using fallback for teaching tip:", modelToUse);
        }
      }
      
      const tip = await generateTeachingTip("education", modelToUse);
      setTeachingTip(tip);
      if (showToast) {
        toast.success("Teaching tip refreshed!", {
          position: "bottom-right",
          style: { backgroundColor: "hsl(var(--primary))", color: "white" }
        });
      }
    } catch (error) {
      console.error("Failed to fetch teaching tip:", error);
      setTeachingTip("Teaching tip unavailable at the moment. Please try again later.");
      if (showToast) {
        toast.error("Failed to fetch teaching tip. Please try again.", {
          position: "bottom-right"
        });
      }
    } finally {
      setIsLoadingTip(false);
    }
  };

  const loadBookmarks = () => {
    try {
      const bookmarked = JSON.parse(localStorage.getItem('bookmarkedLessons') || '[]');
      setBookmarkedLessons(bookmarked);
    } catch (e) {
      console.error("Failed to load bookmarks", e);
      setBookmarkedLessons([]);
    }
  };
  
  const loadSavedLessons = () => {
    try {
      const saved = getSavedLessons();
      setSavedLessonsList(saved);
      toast.success("Saved lessons refreshed");
    } catch (e) {
      console.error("Failed to load saved lessons", e);
      toast.error("Failed to load saved lessons");
    }
  };
  
  // Handle lesson selection from saved or recent lessons
  const handleLessonSelect = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    
    // If not found in mock data, check saved lessons
    const savedLesson = savedLessonsList.find(l => l.id === lessonId);
    
    if (lesson || savedLesson) {
      setGeneratedLesson(lesson || savedLesson);
      setActiveTab("create"); // Switch to create tab to show the lesson
      // Add to recent lessons
      addRecentLesson(lessonId);
    }
  };

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
        case '4': // Navigate to Recent tab
          setActiveTab("recent");
          break;
      }
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      // Add keyboard shortcuts listener
      window.addEventListener('keydown', handleKeyDown);
      
      // Load bookmarks from localStorage
      loadBookmarks();
      
      // Fetch teaching tip on initial load
      await fetchRandomTip(false);
    };

    initializePage();
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Apply filters to lessons
  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lesson.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesGrade = gradeFilter === "all" || lesson.gradeLevel.includes(gradeFilter);
    const matchesSubject = subjectFilter === "all" || lesson.subject.toLowerCase() === subjectFilter.toLowerCase();
      
    return matchesSearch && matchesGrade && matchesSubject;
  });
  
  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between mb-4 gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Lessons</h1>
          
          <div className="flex items-center flex-wrap gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setKeyboardShortcutsOpen(true)}
                  >
                    <Keyboard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Keyboard Shortcuts
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOptionsOpen(true)}
                  >
                    <SortAsc className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Sort Options
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setFilterOptionsOpen(true)}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Filter Options
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Input
              placeholder="Search lessons..."
              className="w-[150px] sm:w-[200px] h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-3/4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="overflow-x-auto pb-2 no-scrollbar">
                <TabsList className="w-auto inline-flex min-w-full">
                  <TabsTrigger value="create">Create Lesson</TabsTrigger>
                  <TabsTrigger value="saved">
                    <span className="flex items-center">
                      <Save className="mr-1 h-4 w-4" />
                      Saved
                      {savedLessonsList.length > 0 && 
                        <Badge className="ml-1" variant="secondary">{savedLessonsList.length}</Badge>
                      }
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
                  <TabsTrigger value="recent">
                    <span className="flex items-center">
                      <Clock className="mr-1 h-4 w-4" />
                      Recent
                      {recentLessons.length > 0 && 
                        <Badge className="ml-1" variant="secondary">{recentLessons.length}</Badge>
                      }
                    </span>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="create" className="space-y-4">
                {generatedLesson ? (
                  <ErrorBoundary>
                    <div className="overflow-x-auto">
                      <LessonDisplay lesson={generatedLesson} onReset={handleReset} />
                    </div>
                  </ErrorBoundary>
                ) : (
                  <ErrorBoundary>
                    <LessonGenerator onGenerate={handleLessonGenerated} />
                  </ErrorBoundary>
                )}
              </TabsContent>
              
              <TabsContent value="saved" className="space-y-4">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h2 className="text-lg font-medium">Saved Lessons</h2>
                  <Button variant="outline" size="sm" onClick={loadSavedLessons}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                {savedLessonsList.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Save className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-center text-muted-foreground">
                        No saved lessons yet. Click the save button on a lesson to save it here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedLessonsList.map((lesson) => (
                      <ContentCard
                        key={lesson.id}
                        title={lesson.title}
                        description={lesson.overview}
                        metadata={`Grade ${lesson.gradeLevel} • ${lesson.subject}`}
                        icon={<Save className="h-4 w-4 text-primary" />}
                        timestamp={lesson.savedAt ? new Date(lesson.savedAt).toLocaleDateString() : undefined}
                        tags={lesson.tags.slice(0, 2)}
                        onClick={() => handleLessonSelect(lesson.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="bookmarked" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Bookmarked Lessons</h2>
                  <Button variant="outline" size="sm" onClick={loadBookmarks}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                {bookmarkedLessons.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <BookmarkCheck className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-center text-muted-foreground">
                        No bookmarked lessons yet. Click the bookmark icon on a lesson to save it here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bookmarkedLessons.map((bookmark) => {
                      // Find full lesson details from the bookmark
                      const lessonDetails = lessons.find(l => l.id === bookmark.id);
                      return (
                        <ContentCard
                          key={bookmark.id}
                          title={bookmark.title}
                          description={lessonDetails?.overview || "No overview available"}
                          metadata={`Grade ${bookmark.gradeLevel} • ${bookmark.subject}`}
                          icon={<BookmarkCheck className="h-4 w-4 text-primary" />}
                          timestamp={bookmark.timestamp ? new Date(bookmark.timestamp).toLocaleDateString() : undefined}
                          onClick={() => handleLessonSelect(bookmark.id)}
                        />
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="recent" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Recently Viewed Lessons</h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const recentIds = getRecentLessons();
                      if (recentIds.length > 0) {
                        const recentDetails = recentIds
                          .map(recent => {
                            const lesson = lessons.find(l => l.id === recent.id);
                            return lesson ? { ...lesson, timestamp: recent.timestamp } : null;
                          })
                          .filter(Boolean) as (LessonResult & { timestamp: number })[];
                        
                        setRecentLessons(recentDetails);
                      }
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                {recentLessons.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-center text-muted-foreground">
                        No recently viewed lessons. View a lesson to have it appear here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentLessons.map((lesson) => (
                      <ContentCard
                        key={lesson.id}
                        title={lesson.title}
                        description={lesson.overview}
                        metadata={`Grade ${lesson.gradeLevel} • ${lesson.subject}`}
                        icon={<Clock className="h-4 w-4" />}
                        timestamp={lesson.timestamp ? new Date(lesson.timestamp).toLocaleDateString() : undefined}
                        tags={lesson.tags.slice(0, 2)}
                        onClick={() => handleLessonSelect(lesson.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="w-full md:w-1/4">
            <div className="sticky top-24">
              {/* Render the toolbox component if enabled */}
              {showToolbox && (
                <div className="mb-6">
                  <TeacherToolbox />
                </div>
              )}
              
              {/* Teaching tip card */}
              <div ref={teachingTipRef}>
                {isLoadingTip ? (
                  <TeachingTipSkeleton />
                ) : (
                  <Alert className="bg-primary/5 border border-primary/20 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <AlertDescription className="text-sm">
                          {teachingTip || "No teaching tip available. Try refreshing."}
                        </AlertDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-2"
                        onClick={() => fetchRandomTip()}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </Alert>
                )}
              </div>
              
              {/* Teacher tools toggle */}
              <Button
                variant={showToolbox ? "default" : "outline"}
                className="w-full mb-4"
                onClick={() => setShowToolbox(!showToolbox)}
              >
                {showToolbox ? "Hide Teacher Tools" : "Show Teacher Tools"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Keyboard shortcuts dialog */}
      <Dialog open={keyboardShortcutsOpen} onOpenChange={setKeyboardShortcutsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Use these keyboard shortcuts to quickly navigate and use the application.
            </DialogDescription>
          </DialogHeader>
          <KeyboardShortcutsDialog />
        </DialogContent>
      </Dialog>

      <Dialog open={sortOptionsOpen} onOpenChange={setSortOptionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sort Options</DialogTitle>
            <DialogDescription>
              Choose how to sort your lessons
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  // Sort implementation goes here
                  setSortOptionsOpen(false);
                }}
              >
                Newest First
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  // Sort implementation goes here
                  setSortOptionsOpen(false);
                }}
              >
                Oldest First
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  // Sort implementation goes here
                  setSortOptionsOpen(false);
                }}
              >
                Alphabetical (A-Z)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={filterOptionsOpen} onOpenChange={setFilterOptionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Options</DialogTitle>
            <DialogDescription>
              Filter your lessons by subject, grade level, or other criteria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="math">Mathematics</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grade Level</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="k-2">K-2</SelectItem>
                  <SelectItem value="3-5">3-5</SelectItem>
                  <SelectItem value="6-8">6-8</SelectItem>
                  <SelectItem value="9-12">9-12</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setFilterOptionsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setFilterOptionsOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
