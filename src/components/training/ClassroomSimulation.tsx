import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Play, Pause, SkipForward, Users, MessageSquare, Settings } from "lucide-react";

interface Student {
  id: string;
  name: string;
  avatar?: string;
  personality: string;
  engagement: number;
  understanding: number;
}

interface SimulationScenario {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  students: Student[];
  events: {
    trigger: string;
    description: string;
    studentId?: string;
    options: {
      text: string;
      outcome: string;
      impact: {
        engagement?: number;
        understanding?: number;
      };
    }[];
  }[];
}

// Example scenario
const exampleScenario: SimulationScenario = {
  id: "scenario-1",
  title: "Managing Classroom Disruptions",
  description: "Practice handling common classroom disruptions while teaching a lesson on photosynthesis.",
  difficulty: "intermediate",
  students: [
    {
      id: "student-1",
      name: "Alex",
      personality: "Curious but easily distracted",
      engagement: 70,
      understanding: 60
    },
    {
      id: "student-2",
      name: "Jamie",
      personality: "Quiet and attentive",
      engagement: 90,
      understanding: 85
    },
    {
      id: "student-3",
      name: "Taylor",
      personality: "Disruptive when bored",
      engagement: 40,
      understanding: 65
    }
  ],
  events: [
    {
      trigger: "time-based",
      description: "Taylor starts talking to Alex during your explanation of chloroplasts.",
      studentId: "student-3",
      options: [
        {
          text: "Directly address Taylor and ask them to pay attention",
          outcome: "Taylor stops talking but seems disengaged for the rest of the lesson.",
          impact: { engagement: -10 }
        },
        {
          text: "Pause and ask the class a question about chloroplasts",
          outcome: "Taylor stops talking to answer the question and becomes more engaged.",
          impact: { engagement: +15, understanding: +10 }
        },
        {
          text: "Ignore the disruption and continue teaching",
          outcome: "The talking continues and other students start to get distracted.",
          impact: { engagement: -20, understanding: -15 }
        }
      ]
    }
  ]
};

export function ClassroomSimulation() {
  const [activeScenario, setActiveScenario] = useState<SimulationScenario>(exampleScenario);
  const [isRunning, setIsRunning] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(0);
  const [students, setStudents] = useState<Student[]>(exampleScenario.students);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const startSimulation = () => {
    setIsRunning(true);
    setCurrentEvent(0);
    setStudents(activeScenario.students);
    setFeedback(null);
    toast.info("Simulation started");
  };

  const pauseSimulation = () => {
    setIsRunning(false);
    toast.info("Simulation paused");
  };

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    
    const event = activeScenario.events[currentEvent];
    const option = event.options[optionIndex];
    
    // Update student metrics based on the selected option
    setStudents(prevStudents => 
      prevStudents.map(student => {
        if (student.id === event.studentId) {
          return {
            ...student,
            engagement: Math.max(0, Math.min(100, student.engagement + (option.impact.engagement || 0))),
            understanding: Math.max(0, Math.min(100, student.understanding + (option.impact.understanding || 0)))
          };
        }
        return student;
      })
    );
    
    setFeedback(option.outcome);
    
    // Move to next event after a delay
    setTimeout(() => {
      if (currentEvent < activeScenario.events.length - 1) {
        setCurrentEvent(prev => prev + 1);
        setSelectedOption(null);
        setFeedback(null);
      } else {
        setIsRunning(false);
        toast.success("Simulation completed!");
      }
    }, 3000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{activeScenario.title}</CardTitle>
            <CardDescription>{activeScenario.description}</CardDescription>
          </div>
          <Badge variant={
            activeScenario.difficulty === "beginner" ? "outline" :
            activeScenario.difficulty === "intermediate" ? "secondary" : "destructive"
          }>
            {activeScenario.difficulty.charAt(0).toUpperCase() + activeScenario.difficulty.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="simulation" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="simulation">Simulation</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="simulation" className="space-y-4">
            {isRunning && currentEvent < activeScenario.events.length ? (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-md">
                  <p className="font-medium">Event:</p>
                  <p>{activeScenario.events[currentEvent].description}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="font-medium">How do you respond?</p>
                  {activeScenario.events[currentEvent].options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedOption === index ? "default" : "outline"}
                      className="w-full justify-start text-left h-auto py-3 px-4"
                      onClick={() => handleOptionSelect(index)}
                      disabled={selectedOption !== null}
                    >
                      {option.text}
                    </Button>
                  ))}
                </div>
                
                {feedback && (
                  <div className="bg-muted p-4 rounded-md border-l-4 border-primary">
                    <p className="font-medium">Outcome:</p>
                    <p>{feedback}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Users className="h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground">Start the simulation to begin the classroom scenario</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="students">
            <div className="space-y-4">
              {students.map(student => (
                <div key={student.id} className="flex items-start space-x-4 p-4 border rounded-md">
                  <Avatar>
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    {student.avatar && <AvatarImage src={student.avatar} />}
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.personality}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Engagement</span>
                        <span>{student.engagement}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2" 
                          style={{ width: `${student.engagement}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Understanding</span>
                        <span>{student.understanding}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-secondary rounded-full h-2" 
                          style={{ width: `${student.understanding}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Configure simulation parameters and difficulty</p>
              <Button variant="outline" className="w-full" disabled>
                <Settings className="h-4 w-4 mr-2" />
                Load Different Scenario
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={isRunning ? "outline" : "default"}
            onClick={isRunning ? pauseSimulation : startSimulation}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start
              </>
            )}
          </Button>
          
          <Button variant="outline" disabled={!isRunning}>
            <SkipForward className="h-4 w-4 mr-2" />
            Skip
          </Button>
        </div>
        
        <Button variant="ghost" size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          Feedback
        </Button>
      </CardFooter>
    </Card>
  );
}