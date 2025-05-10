
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { LessonGenerator } from "@/components/lessons/LessonGenerator";
import { LessonDisplay } from "@/components/lessons/LessonDisplay";
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
import { RefreshCw, Filter, Book, Download } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Lessons() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("create");
  const [generatedLesson, setGeneratedLesson] = useState<LessonResult | null>(null);
  const [savedLessons] = useState(lessons);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [teachingTip, setTeachingTip] = useState("");
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
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

  const fetchRandomTip = async () => {
    setIsLoadingTip(true);
    try {
      const tip = await generateTeachingTip("education");
      setTeachingTip(tip);
    } catch (error) {
      console.error("Failed to fetch teaching tip:", error);
      // Set a default tip if API fails
      setTeachingTip("Create interactive learning stations to engage different learning styles simultaneously.");
    } finally {
      setIsLoadingTip(false);
    }
  };

  // Fetch teaching tip on component mount
  useEffect(() => {
    fetchRandomTip();
    
    // Check for previously generated lesson in localStorage
    try {
      const lessons = JSON.parse(localStorage.getItem("generatedLessons") || "[]");
      if (lessons.length > 0) {
        // Optional: restore most recent lesson
        // setGeneratedLesson(lessons[lessons.length - 1]);
      }
    } catch (e) {
      console.error("Failed to load lessons from localStorage", e);
    }
  }, []);
  
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
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lessons</h1>
            <p className="text-muted-foreground">
              Create and manage AI-generated lesson plans
            </p>
          </div>
          <DarkModeToggle />
        </div>

        {teachingTip && (
          <Card className="bg-primary/5 border border-primary/20 hover-lift">
            <CardContent className="flex items-center justify-between p-4">
              <p className="text-sm italic flex-1">{teachingTip}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2" 
                onClick={fetchRandomTip} 
                disabled={isLoadingTip}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingTip ? 'animate-spin' : ''}`} />
              </Button>
            </CardContent>
          </Card>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="saved">Saved Lessons</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="create" className="space-y-4">
            {generatedLesson ? (
              <LessonDisplay lesson={generatedLesson} onReset={handleReset} />
            ) : (
              <LessonGenerator onLessonGenerated={handleLessonGenerated} />
            )}
          </TabsContent>
          
          <TabsContent value="saved" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <Input 
                    placeholder="Search lessons..." 
                    className="sm:max-w-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setGradeFilter("all");
                      setSubjectFilter("all");
                    }}
                  >
                    Clear
                  </Button>
                </div>
                
                {showFilters && (
                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <Select 
                      value={gradeFilter} 
                      onValueChange={setGradeFilter}
                    >
                      <SelectTrigger className="sm:max-w-[200px]">
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
                      <SelectTrigger className="sm:max-w-[200px]">
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
              <div className="text-center py-8">
                <p className="text-muted-foreground">No lessons match your search criteria.</p>
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchQuery("");
                    setGradeFilter("all");
                    setSubjectFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredLessons.map((lesson) => (
                  <ContentCard
                    key={lesson.id}
                    title={lesson.title}
                    description={`Grade ${lesson.gradeLevel} • ${lesson.duration}`}
                    tags={lesson.tags}
                    onClick={() => navigate(`/lessons/${lesson.id}`)}
                    className="hover-lift"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Book className="h-3 w-3" />
                        <span>{lesson.subject}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {lesson.overview}
                    </p>
                  </ContentCard>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
