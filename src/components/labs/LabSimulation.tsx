import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lab } from "@/types/labs";
import { ArrowLeft, ExternalLink, Volume2, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LabSimulationProps {
  lab: Lab;
}

export function LabSimulation({ lab }: LabSimulationProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isNarrating, setIsNarrating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("sim");

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleNarration = () => {
    setIsNarrating(true);
    toast.info("Starting lab narration...");
    
    // Simulate narration
    setTimeout(() => {
      setIsNarrating(false);
      toast.success("Narration completed");
    }, 5000);
  };

  const toggleStepCompletion = (stepIndex: number) => {
    setCompletedSteps(prev => {
      if (prev.includes(stepIndex)) {
        return prev.filter(idx => idx !== stepIndex);
      } else {
        return [...prev, stepIndex];
      }
    });
  };

  // Show tabs for mobile view to switch between simulation and guide
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="space-y-4">
      {/* Mobile tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="md:hidden mb-2">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1">
          <TabsTrigger value="sim" className="text-xs py-1.5 px-2.5 h-8">Simulation</TabsTrigger>
          <TabsTrigger value="guide" className="text-xs py-1.5 px-2.5 h-8">Lab Guide</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        <div className={cn(
          "md:col-span-2",
          activeTab !== "sim" && "hidden md:block"
        )}>
          <Card className="h-full flex flex-col border border-border/50">
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => navigate('/labs')} className="h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-base sm:text-xl">{lab.title}</CardTitle>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                  <Badge variant="outline" className="text-xs">
                    {lab.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {lab.gradeLevel}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 text-xs h-7 sm:h-8"
                    onClick={handleNarration}
                    disabled={isNarrating}
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>{isNarrating ? "Narrating..." : "Narrate"}</span>
                  </Button>
                </div>
              </div>
              <CardDescription className="text-xs sm:text-sm mt-2 line-clamp-2 sm:line-clamp-none">{lab.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow p-0 px-3 sm:px-6">
              <div className="w-full h-[250px] sm:h-[400px] bg-muted rounded-md overflow-hidden relative">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mb-3 sm:mb-4"></div>
                      <p className="text-muted-foreground text-sm">Loading simulation...</p>
                    </div>
                  </div>
                ) : (
                  <iframe 
                    src={lab.url} 
                    title={lab.title}
                    className="w-full h-full border-0"
                    allowFullScreen
                  ></iframe>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-3 sm:pt-6 px-3 sm:px-6 pb-3 sm:pb-6">
              <Button 
                variant="outline" 
                onClick={() => navigate("/labs")} 
                className="text-xs sm:text-sm h-8"
              >
                Back to Labs
              </Button>
              <Button 
                className="flex items-center gap-1 text-xs sm:text-sm h-8"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Open in Full Screen</span>
                <span className="sm:hidden">Full Screen</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className={cn(
          "",
          activeTab !== "guide" && "hidden md:block"
        )}>
          <Card className="h-full flex flex-col border border-border/50">
            <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2">
              <CardTitle className="text-base sm:text-lg">Lab Guide</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-0">
              <Tabs defaultValue="instructions" className="w-full">
                <div className="px-3 sm:px-4">
                  <TabsList className="grid grid-cols-2 bg-muted/80 w-full h-8">
                    <TabsTrigger value="instructions" className="text-xs py-1.5">Instructions</TabsTrigger>
                    <TabsTrigger value="questions" className="text-xs py-1.5">Questions</TabsTrigger>
                  </TabsList>
                </div>
                
                <ScrollArea className="h-[300px] sm:h-[500px]">
                  <TabsContent value="instructions" className="p-3 sm:p-4 pt-3 m-0">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="bg-muted/30 rounded-lg p-3">
                        <h4 className="font-medium mb-1.5 text-sm sm:text-base">Learning Objectives</h4>
                        <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-muted-foreground">
                          {lab.objectives.map((objective, i) => (
                            <li key={i}>{objective}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1.5 text-sm sm:text-base">Steps</h4>
                        <Accordion type="single" collapsible className="w-full">
                          {lab.steps.map((step, i) => (
                            <AccordionItem key={i} value={`step-${i}`} className={cn(
                              "border rounded-md mb-2 overflow-hidden",
                              "bg-muted/20",
                              completedSteps.includes(i) && "border-green-500/30 bg-green-50/10"
                            )}>
                              <AccordionTrigger className="text-xs sm:text-sm px-3 hover:bg-muted/30 py-2">
                                <div className="flex items-center gap-1.5">
                                  {completedSteps.includes(i) && (
                                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                  )}
                                  <span>Step {i + 1}: {step.title}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="text-xs sm:text-sm text-muted-foreground px-3 pb-3">
                                <div className="mb-2">{step.description}</div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className={cn(
                                    "text-xs h-7",
                                    completedSteps.includes(i) 
                                      ? "bg-green-500/10 hover:bg-green-500/20 text-green-600" 
                                      : "bg-muted/30"
                                  )}
                                  onClick={() => toggleStepCompletion(i)}
                                >
                                  {completedSteps.includes(i) ? "Mark as Incomplete" : "Mark as Complete"}
                                </Button>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="questions" className="p-3 sm:p-4 pt-3 m-0">
                    <div className="space-y-4 sm:space-y-6">
                      {lab.questions.map((question, i) => (
                        <div key={i} className="border rounded-md p-3 bg-muted/20 hover:bg-muted/30 transition-colors">
                          <p className="font-medium mb-2 text-xs sm:text-sm">Question {i + 1}:</p>
                          <p className="mb-2 text-xs text-muted-foreground">{question.text}</p>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            className="text-xs h-7"
                          >
                            View Hint
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
