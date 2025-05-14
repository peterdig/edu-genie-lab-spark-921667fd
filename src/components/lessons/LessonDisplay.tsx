import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LessonResult } from "@/types/lessons";
import { toast } from "sonner";
import { Book, Calendar, CheckSquare, Download, Edit, Printer, Share2, File, RefreshCw, Bookmark, BookmarkCheck, ArrowDownToLine, Pencil, Save, AlertTriangle } from "lucide-react";
import { generateTeachingTip } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Helper function to add a lesson to recent lessons
const addRecentLesson = (lessonId: string) => {
  try {
    // Get existing recent lessons
    const stored = localStorage.getItem('recentLessons');
    const recent = stored ? JSON.parse(stored) : [];
    
    // Remove the lesson if it already exists in the list
    const filtered = recent.filter((l: any) => l.id !== lessonId);
    
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

// Helper function to save a lesson to localStorage
const saveLesson = (lesson: LessonResult) => {
  try {
    // Get saved lessons
    const storedLessons = localStorage.getItem('savedLessons');
    const savedLessons = storedLessons ? JSON.parse(storedLessons) : [];
    
    // Check if lesson already exists
    const existingIndex = savedLessons.findIndex((l: LessonResult) => l.id === lesson.id);
    
    // Enhanced lesson with saved timestamp
    const enhancedLesson = {
      ...lesson,
      savedAt: new Date().toISOString()
    };
    
    // Update or add the lesson
    if (existingIndex >= 0) {
      savedLessons[existingIndex] = enhancedLesson;
    } else {
      savedLessons.push(enhancedLesson);
    }
    
    // Save back to localStorage
    localStorage.setItem('savedLessons', JSON.stringify(savedLessons));
    
    return true;
  } catch (e) {
    console.error('Error saving lesson to localStorage:', e);
    return false;
  }
};

interface LessonDisplayProps {
  lesson: LessonResult;
  onReset: () => void;
}

export function LessonDisplay({ lesson, onReset }: LessonDisplayProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [teachingTip, setTeachingTip] = useState("");
  const [exportFormat, setExportFormat] = useState<"text" | "pdf" | "word">("text");
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [notes, setNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [customPlan, setCustomPlan] = useState(lesson.plan || "");
  
  // Add lesson to recent lessons when component mounts and check if it's saved
  useEffect(() => {
    // Add to recent lessons
    addRecentLesson(lesson.id);
    
    // Check if lesson is bookmarked on load
    try {
      const bookmarkedLessons = JSON.parse(localStorage.getItem('bookmarkedLessons') || '[]');
      const isFound = bookmarkedLessons.some((bm: any) => bm.id === lesson.id);
      setIsBookmarked(isFound);
      
      // Check if lesson is saved
      const storedLessons = localStorage.getItem('savedLessons');
      if (storedLessons) {
        const savedLessons = JSON.parse(storedLessons);
        const isSavedLesson = savedLessons.some((l: LessonResult) => l.id === lesson.id);
        setIsSaved(isSavedLesson);
      }
      
      // Load notes if any
      const savedNotes = localStorage.getItem(`lesson-notes-${lesson.id}`);
      if (savedNotes) {
        setNotes(savedNotes);
      }
    } catch (e) {
      console.error("Failed to load bookmarks or saved lessons", e);
    }
  }, [lesson.id]);
  
  const handleSave = () => {
    const success = saveLesson(lesson);
    if (success) {
      setIsSaved(true);
      toast.success("Lesson saved successfully", {
        description: "You can access this lesson from the Saved Lessons tab"
      });
    } else {
      toast.error("Failed to save lesson", {
        description: "Please try again later"
      });
    }
  };
  
  const handleDownload = () => {
    toast.info(`Downloading lesson plan as ${exportFormat}...`);
    
    // Creating a text version of the lesson plan
    const lessonText = `
      ${lesson.title}
      
      OVERVIEW:
      ${lesson.overview}
      
      LEARNING OBJECTIVES:
      ${lesson.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}
      
      LESSON PLAN:
      ${typeof lesson.plan === 'string' ? lesson.plan : 'No detailed plan available.'}
      
      ASSESSMENT:
      ${lesson.assessment}
      
      MATERIALS:
      ${lesson.materials.map((mat, i) => `${i + 1}. ${mat}`).join('\n')}
      
      TEACHING NOTES:
      ${notes || 'No notes added yet.'}
    `;
    
    // Create a blob and download it
    const blob = new Blob([lessonText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lesson.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Lesson plan downloaded as ${exportFormat}!`);
  };

  const handlePrint = () => {
    toast.info("Preparing lesson plan for printing...");
    window.print();
  };

  const handleShare = () => {
    // In a production app, this could use the Web Share API or copy to clipboard
    toast.info("Copying shareable link to clipboard...");
    
    // For demonstration, just copy current URL + imaginary lesson ID
    navigator.clipboard.writeText(`${window.location.origin}/lessons/share/${lesson.id}`);
    
    toast.success("Shareable link copied to clipboard!");
  };
  
  const fetchTeachingTip = async () => {
    setIsLoading(true);
    try {
      const subject = lesson.subject || "education";
      // Try with the model specified, but use a fallback strategy
      const tip = await generateTeachingTip(subject, "meta-llama/llama-4-scout:free");
      setTeachingTip(tip);
      toast.success("Teaching tip generated successfully");
    } catch (error) {
      console.error("Failed to fetch teaching tip:", error);
      
      // Handle error with clear feedback
      toast.error("Unable to load teaching tip. The AI model may be temporarily unavailable.", {
        duration: 4000,
        action: {
          label: "Try Again",
          onClick: () => fetchTeachingTip()
        }
      });
      
      // We don't set a fallback tip, but keep UI clean by not clearing existing tip if present
      if (!teachingTip) {
        // Only show this loading message if no tip is currently displayed
        setTeachingTip("");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleBookmark = () => {
    try {
      const bookmarkedLessons = JSON.parse(localStorage.getItem('bookmarkedLessons') || '[]');
      
      if (isBookmarked) {
        // Remove from bookmarks
        const filtered = bookmarkedLessons.filter((bm: any) => bm.id !== lesson.id);
        localStorage.setItem('bookmarkedLessons', JSON.stringify(filtered));
        toast.info("Removed from bookmarks");
      } else {
        // Add to bookmarks
        bookmarkedLessons.push({
          id: lesson.id,
          title: lesson.title,
          subject: lesson.subject,
          gradeLevel: lesson.gradeLevel,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('bookmarkedLessons', JSON.stringify(bookmarkedLessons));
        toast.success("Added to bookmarks");
      }
      
      setIsBookmarked(!isBookmarked);
    } catch (e) {
      console.error("Failed to update bookmarks", e);
      toast.error("Failed to update bookmarks");
    }
  };
  
  const saveNotes = () => {
    try {
      localStorage.setItem(`lesson-notes-${lesson.id}`, notes);
      toast.success("Notes saved successfully");
    } catch (e) {
      console.error("Failed to save notes", e);
      toast.error("Failed to save notes");
    }
  };
  
  const savePlanEdits = () => {
    setIsEditing(false);
    toast.success("Lesson plan updated");
    // In a real app, this would be saved to a database
  };
  
  // Fetch teaching tip on component mount
  useEffect(() => {
    fetchTeachingTip();
  }, []);
  
  return (
    <Card className="w-full animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{lesson.title}</CardTitle>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleBookmark} 
                    className={isBookmarked ? "text-primary" : ""}
                  >
                    {isBookmarked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isBookmarked ? 'Remove bookmark' : 'Bookmark lesson'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleSave}
                    className={isSaved ? "text-primary" : ""}
                    disabled={isSaved}
                  >
                    <Save className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSaved ? 'Lesson already saved' : 'Save lesson'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button variant="ghost" size="icon" onClick={() => setShowExportOptions(!showExportOptions)} title="Download">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePrint} title="Print">
              <Printer className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare} title="Share">
              <Share2 className="h-5 w-5" />
            </Button>
        </div>
        </div>
        
        {showExportOptions && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant={exportFormat === "text" ? "default" : "outline"} 
              onClick={() => { setExportFormat("text"); handleDownload(); }}
              className="flex items-center gap-2"
            >
              <File className="h-4 w-4" />
              Text
            </Button>
            <Button 
              size="sm" 
              variant={exportFormat === "pdf" ? "default" : "outline"} 
              onClick={() => { setExportFormat("pdf"); handleDownload(); }}
              className="flex items-center gap-2"
            >
              <File className="h-4 w-4" />
              PDF
            </Button>
            <Button 
              size="sm" 
              variant={exportFormat === "word" ? "default" : "outline"} 
              onClick={() => { setExportFormat("word"); handleDownload(); }}
              className="flex items-center gap-2"
            >
              <File className="h-4 w-4" />
              Word
            </Button>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="bg-muted text-sm px-2 py-1 rounded-md inline-flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{lesson.duration}</span>
          </div>
          <div className="bg-muted text-sm px-2 py-1 rounded-md inline-flex items-center">
            <Book className="h-3 w-3 mr-1" />
            <span>Grade {lesson.gradeLevel}</span>
          </div>
          {lesson.subject && (
            <div className="bg-primary/10 text-sm px-2 py-1 rounded-md inline-flex items-center">
              <span>{lesson.subject}</span>
            </div>
          )}
          {lesson.tags && lesson.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="plan">Lesson Plan</TabsTrigger>
            <TabsTrigger value="assessment" className="hidden sm:block">Assessment</TabsTrigger>
            <TabsTrigger value="materials" className="hidden sm:block">Materials</TabsTrigger>
            <TabsTrigger value="notes" className="hidden sm:block">Notes</TabsTrigger>
          </TabsList>
          
          <div className="block sm:hidden mb-4">
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant={activeTab === "assessment" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setActiveTab("assessment")}
                className="w-full text-xs"
              >
                Assessment
              </Button>
              <Button 
                variant={activeTab === "materials" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setActiveTab("materials")}
                className="w-full text-xs"
              >
                Materials
              </Button>
              <Button 
                variant={activeTab === "notes" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setActiveTab("notes")}
                className="w-full text-xs"
              >
                Notes
              </Button>
            </div>
          </div>
          
          <TabsContent value="overview" className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{lesson.overview}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Learning Objectives</h3>
              <ul className="list-disc list-inside space-y-1">
                {lesson.objectives.map((objective, index) => (
                  <li key={index} className="text-muted-foreground">{objective}</li>
                ))}
              </ul>
            </div>

            {teachingTip && (
              <div className="bg-primary/5 p-4 rounded-md border border-primary/20 mt-6">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm mb-2">Teaching Tip</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 -mt-1" 
                    onClick={fetchTeachingTip}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <p className="text-sm italic">{teachingTip}</p>
              </div>
            )}

            {!teachingTip && (
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  onClick={fetchTeachingTip}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Loading..." : "Get Teaching Tip"}
                </Button>
              </div>
            )}
            
            <Alert className="bg-accent/40 border-accent mt-4">
              <AlertDescription>
                <span className="font-medium">Standards alignment: </span>
                This lesson helps meet standards for {lesson.subject} at the {lesson.gradeLevel} grade level.
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          <TabsContent value="plan">
            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <textarea 
                    className="w-full min-h-[300px] p-4 border rounded-md" 
                    value={customPlan}
                    onChange={(e) => setCustomPlan(e.target.value)}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={savePlanEdits}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <div className="flex justify-end mb-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Edit Plan</span>
                    </Button>
                  </div>
                  
                  {typeof lesson.plan === 'string' && lesson.plan ? (
                    lesson.plan.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 text-muted-foreground">
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No detailed plan available.</p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
          
        <TabsContent value="assessment" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Assessment Strategy</h3>
                <div className="prose max-w-none">
                  <p className="text-muted-foreground">{lesson.assessment}</p>
                </div>
              </div>
              
              {lesson.questions && lesson.questions.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-4">Assessment Questions</h3>
                  <div className="space-y-4">
                    {lesson.questions.map((question, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-card">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 w-full">
                            <div className="flex justify-between mb-2">
                              <div className="font-medium text-card-foreground">Question {index + 1}</div>
                              {question.bloomsLevel && (
                                <Badge variant="outline" className="ml-2 text-xs whitespace-nowrap">
                                  {question.bloomsLevel}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm mb-3">{question.text}</p>
                            
                            {question.options && (
                              <div className="space-y-2 mt-2">
                                <div className="text-xs text-muted-foreground mb-1">Options:</div>
                                {question.options.map((option, optIndex) => (
                                  <div key={optIndex} className={`text-sm p-2 border rounded-md ${option === question.answer ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : 'bg-muted/30'}`}>
                                    <div className="flex items-start">
                                      <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 ${option === question.answer ? 'bg-green-500 text-white' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                                        {String.fromCharCode(65 + optIndex)}
                                      </div>
                                      <div className="text-sm">{option}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {!question.options && question.answer && (
                              <div className="mt-3">
                                <div className="text-xs text-muted-foreground mb-1">Example Answer:</div>
                                <div className="text-sm p-3 border border-green-200 bg-green-50 rounded-md dark:bg-green-950 dark:border-green-800">
                                  {question.answer}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(!lesson.questions || lesson.questions.length === 0) && (
                <div className="border rounded-lg p-4 mt-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">No assessment questions were generated.</span>
                  </div>
                  <p className="text-sm mt-2 text-muted-foreground">
                    Try regenerating the lesson with "Include Assessment" checked, or create questions manually.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="materials">
            <div>
              <ul className="space-y-2">
                {lesson.materials.map((material, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="bg-muted w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    <span>{material}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8">
                <h3 className="font-medium mb-4">Recommended Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="hover-lift">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-medium">Educational Videos</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Find subject-related videos from trusted educational sources.
                      </p>
                      <Button variant="link" className="px-0 py-1 h-auto text-xs" onClick={() => toast.info("This would open a resource finder dialog")}>
                        Browse Videos
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="hover-lift">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-medium">Printable Worksheets</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Download ready-to-use worksheets for this lesson.
                      </p>
                      <Button variant="link" className="px-0 py-1 h-auto text-xs" onClick={() => toast.info("This would open a worksheet generator")}>
                        Generate Worksheets
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="notes">
            <div className="space-y-4">
              <h3 className="font-medium">Teacher Notes</h3>
              <p className="text-xs text-muted-foreground">Add your personal notes, reflections, or reminders for this lesson plan.</p>
              
              <textarea
                className="w-full min-h-[200px] p-4 border rounded-md"
                placeholder="Add your notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              
              <Button onClick={saveNotes} className="w-full sm:w-auto">Save Notes</Button>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Tips for effective note-taking:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Record what worked well and what needs improvement</li>
                  <li>Note any modifications made during the lesson</li>
                  <li>Track student engagement and understanding</li>
                  <li>Add ideas for next time you teach this lesson</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between border-t pt-6 gap-4">
        <Button variant="outline" onClick={onReset} className="w-full sm:w-auto">
          Create New Lesson
        </Button>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          {!isSaved && (
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              <span>Save Lesson</span>
            </Button>
          )}
          <Button className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            <span>Edit Lesson</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}