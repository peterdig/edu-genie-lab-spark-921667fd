
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lab } from "@/types/labs";
import { ArrowLeft, ExternalLink, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface LabSimulationProps {
  lab: Lab;
}

export function LabSimulation({ lab }: LabSimulationProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isNarrating, setIsNarrating] = useState(false);

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

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate('/labs')}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <CardTitle>{lab.title}</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={handleNarration}
                disabled={isNarrating}
              >
                <Volume2 className="h-4 w-4" />
                <span>{isNarrating ? "Narrating..." : "Narrate Lab"}</span>
              </Button>
            </div>
            <CardDescription>{lab.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="w-full h-[400px] bg-muted rounded-md overflow-hidden relative">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">Loading simulation...</p>
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
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline" onClick={() => navigate("/labs")}>
              Back to Labs
            </Button>
            <Button className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              <span>Open in Full Screen</span>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div>
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Lab Guide</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <Tabs defaultValue="instructions" className="w-full">
              <TabsList className="grid grid-cols-2 m-4">
                <TabsTrigger value="instructions">Instructions</TabsTrigger>
                <TabsTrigger value="questions">Questions</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="h-[500px]">
                <TabsContent value="instructions" className="p-4 pt-0 m-0">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Learning Objectives</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {lab.objectives.map((objective, i) => (
                          <li key={i}>{objective}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Steps</h4>
                      <Accordion type="single" collapsible className="w-full">
                        {lab.steps.map((step, i) => (
                          <AccordionItem key={i} value={`step-${i}`}>
                            <AccordionTrigger className="text-sm">
                              Step {i + 1}: {step.title}
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground">
                              {step.description}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="questions" className="p-4 pt-0 m-0">
                  <div className="space-y-6">
                    {lab.questions.map((question, i) => (
                      <div key={i} className="border rounded-md p-4">
                        <p className="font-medium mb-3">Question {i + 1}:</p>
                        <p className="mb-3 text-sm text-muted-foreground">{question.text}</p>
                        <Button variant="secondary" size="sm">View Hint</Button>
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
  );
}
