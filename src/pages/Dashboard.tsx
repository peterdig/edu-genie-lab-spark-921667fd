
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ContentCard } from "@/components/dashboard/ContentCard";
import { Book, Calendar, Info, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { lessons } from "@/data/mockData";

export default function Dashboard() {
  const navigate = useNavigate();
  const [featuredLessons] = useState(lessons.slice(0, 3));
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your AI-Powered Educator Companion
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Created Lessons" 
            value="12" 
            description="+2 this week"
            icon={<Book className="h-5 w-5 text-primary" />}
          />
          <StatCard 
            title="Assessments" 
            value="8" 
            description="+1 this week"
            icon={<Calendar className="h-5 w-5 text-primary" />}
          />
          <StatCard 
            title="Lab Simulations" 
            value="5" 
            description="3 recent views"
            icon={<Info className="h-5 w-5 text-primary" />}
          />
          <StatCard 
            title="Students" 
            value="36" 
            description="Active students"
            icon={<User className="h-5 w-5 text-primary" />}
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Button 
              variant="outline" 
              className="h-24 flex-col"
              onClick={() => navigate('/lessons')}
            >
              <Book className="h-8 w-8 mb-2" />
              <span>Create Lesson</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col"
              onClick={() => navigate('/assessments')}
            >
              <Calendar className="h-8 w-8 mb-2" />
              <span>Create Assessment</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col"
              onClick={() => navigate('/labs')}
            >
              <Info className="h-8 w-8 mb-2" />
              <span>Browse Labs</span>
            </Button>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Lessons</h2>
            <Button variant="outline" size="sm" onClick={() => navigate('/lessons')}>
              View All
            </Button>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredLessons.map((lesson) => (
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
            
            <ContentCard
              title="Create New Lesson"
              description="Generate a new AI-powered lesson plan"
              className="border-dashed flex flex-col items-center justify-center cursor-pointer h-[220px]"
              onClick={() => navigate('/lessons')}
            >
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Click to create a new lesson
                </p>
              </div>
            </ContentCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}
