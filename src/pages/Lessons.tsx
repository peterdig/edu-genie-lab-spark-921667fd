
import { useState } from "react";
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

export default function Lessons() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("create");
  const [generatedLesson, setGeneratedLesson] = useState<LessonResult | null>(null);
  const [savedLessons] = useState(lessons);
  
  const handleLessonGenerated = (lesson: LessonResult) => {
    setGeneratedLesson(lesson);
  };
  
  const handleReset = () => {
    setGeneratedLesson(null);
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lessons</h1>
          <p className="text-muted-foreground">
            Create and manage AI-generated lesson plans
          </p>
        </div>
        
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
            <div className="flex flex-col sm:flex-row gap-4">
              <Input placeholder="Search lessons..." className="sm:max-w-xs" />
              <Select defaultValue="all">
                <SelectTrigger className="sm:max-w-xs">
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
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedLessons.map((lesson) => (
                <ContentCard
                  key={lesson.id}
                  title={lesson.title}
                  description={`Grade ${lesson.gradeLevel} • ${lesson.duration}`}
                  tags={lesson.tags}
                  onClick={() => navigate(`/lessons/${lesson.id}`)}
                >
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {lesson.overview}
                  </p>
                </ContentCard>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
