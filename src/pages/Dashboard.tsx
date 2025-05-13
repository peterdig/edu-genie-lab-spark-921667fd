import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Book, Calendar, User, LucideIcon, Zap, Calculator, BarChart, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { lessons } from "@/data/mockData";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { useAuth } from "@/lib/AuthContext.jsx";
import { LessonResult } from "@/types/lessons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getSavedLessons } from "@/data/lessons";
import { ContentCard } from "@/components/dashboard/ContentCard";

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

interface CardHeadingProps {
  icon: LucideIcon;
  title: string;
  value: string;
  description: string;
  onClick?: () => void;
}

const CardHeading = ({ icon: Icon, title, value, description, onClick }: CardHeadingProps) => (
  <div className={cn("p-4", onClick && "cursor-pointer")} onClick={onClick}>
    <span className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
      <Icon className="size-4 text-primary" />
      {title}
    </span>
    <p className="mt-2 text-3xl font-bold">{value}</p>
    <p className="text-muted-foreground text-sm mt-1">{description}</p>
  </div>
);

// Add a lesson to recent lessons
const addRecentLesson = (lessonId: string) => {
  try {
    let recentLessons = JSON.parse(localStorage.getItem("recentLessons") || "[]");
    
    // Remove if already exists
    recentLessons = recentLessons.filter((id: string) => id !== lessonId);
    
    // Add to front of array
    recentLessons.unshift(lessonId);
    
    // Keep only last 10 lessons
    recentLessons = recentLessons.slice(0, 10);
    
    localStorage.setItem("recentLessons", JSON.stringify(recentLessons));
    return true;
  } catch (e) {
    console.error("Failed to add recent lesson:", e);
    return false;
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [savedLessons, setSavedLessons] = useState<LessonResult[]>([]);
  
  // Load saved lessons on component mount
  useEffect(() => {
    // Load saved lessons
    const saved = getSavedLessons();
    setSavedLessons(saved.slice(0, 3)); // Only show 3 most recent saved
  }, []);
  
  const handleLessonClick = (lessonId: string) => {
    // Add to recent lessons
    addRecentLesson(lessonId);
    // Navigate to the lesson details page with the lessonId parameter
    navigate(`/lessons/${lessonId}`);
  };

  // Generate data from actual lessons instead of static values
  const statsData = useMemo(() => ({
    lessons: {
      count: lessons.length,
      increase: "+2 this week"
    },
    assessments: {
      count: 8,
      increase: "+1 this week"
    },
    labs: {
      count: 5,
      increase: "3 recent views"
    },
    students: {
      count: 36,
      increase: "Active students"
    }
  }), []);
  
  return (
    <Layout>
      <div className="space-y-6 w-full max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome {user?.email ? `${user.email}` : "to your"} AI-Powered Educator Companion
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard>
            <CardHeader className="pb-0 pt-4">
              <CardHeading 
                icon={Book} 
                title="Created Lessons" 
                value={statsData.lessons.count.toString()} 
                description={statsData.lessons.increase}
                onClick={() => navigate('/lessons')}
              />
            </CardHeader>
          </FeatureCard>
          
          <FeatureCard>
            <CardHeader className="pb-0 pt-4">
              <CardHeading 
                icon={Calendar} 
                title="Assessments" 
                value={statsData.assessments.count.toString()} 
                description={statsData.assessments.increase}
                onClick={() => navigate('/assessments')}
              />
            </CardHeader>
          </FeatureCard>
          
          <FeatureCard>
            <CardHeader className="pb-0 pt-4">
              <CardHeading 
                icon={Calculator} 
                title="Lab Simulations" 
                value={statsData.labs.count.toString()} 
                description={statsData.labs.increase}
                onClick={() => navigate('/labs')}
              />
            </CardHeader>
          </FeatureCard>
          
          <FeatureCard>
            <CardHeader className="pb-0 pt-4">
              <CardHeading 
                icon={User} 
                title="Students" 
                value={statsData.students.count.toString()} 
                description={statsData.students.increase}
                onClick={() => navigate('/collaboration')}
              />
            </CardHeader>
          </FeatureCard>
        </div>
        
        {/* Quick Actions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <FeatureCard className="p-0 overflow-hidden">
              <Button 
                variant="ghost" 
                className="h-24 w-full flex-col rounded-none bg-transparent hover:bg-primary/5"
                onClick={() => navigate('/lessons')}
              >
                <div className="relative">
                  <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_10%,theme(colors.primary.400/10),transparent_70%)]"></div>
                  <Book className="h-8 w-8 mb-2 text-primary" />
                </div>
                <span className="font-medium">Create Lesson</span>
              </Button>
            </FeatureCard>
            
            <FeatureCard className="p-0 overflow-hidden">
              <Button 
                variant="ghost" 
                className="h-24 w-full flex-col rounded-none bg-transparent hover:bg-primary/5"
                onClick={() => navigate('/assessments')}
              >
                <div className="relative">
                  <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_10%,theme(colors.primary.400/10),transparent_70%)]"></div>
                  <BarChart className="h-8 w-8 mb-2 text-primary" />
                </div>
                <span className="font-medium">Create Assessment</span>
              </Button>
            </FeatureCard>
            
            <FeatureCard className="p-0 overflow-hidden">
              <Button 
                variant="ghost" 
                className="h-24 w-full flex-col rounded-none bg-transparent hover:bg-primary/5"
                onClick={() => navigate('/labs')}
              >
                <div className="relative">
                  <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_10%,theme(colors.primary.400/10),transparent_70%)]"></div>
                  <Zap className="h-8 w-8 mb-2 text-primary" />
                </div>
                <span className="font-medium">Browse Labs</span>
              </Button>
            </FeatureCard>
          </div>
        </div>

        {/* Saved Lessons Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Saved Lessons</h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Save className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Your saved lesson plans
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/lessons?tab=saved')}
              className="rounded-lg border-primary/20 hover:bg-primary/5 hover:text-primary"
            >
              View All
              <Plus className="ml-2 h-3 w-3" />
            </Button>
          </div>
          
          {savedLessons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedLessons.map((lesson) => (
                <ContentCard
                  key={lesson.id}
                  title={lesson.title}
                  description={lesson.overview}
                  metadata={`${lesson.gradeLevel} • ${lesson.duration}`}
                  timestamp={lesson.savedAt ? new Date(lesson.savedAt).toLocaleDateString() : undefined}
                  tags={lesson.tags}
                  onClick={() => handleLessonClick(lesson.id)}
                  icon={<Save className="h-4 w-4" />}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Save className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground">
                  No saved lessons yet. Save a lesson to access it quickly here!
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => navigate('/lessons')}
                >
                  Create New Lesson
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
