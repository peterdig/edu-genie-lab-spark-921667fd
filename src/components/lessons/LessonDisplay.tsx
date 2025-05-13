import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LessonResult } from "@/types/lessons";
import { toast } from "sonner";
import { Book, Calendar, CheckSquare, Download, Edit, Printer, Share2, File, RefreshCw, Bookmark, BookmarkCheck, ArrowDownToLine, Pencil, Save } from "lucide-react";
import { generateTeachingTip } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{lesson.title}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className="font-normal">
              Grade {lesson.gradeLevel}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {lesson.subject}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {lesson.duration}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-end mt-2 sm:mt-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={isSaved ? "default" : "outline"}
                  onClick={handleSave}
                  disabled={isSaved}
                  className="h-8"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isSaved ? "Saved" : "Save"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isSaved ? "Lesson saved" : "Save lesson"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleBookmark}
                  className="h-8"
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isBookmarked ? "Remove bookmark" : "Bookmark lesson"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowExportOptions(!showExportOptions)}
                  className="h-8"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export lesson plan</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrint}
                  className="h-8"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print lesson plan</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleShare}
                  className="h-8"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share lesson plan</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {showExportOptions && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex flex-col space-y-4">
              <div className="space-y-2 w-full">
                <h3 className="text-sm font-medium">Export Format</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant={exportFormat === "text" ? "default" : "outline"}
                    onClick={() => setExportFormat("text")}
                    className="h-8"
                  >
                    <File className="h-4 w-4 mr-1 sm:mr-2" />
                    <span>Text</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={exportFormat === "pdf" ? "default" : "outline"}
                    onClick={() => setExportFormat("pdf")}
                    className="h-8"
                  >
                    <File className="h-4 w-4 mr-1 sm:mr-2" />
                    <span>PDF</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={exportFormat === "word" ? "default" : "outline"}
                    onClick={() => setExportFormat("word")}
                    className="h-8"
                  >
                    <File className="h-4 w-4 mr-1 sm:mr-2" />
                    <span>Word</span>
                  </Button>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleDownload}
                className="h-8 w-full"
              >
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Download {exportFormat.toUpperCase()}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2 no-scrollbar">
          <TabsList className="w-auto inline-flex min-w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lesson-plan">Lesson Plan</TabsTrigger>
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {lesson.overview}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-1">Learning Objectives</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {lesson.objectives.map((objective, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-1">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {lesson.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Teaching Tip</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchTeachingTip}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground italic">Loading teaching tip...</p>
              ) : teachingTip ? (
                <p className="text-sm text-muted-foreground">{teachingTip}</p>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    No teaching tip loaded yet.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchTeachingTip}
                    disabled={isLoading}
                  >
                    Generate Teaching Tip
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="lesson-plan" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Detailed Lesson Plan</CardTitle>
                {/* Edit button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={customPlan}
                    onChange={(e) => setCustomPlan(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCustomPlan(lesson.plan || "");
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={savePlanEdits}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-line text-sm">
                  {customPlan || lesson.plan}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assessment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line text-sm">
                {lesson.assessment}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Required Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                {lesson.materials.map((material, i) => (
                  <li key={i} className="text-sm">
                    {material}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teaching Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add your notes about this lesson here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={8}
              />
              <Button 
                onClick={saveNotes} 
                className="mt-4"
                size="sm"
              >
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onReset}
        >
          Back to Generator
        </Button>
        
        <Button
          onClick={handleSave}
          disabled={isSaved}
        >
          {isSaved ? "Saved to Library" : "Save to My Library"}
        </Button>
      </div>
    </div>
  );
}
