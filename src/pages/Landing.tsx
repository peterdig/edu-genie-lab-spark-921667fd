import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { ChevronRight, Lightbulb, Users, Clock, BookOpen, Star, Sparkles, Brain, ArrowRight, Blocks, GraduationCap } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [hovered, setHovered] = useState<string | null>(null);

  const features = [
    {
      id: "ai-powered",
      title: "AI-Powered Lesson Planning",
      description: "Create personalized, standards-aligned lesson plans in minutes with AI assistance.",
      icon: <Brain className="w-5 h-5" />,
    },
    {
      id: "content-generation",
      title: "Smart Content Generation",
      description: "Generate assessment questions, worksheets, and content tailored to your curriculum.",
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      id: "time-saving",
      title: "Save Valuable Time",
      description: "Reduce planning time by up to 75% with ready-to-use templates and AI tools.",
      icon: <Clock className="w-5 h-5" />,
    },
    {
      id: "differentiation",
      title: "Differentiation Tools",
      description: "Automatically adapt lessons for different learning needs and accessibility requirements.",
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: "curriculum",
      title: "Curriculum Library",
      description: "Access thousands of ready-to-use lessons across all subjects and grade levels.",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: "labs",
      title: "Interactive Labs",
      description: "Create engaging virtual labs and interactive exercises for science and STEM classes.",
      icon: <Blocks className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_10%,#3b82f640,transparent)]" />
        </div>
        
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-1 px-3 rounded-full text-sm font-medium mb-6 flex items-center">
              <GraduationCap className="w-4 h-4 mr-1" />
              Built for educators, by educators
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Empower Your Teaching With <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">EdGenie</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl">
              The AI-powered education platform that helps you create engaging lessons, save time, and meet the needs of every student.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Button 
                size="lg" 
                className="gap-2 px-6 text-base w-full"
                onClick={() => navigate("/signup")}
              >
                Get Started
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2 px-6 text-base"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Designed for Modern Educators</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            EdGenie combines cutting-edge AI with proven pedagogy to create the ultimate teaching companion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card
              key={feature.id}
              className="p-6 h-full transition-all duration-300"
              style={{
                backgroundColor: theme === "dark" ? "#262626" : "#f5f5f5",
                borderColor: feature.id === "ai-powered" ? "rgba(59, 130, 246, 0.2)" : 
                            feature.id === "content-generation" ? "rgba(168, 85, 247, 0.2)" :
                            feature.id === "time-saving" ? "rgba(236, 72, 153, 0.2)" :
                            feature.id === "differentiation" ? "rgba(34, 197, 94, 0.2)" :
                            feature.id === "curriculum" ? "rgba(234, 179, 8, 0.2)" :
                            "rgba(239, 68, 68, 0.2)"
              }}
              onMouseEnter={() => setHovered(feature.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex flex-col h-full">
                <div className={`p-3 rounded-full w-fit mb-4 ${
                  feature.id === "ai-powered" ? "bg-blue-500/10" : 
                  feature.id === "content-generation" ? "bg-purple-500/10" :
                  feature.id === "time-saving" ? "bg-pink-500/10" :
                  feature.id === "differentiation" ? "bg-green-500/10" :
                  feature.id === "curriculum" ? "bg-yellow-500/10" :
                  "bg-red-500/10"
                }`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground flex-grow">{feature.description}</p>
                <div className={`mt-4 flex items-center text-sm font-medium transition-opacity duration-300 ${
                  feature.id === "ai-powered" ? "text-blue-500" : 
                  feature.id === "content-generation" ? "text-purple-500" :
                  feature.id === "time-saving" ? "text-pink-500" :
                  feature.id === "differentiation" ? "text-green-500" :
                  feature.id === "curriculum" ? "text-yellow-500" :
                  "text-red-500"
                } ${hovered === feature.id ? 'opacity-100' : 'opacity-0'}`}>
                  <span>Learn more</span>
                  <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Teaching?</h2>
            <p className="text-muted-foreground mb-8">
              Join educators who are saving time and creating better learning experiences with EdGenie.
            </p>
            <Button 
              size="lg" 
              className="gap-2 px-6 text-base"
              onClick={() => navigate("/signup")}
            >
              Create Account
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-background border-t py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <span className="text-xl font-bold">EdGenie</span>
            </div>
            <div className="flex gap-6">
              <Button variant="ghost" onClick={() => navigate("/login")}>Log in</Button>
              <Button variant="ghost" onClick={() => navigate("/signup")}>Sign up</Button>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} EdGenie. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 