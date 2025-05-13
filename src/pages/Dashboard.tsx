import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Book, Calendar, User, LucideIcon, Zap, Calculator, BarChart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { lessons } from "@/data/mockData";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { useAuth } from "@/lib/AuthContext.jsx";

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Use actual data or fall back to mocks 
  const featuredLessons = useMemo(() => lessons.slice(0, 3), []);
  
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
  
  // If not authenticated, we would normally redirect to login, 
  // but AuthGuard is already handling this in App.tsx route configuration
  
  return (
    <Layout>
      <div className="space-y-6 w-full max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome {user?.email ? `${user.email}` : "to your"} AI-Powered Educator Companion
          </p>
        </div>
        
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
                  <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_10%,theme(colors.primary/10%),transparent_70%)]"></div>
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
                  <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_10%,theme(colors.primary/10%),transparent_70%)]"></div>
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
                  <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_10%,theme(colors.primary/10%),transparent_70%)]"></div>
                  <Zap className="h-8 w-8 mb-2 text-primary" />
                </div>
                <span className="font-medium">Browse Labs</span>
              </Button>
            </FeatureCard>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Lessons</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/lessons')}
              className="rounded-lg border-primary/20 hover:bg-primary/5 hover:text-primary"
            >
              View All
            </Button>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredLessons.map((lesson) => (
              <FeatureCard 
                key={lesson.id} 
                className="hover:border-primary transition-colors cursor-pointer overflow-hidden"
              >
                <CardContent 
                  className="p-4" 
                  onClick={() => navigate(`/lessons/${lesson.id}`)}
                >
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{lesson.title}</h3>
                    <div className="flex items-center gap-1 mb-3 text-xs text-muted-foreground">
                      <Book className="h-3 w-3" />
                      <span>Grade {lesson.gradeLevel} • {lesson.duration}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {lesson.overview}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mt-4">
                      {lesson.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </FeatureCard>
            ))}
            
            <FeatureCard className="border-dashed hover:border-primary transition-colors cursor-pointer overflow-hidden h-[250px]">
              <div 
                className="flex flex-col items-center justify-center h-full"
                onClick={() => navigate('/lessons')}
              >
                <div className="relative">
                  <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_50%,theme(colors.primary/10%),transparent_70%)]"></div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <span className="font-medium text-primary">Create New Lesson</span>
                <p className="text-muted-foreground text-sm mt-2">
                  Generate a new AI-powered lesson plan
                </p>
              </div>
            </FeatureCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}
