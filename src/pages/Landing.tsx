import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import Spline from '@splinetool/react-spline';
import { ShimmerLogo } from "@/components/ShimmerLogo";
import { TextShimmer } from "@/components/TextShimmer";
import { ChevronRight, Users, Clock, BookOpen, Sparkles, Brain, ArrowRight, Blocks, GraduationCap, Accessibility, FlaskConical, FileText, Zap, Smartphone, Download, Check, Shield, Wifi, WifiOff, Globe, Award, Layers, CheckCircle } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [hovered, setHovered] = useState<string | null>(null);
  const [isSplineLoaded, setIsSplineLoaded] = useState(false);
  const splineRef = useRef<any>(null);

  // Handle Spline load
  function onSplineLoad(spline: any) {
    setIsSplineLoaded(true);
    splineRef.current = spline;
  }

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

  const advancedFeatures = [
    {
      id: "assessments",
      title: "Smart Assessments",
      description: "Create customizable assessments with auto-grading capabilities to evaluate student learning.",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: "accessibility",
      title: "Accessibility Tools",
      description: "Enhanced features for all learners including text-to-speech and customizable display options.",
      icon: <Accessibility className="w-5 h-5" />,
    },
    {
      id: "virtual-labs",
      title: "Virtual Labs",
      description: "Access a library of interactive science simulations for hands-on virtual learning experiences.",
      icon: <FlaskConical className="w-5 h-5" />,
    },
    {
      id: "collaboration",
      title: "Teacher Collaboration",
      description: "Share resources and collaborate with other educators to improve teaching practices.",
      icon: <Users className="w-5 h-5" />,
    },
  ];
  
  const mobileFeatures = [
    {
      id: "offline-access",
      title: "Offline Access",
      description: "Access your lessons and resources without internet connection",
      icon: <WifiOff className="w-5 h-5" />,
    },
    {
      id: "fast-responsive",
      title: "Fast & Responsive",
      description: "Optimized mobile performance for a smooth teaching experience",
      icon: <Zap className="w-5 h-5" />,
    },
    {
      id: "secure-data",
      title: "Secure Data",
      description: "End-to-end encryption for your content and student information",
      icon: <Shield className="w-5 h-5" />,
    },
    {
      id: "auto-sync",
      title: "Auto-Sync",
      description: "Automatically synchronize when you're back online",
      icon: <Wifi className="w-5 h-5" />,
    },
  ];

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-background" style={{minHeight: "calc(100vh - 6rem)"}}>
        <div className="absolute inset-0 z-0">
          {/* Fallback gradient with better light/dark mode contrast */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/30 dark:from-primary/10 dark:via-secondary/5 dark:to-primary/10" />
          
          {/* Spline 3D background - hide on small screens for better performance */}
          <div className={`transition-opacity duration-1000 ${isSplineLoaded ? 'opacity-100' : 'opacity-0'} hidden md:block`}>
            <Spline 
              scene="https://prod.spline.design/hJ8WSiKIQDRgOe29/scene.splinecode" 
              onLoad={onSplineLoad}
            />
          </div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 h-full flex items-center justify-center relative z-10">
          <motion.div 
            className="flex flex-col items-center text-center max-w-3xl mx-auto pt-16 md:pt-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-1 px-3 rounded-full text-sm font-medium mb-4 md:mb-6 flex items-center shadow-sm">
              <GraduationCap className="w-4 h-4 mr-1" />
              <span className="text-xs sm:text-sm">Built for educators, by educators</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-4 md:mb-6 drop-shadow-sm px-2 text-foreground">
              Empower Your Teaching With <br className="block sm:hidden" /><ShimmerLogo variant="hero" size="xl" />
            </h1>
            
            <p className="text-sm sm:text-base md:text-xl text-muted-foreground mb-6 md:mb-10 max-w-2xl px-4">
              The AI-powered education platform that helps you create engaging lessons, save time, and meet the needs of every student.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center px-4 sm:px-0">
              <Button 
                size="lg" 
                className="gap-2 px-4 md:px-6 text-sm md:text-base w-full bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 transition-colors shadow-md text-white"
                onClick={() => navigate("/signup")}
              >
                Get Started
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2 px-4 md:px-6 text-sm md:text-base border-primary/30 hover:bg-primary/10 shadow-sm text-foreground"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll down indicator */}
        <motion.div 
          className="absolute bottom-8 left-0 right-0 flex justify-center items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <motion.div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-foreground"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 15L3 8H17L10 15Z" fill="currentColor" />
            </svg>
          </motion.div>
        </motion.div>
      </div>

      {/* Highlights banner - Added for mobile friendliness */}
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 dark:from-primary/10 dark:to-secondary/10 py-8 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-y-4 gap-x-8 md:gap-x-12">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="text-sm md:text-base font-medium text-foreground">Time-saving</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="text-sm md:text-base font-medium text-foreground">AI-Powered</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="text-sm md:text-base font-medium text-foreground">User-Friendly</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="text-sm md:text-base font-medium text-foreground">Research-Based</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - Improved for light mode */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <motion.div 
          className="text-center mb-8 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">Core Features</span>
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-3 md:mb-4 mt-2 text-foreground">Designed for Modern Educators</h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            <ShimmerLogo variant="header" size="sm" /> combines cutting-edge AI with proven pedagogy to create the ultimate teaching companion.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((feature) => (
            <motion.div key={feature.id} variants={itemVariants}>
            <Card
                className="p-4 md:p-6 h-full transition-all duration-300 hover:shadow-md hover:border-primary/20 border-border text-card-foreground"
            >
              <div className="flex flex-col h-full">
                  <div className="p-2 md:p-3 rounded-full w-fit mb-3 md:mb-4 bg-primary/15 text-primary">
                  {feature.icon}
                </div>
                  <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Advanced Features Section - Enhanced for light mode */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10 dark:from-primary/5 dark:via-secondary/5 dark:to-primary/5 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-8 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-medium text-secondary uppercase tracking-wider">Advanced Tools</span>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-3 md:mb-4 mt-2 text-foreground">Powerful Teaching Capabilities</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-2">
              Unlock advanced features designed to enhance every aspect of your teaching experience.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {advancedFeatures.map((feature) => (
              <motion.div key={feature.id} variants={itemVariants}>
                <Card
                  className="p-4 md:p-6 h-full transition-all duration-300 hover:shadow-md hover:border-secondary/20 border-border text-card-foreground"
                >
                  <div className="flex flex-col h-full">
                    <div className="p-2 md:p-3 rounded-full w-fit mb-3 md:mb-4 bg-secondary/20 dark:bg-secondary/15 text-secondary-foreground">
                      {feature.icon}
                    </div>
                    <h3 className="text-base md:text-xl font-semibold mb-1 md:mb-2 text-foreground">{feature.title}</h3>
                    <p className="text-xs md:text-base text-muted-foreground">{feature.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Mobile App Section - Improved for light mode */}
      <div className="py-12 md:py-20 bg-background overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="order-2 lg:order-1">
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <TextShimmer
                  as="h2"
                  className="text-xl sm:text-2xl md:text-4xl font-bold mb-3 md:mb-4 mt-2 text-foreground"
                  shimmerColor="rgba(var(--primary-rgb), 0.8)"
                  baseColor="rgba(var(--primary-rgb), 0.6)"
                >
                  Mobile Experience
                </TextShimmer>
                <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8 max-w-xl">
                  Take <ShimmerLogo variant="header" size="sm" /> with you wherever you go. Our mobile app provides all the tools you need for planning and teaching on the move.
                </p>
              </motion.div>
              
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                {mobileFeatures.map((feature, index) => (
                  <motion.div key={feature.id} variants={itemVariants}>
                    <div 
                      className="bg-card p-3 md:p-5 rounded-lg border border-border shadow-sm flex flex-col h-full text-card-foreground"
                    >
                      <div className="p-2 rounded-full w-fit mb-2 md:mb-3 bg-primary/10 text-primary">
                        {feature.icon}
                      </div>
                      <h3 className="text-base md:text-lg font-semibold mb-1 text-foreground">{feature.title}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            
            <div className="order-1 lg:order-2 flex justify-center">
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="absolute -top-8 -right-8 w-16 sm:w-24 h-16 sm:h-24 bg-primary/10 rounded-full blur-lg"></div>
                <div className="absolute -bottom-4 -left-4 w-12 sm:w-16 h-12 sm:h-16 bg-secondary/10 rounded-full blur-lg"></div>
                
                {/* 3D Mobile device container with hover effect */}
                <motion.div
                  className="relative bg-gradient-to-br from-background to-primary/5 rounded-[2.5rem] p-3 md:p-4 border-8 border-background shadow-xl"
                  style={{maxWidth: "260px"}}
                  whileHover={{ 
                    y: -8,
                    rotateY: "-15deg",
                    transition: { duration: 0.3 }
                  }}
                  animate={{
                    y: [0, -5, 0],
                    rotateY: ["-5deg", "-8deg", "-5deg"]
                  }}
                  transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 4
                  }}
                >
                  {/* Mobile device mockup */}
                  <div className="rounded-[2rem] overflow-hidden bg-black shadow-2xl"
                    style={{
                      transform: "perspective(1000px)",
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                    }}
                  >
                    <img
                      src="/mob.png"
                      alt="EduGenie Mobile App"
                      className="w-full h-auto"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='500' viewBox='0 0 250 500' fill='none'%3E%3Crect width='250' height='500' fill='%231a1a2e'/%3E%3Ctext x='125' y='250' font-family='Arial' font-size='18' fill='white' text-anchor='middle'%3EEduGenie Mobile%3C/text%3E%3C/svg%3E";
                        target.onerror = null;
                      }}
                      style={{
                        transition: "all 0.3s ease"
                      }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA Section - Enhanced for light mode */}
      <div className="bg-gradient-to-br from-primary/20 via-secondary/15 to-primary/20 dark:from-primary/10 dark:via-secondary/5 dark:to-primary/10 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-foreground">Ready to Transform Your Teaching?</h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of educators who are saving time and creating better learning experiences with <ShimmerLogo variant="header" size="sm" />.
            </p>
            <Button 
              size="lg" 
              className="gap-2 px-6 text-base bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 transition-colors shadow-md text-white"
              onClick={() => navigate("/signup")}
            >
              Create Account
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Footer - Improved for light mode */}
      <footer className="bg-background border-t py-8 md:py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <ShimmerLogo variant="footer" size="md" />
            </div>
            <div className="flex flex-wrap justify-center gap-3 md:gap-6">
              <Button variant="ghost" className="hover:text-primary text-sm px-2 h-9 text-foreground" onClick={() => navigate("/login")}>Log in</Button>
              <Button variant="ghost" className="hover:text-secondary text-sm px-2 h-9 text-foreground" onClick={() => navigate("/signup")}>Sign up</Button>
              <Button variant="ghost" className="hover:text-secondary text-sm px-2 h-9 text-foreground" onClick={() => navigate("/dashboard")}>Dashboard</Button>
              <Button variant="ghost" className="hover:text-primary text-sm px-2 h-9 text-foreground" onClick={() => navigate("/login")}>Mobile App</Button>
            </div>
          </div>
          <div className="mt-6 md:mt-8 text-center text-xs md:text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} <ShimmerLogo variant="footer" size="sm" />. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 