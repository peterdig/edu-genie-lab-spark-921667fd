
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LessonResult } from "@/types/lessons";
import { toast } from "sonner";
import { Book, Calendar, CheckSquare, Download, Edit, Printer, Share2 } from "lucide-react";
import { generateTeachingTip } from "@/lib/api";

interface LessonDisplayProps {
  lesson: LessonResult;
  onReset: () => void;
}

export function LessonDisplay({ lesson, onReset }: LessonDisplayProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [teachingTip, setTeachingTip] = useState("");
  
  const handleDownload = () => {
    // In a real app, this would generate a PDF or other download format
    toast.info("Downloading lesson plan...");
    
    // Creating a text version of the lesson plan
    const lessonText = `
      ${lesson.title}
      
      OVERVIEW:
      ${lesson.overview}
      
      LEARNING OBJECTIVES:
      ${lesson.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}
      
      LESSON PLAN:
      ${lesson.plan}
      
      ASSESSMENT:
      ${lesson.assessment}
      
      MATERIALS:
      ${lesson.materials.map((mat, i) => `${i + 1}. ${mat}`).join('\n')}
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
    
    toast.success("Lesson plan downloaded!");
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
      const tip = await generateTeachingTip(subject);
      setTeachingTip(tip);
    } catch (error) {
      console.error("Failed to fetch teaching tip:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{lesson.title}</CardTitle>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={handleShare} title="Share">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePrint} title="Print">
              <Printer className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload} title="Download">
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="bg-muted text-sm px-2 py-1 rounded-md inline-flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{lesson.duration}</span>
          </div>
          <div className="bg-muted text-sm px-2 py-1 rounded-md inline-flex items-center">
            <Book className="h-3 w-3 mr-1" />
            <span>Grade {lesson.gradeLevel}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="plan">Lesson Plan</TabsTrigger>
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>
          
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

            {teachingTip && (
              <div className="bg-primary/5 p-4 rounded-md border border-primary/20 mt-6">
                <h4 className="font-medium text-sm mb-2">Teaching Tip</h4>
                <p className="text-sm italic">{teachingTip}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="plan">
            <div className="space-y-4">
              <div className="prose max-w-none">
                {lesson.plan.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="assessment">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Assessment Strategy</h3>
                <div className="prose max-w-none">
                  <p className="text-muted-foreground">{lesson.assessment}</p>
                </div>
              </div>
              
              {lesson.questions && lesson.questions.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-4">Sample Questions</h3>
                  <div className="space-y-4">
                    {lesson.questions.map((question, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <p className="font-medium mb-2">{index + 1}. {question.text}</p>
                        {question.options && (
                          <ul className="space-y-2 mt-2">
                            {question.options.map((option, optIndex) => (
                              <li key={optIndex} className="flex items-start gap-2">
                                <div className="min-w-4 mt-0.5">
                                  {option === question.answer ? (
                                    <CheckSquare className="h-4 w-4 text-primary" />
                                  ) : (
                                    <div className="h-4 w-4 border rounded" />
                                  )}
                                </div>
                                <span>{option}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
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
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <Button variant="outline" onClick={onReset}>
          Create New Lesson
        </Button>
        <Button className="flex items-center gap-2">
          <Edit className="h-4 w-4" />
          <span>Edit Lesson</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
