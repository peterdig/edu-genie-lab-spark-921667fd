import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertCircle, HelpCircle, Loader, Zap, Info, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { LessonResult } from "@/types/lessons";
import { generateLesson } from "@/lib/api";
import { OpenRouterModel, fetchAvailableModels, fetchRecommendedModels, checkApiStatus, getModelStats } from "@/lib/openrouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Updated schema with string model ID
const formSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  gradeLevel: z.string().min(1, "Please select a grade level"),
  duration: z.string().min(1, "Please select a lesson duration"),
  model: z.string().min(1, "Please select a model"),
  additionalNotes: z.string().optional(),
  includeAssessment: z.boolean().default(true),
  includeActivities: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface LessonGeneratorProps {
  onGenerate: (lesson: LessonResult) => void;
}

export function LessonGenerator({ onGenerate }: LessonGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retries, setRetries] = useState(0);
  const [maxRetries] = useState(3);
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
  const [recommendedModels, setRecommendedModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelUsage, setModelUsage] = useState<Record<string, any>>({});
  const [modelStatus, setModelStatus] = useState<Record<string, 'available' | 'limited' | 'unavailable'>>({});

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      gradeLevel: "6-8", // Default to middle school grade
      duration: "30min",
      model: "meta-llama/llama-4-scout:free", // Will be overridden by useEffect if needed
      additionalNotes: "",
      includeAssessment: true,
      includeActivities: true,
    },
  });

  // Load models from API
  useEffect(() => {
    async function loadModels() {
      setIsLoadingModels(true);
      try {
        const [models, recommended, stats] = await Promise.all([
          fetchAvailableModels(),
          fetchRecommendedModels(),
          getModelStats()
        ]);
        
        setAvailableModels(models);
        setRecommendedModels(recommended);
        
        // Track model usage
        if (stats && stats.usage) {
          setModelUsage(stats.usage);
        }
        
        // Determine model status
        const statusMap: Record<string, 'available' | 'limited' | 'unavailable'> = {};
        models.forEach(model => {
          const modelId = model.id;
          const usage = stats?.usage?.[modelId];
          
          if (usage && usage.count >= 10) {
            statusMap[modelId] = 'limited';
          } else if (stats?.errors?.[modelId] && stats.errors[modelId].count >= 3) {
            statusMap[modelId] = 'unavailable';
          } else {
            statusMap[modelId] = 'available';
          }
        });
        setModelStatus(statusMap);
        
        // Set default model to first recommended model
        if (recommended.length > 0) {
          const defaultModel = recommended[0];
          form.setValue("model", defaultModel);
          
          // Save to localStorage
          localStorage.setItem("defaultModel", defaultModel);
        } else if (models.length > 0) {
          // Fallback to first available model
          form.setValue("model", models[0].id);
        }
      } catch (error) {
        console.error("Failed to load models:", error);
        toast.error("Failed to load AI models. Using default models.");
      } finally {
        setIsLoadingModels(false);
      }
    }
    
    loadModels();
  }, [form]);

  // Load default model from localStorage if available
  useEffect(() => {
    const savedModel = localStorage.getItem("defaultModel");
    if (savedModel) {
      form.setValue("model", savedModel);
    }
  }, [form]);

  // Refresh model status periodically
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const stats = await getModelStats();
        if (stats && stats.usage) {
          setModelUsage(stats.usage);
          
          // Update model status
          const statusMap = {...modelStatus};
          Object.keys(stats.usage).forEach(modelId => {
            const usage = stats.usage[modelId];
            if (usage.count >= 10) {
              statusMap[modelId] = 'limited';
            }
          });
          
          Object.keys(stats.errors || {}).forEach(modelId => {
            const errors = stats.errors[modelId];
            if (errors.count >= 3) {
              statusMap[modelId] = 'unavailable';
            }
          });
          
          setModelStatus(statusMap);
        }
      } catch (error) {
        console.error("Failed to refresh model status:", error);
      }
    }, 60000); // Every minute
    
    return () => clearInterval(intervalId);
  }, [modelStatus]);

  async function onSubmit(data: FormData) {
    setIsGenerating(true);
    setError(null);
    
    try {
      if (retries > 0) {
        toast.info(`Retrying with ${data.model} (Attempt ${retries + 1} of ${maxRetries})...`);
      } else {
        toast.info(`Generating lesson plan with ${data.model}...`);
      }
      
      // Call the API with the selected model
      const lesson = await generateLesson(data, data.model);
      
      // AI validation already done in the API layer, but double-check
      // critical fields here as well for defense in depth
      if (!lesson || !lesson.title || !lesson.plan) {
        throw new Error("Received incomplete lesson plan from AI. Please try again.");
      }
      
      setRetries(0);
      onGenerate(lesson);
      toast.success("Lesson plan generated successfully!");
    } catch (error) {
      console.error("Failed to generate lesson:", error);
      
      // Format a user-friendly error message
      let errorMessage = "Unknown error occurred";
      
      if (error instanceof Error) {
        // Clean up common API error messages
        errorMessage = error.message
          .replace("Error: ", "")
          .replace(/^\d{3} /, ""); // Remove status code prefix
        
        // Add more context for network errors
        if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
          errorMessage = "Network error - Please check your internet connection and try again.";
        }
        
        // Add more context for timeout errors
        if (error.message.includes("timeout") || error.message.includes("Timeout")) {
          errorMessage = "The AI is taking too long to respond. Please try again or use a different model.";
        }
        
        // Handle rate limits
        if (error.message.includes("rate limit") || error.message.includes("429")) {
          errorMessage = "Rate limit exceeded. Please wait a moment before trying again or select a different model.";
        }
      }
      
      setError(errorMessage);
      
      // Only auto-retry if we haven't reached max retries
      if (retries < maxRetries) {
        setRetries(prev => prev + 1);
        
        // Get a different model from our recommended models
        try {
          const currentIndex = recommendedModels.indexOf(form.getValues("model"));
          const nextIndex = (currentIndex + 1) % recommendedModels.length;
          const nextModel = recommendedModels[nextIndex];
          
          form.setValue("model", nextModel);
          
          // Auto-retry with next model after a short delay
          setTimeout(() => {
            form.handleSubmit(onSubmit)();
          }, 1500);
          
          toast.error(`Failed with current model. Automatically trying ${nextModel} instead...`, {
            duration: 4000
          });
        } catch (e) {
          console.error("Error finding next model:", e);
          setIsGenerating(false);
        }
      } else {
        toast.error("Failed to generate lesson plan after multiple attempts. Please try again later.", {
          duration: 5000
        });
        setIsGenerating(false);
        setRetries(0);
      }
    }
  }

  const handleRetry = () => {
    setRetries(retries + 1);
    
    // Switch to a different model for manual retry
    try {
      const currentIndex = recommendedModels.indexOf(form.getValues("model"));
      const nextIndex = (currentIndex + 1) % recommendedModels.length;
      const nextModel = recommendedModels[nextIndex];
      
      form.setValue("model", nextModel);
      form.handleSubmit(onSubmit)();
    } catch (e) {
      console.error("Error finding next model:", e);
      setIsGenerating(false);
    }
  };

  // Organize models into categories
  const getModelByType = (type: string) => {
    const filtered = availableModels.filter(model => {
      const name = model.name.toLowerCase();
      return name.includes(type.toLowerCase());
    });
    // Return a string for the model name, not the array of models
    return filtered.length > 0 ? filtered[0].name : type.split('/')[1] || type;
  };

  // Get status badge for model
  const getModelStatusBadge = (modelId: string) => {
    const status = modelStatus[modelId] || 'available';
    
    switch (status) {
      case 'available':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" /> Available
        </Badge>;
      case 'limited':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" /> Rate Limited
        </Badge>;
      case 'unavailable':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" /> Unavailable
        </Badge>;
      default:
        return null;
    }
  };

  // Format context length for display
  const formatContextLength = (length: number) => {
    if (length >= 1000000) {
      return `${(length / 1000000).toFixed(1)}M tokens`;
    } else if (length >= 1000) {
      return `${(length / 1000).toFixed(0)}K tokens`;
    } else {
      return `${length} tokens`;
    }
  };

  // Add keyboard shortcut handler for this component
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        // Only handle shortcuts when we're not generating content
        if (!isGenerating) {
          if (e.key === 'g') {
            // Alt+G to generate lesson
            form.handleSubmit(onSubmit)();
          } else if (e.key === 'm') {
            // Alt+M to focus model selector
            const modelSelector = document.querySelector('[name="model"]');
            if (modelSelector) {
              (modelSelector as HTMLElement).focus();
            }
          } else if (e.key === 'c') {
            // Alt+C to clear/reset form
            form.reset();
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [form, isGenerating, onSubmit]);

  return (
    <Card className="animate-fade-in border-primary/10 hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span>Create a Lesson Plan</span>
          <Badge variant="outline" className="ml-2 font-normal">
            Alt+G to generate
          </Badge>
        </CardTitle>
        <CardDescription>
          Provide details about your lesson, and our AI will generate a complete lesson plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6 animate-pulse">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                disabled={isGenerating || retries >= maxRetries}
                className="whitespace-nowrap"
              >
                Try with a different model
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Topic</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Photosynthesis, World War II, Fractions..." 
                      {...field} 
                      className="focus-visible:ring-primary/50"
                      autoFocus 
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the main topic for your lesson plan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="gradeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="focus-visible:ring-primary/50">
                          <SelectValue placeholder="Select a grade level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" className="max-h-[200px]">
                        <SelectItem value="K-2">Elementary (K-2)</SelectItem>
                        <SelectItem value="3-5">Elementary (3-5)</SelectItem>
                        <SelectItem value="6-8">Middle School (6-8)</SelectItem>
                        <SelectItem value="9-12">High School (9-12)</SelectItem>
                        <SelectItem value="college">College</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the grade level for your students
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Duration</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="focus-visible:ring-primary/50">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        <SelectItem value="15min">15 minutes</SelectItem>
                        <SelectItem value="30min">30 minutes</SelectItem>
                        <SelectItem value="45min">45 minutes</SelectItem>
                        <SelectItem value="60min">60 minutes</SelectItem>
                        <SelectItem value="90min">90 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How long will this lesson take?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      AI Model
                      <Badge variant="outline" className="ml-2 font-normal text-xs">
                        Alt+M to focus
                      </Badge>
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5" type="button">
                            <HelpCircle className="h-4 w-4" />
                            <span className="sr-only">AI Model info</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm" align="end">
                          <p>Select the AI model to use for generation. Models with larger context windows can generate more detailed content.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Save to localStorage
                      localStorage.setItem("defaultModel", value);
                    }}
                    defaultValue={field.value}
                    disabled={isLoadingModels}
                  >
                    <FormControl>
                      <SelectTrigger className="focus-visible:ring-primary/50">
                        {isLoadingModels ? (
                          <div className="flex items-center">
                            <Loader className="h-3.5 w-3.5 mr-2 animate-spin" />
                            <span>Loading models...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Select a model" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[240px]" position="popper">
                      {recommendedModels.map(modelId => (
                        <SelectItem 
                          key={modelId} 
                          value={modelId}
                          disabled={modelStatus[modelId] === 'unavailable'}
                          className={modelStatus[modelId] === 'unavailable' ? 'opacity-50' : ''}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{modelId.split('/')[1]}</span>
                              {getModelStatusBadge(modelId)}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select an AI model to generate your lesson plan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any specific requirements or topics to focus on?" 
                      className="min-h-[100px] focus-visible:ring-primary/50" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Provide any specific requirements or focus areas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <FormField
                control={form.control}
                name="includeAssessment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm hover:border-primary/30 transition-colors">
                    <div className="space-y-0.5">
                      <FormLabel>Include Assessment</FormLabel>
                      <FormDescription>
                        Generate assessment questions
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="includeActivities"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm hover:border-primary/30 transition-colors">
                    <div className="space-y-0.5">
                      <FormLabel>Include Activities</FormLabel>
                      <FormDescription>
                        Generate in-class activities
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => form.reset()}
                className="text-xs gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
                Reset Form
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type="submit" 
                      disabled={isGenerating} 
                      className="min-w-[140px] relative font-medium"
                    >
                      {isGenerating ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          <span>Generating...</span>
                          <span className="absolute -bottom-5 right-0 text-[10px] text-muted-foreground">
                            {retries > 0 ? `Attempt ${retries+1}/${maxRetries+1}` : ''}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>Generate Lesson</span>
                          <span className="absolute -bottom-5 right-0 text-[10px] text-muted-foreground">Alt+G</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" align="center">
                    This will generate a complete lesson plan
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
