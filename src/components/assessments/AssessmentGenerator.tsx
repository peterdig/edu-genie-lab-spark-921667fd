import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader, AlertCircle } from "lucide-react";
import { AssessmentResult } from "@/types/assessments";
import { generateAssessment } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const questionTypes = [
  { id: "multiple-choice", label: "Multiple Choice" },
  { id: "true-false", label: "True/False" },
  { id: "short-answer", label: "Short Answer" },
  { id: "essay", label: "Essay" },
] as const;

const formSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  subject: z.string().min(1, "Please select a subject"),
  gradeLevel: z.string().min(1, "Please select a grade level"),
  numberOfQuestions: z.string().min(1, "Please select number of questions"),
  questionTypes: z.array(z.string()).min(1, "Select at least one question type"),
  model: z.enum(["qwen", "deepseek", "mistral"]),
  additionalInstructions: z.string().optional(),
  bloomsLevels: z.array(z.string()).min(1, "Select at least one Bloom's level"),
});

type FormData = z.infer<typeof formSchema>;

interface AssessmentGeneratorProps {
  onAssessmentGenerated: (assessment: AssessmentResult) => void;
}

export function AssessmentGenerator({ onAssessmentGenerated }: AssessmentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      subject: "",
      gradeLevel: "",
      numberOfQuestions: "5",
      questionTypes: ["multiple-choice"],
      model: "deepseek",
      additionalInstructions: "Ensure all questions have clear and correct answers",
      bloomsLevels: ["remembering", "understanding"],
    },
  });

  async function onSubmit(data: FormData) {
    setIsGenerating(true);
    setError(null);
    
    try {
      toast.info(`Generating assessment with ${data.model}...`);
      
      // Map the model selection to the actual model ID expected by the API
      const modelIdMap: Record<string, string> = {
        'qwen': 'qwen/qwen-14b',
        'deepseek': 'deepseek/deepseek-chat:free',
        'mistral': 'mistralai/mistral-7b-instruct:free'
      };
      
      const modelId = modelIdMap[data.model] || 'meta-llama/llama-3.1-8b-instruct:free';
      
      const assessment = await generateAssessment({
        ...data,
        model: modelId,
        // Convert array values to proper format
        questionTypes: data.questionTypes,
        bloomsLevels: data.bloomsLevels
      }, modelId);
      
      toast.success("Assessment generated successfully!");
      onAssessmentGenerated(assessment);
    } catch (error) {
      console.error("Error generating assessment:", error);
      
      let errorMessage = "Unknown error occurred";
      
      if (error instanceof Error) {
        // Clean up and simplify the error message
        const errorParts = error.message.split(':');
        const simplifiedError = errorParts[errorParts.length - 1].trim();
        
        if (simplifiedError.includes("model unavailable") || simplifiedError.includes("experimental")) {
          errorMessage = "The selected model is currently unavailable. Please select a different model.";
        } else if (simplifiedError.includes("timeout") || simplifiedError.includes("Timeout")) {
          errorMessage = "The AI is taking too long to respond. Please try again or use a different model.";
        } else if (simplifiedError.includes("NetworkError") || simplifiedError.includes("Failed to fetch")) {
          errorMessage = "Network error - Please check your internet connection and try again.";
        } else {
          errorMessage = simplifiedError.length > 100 ? 
            simplifiedError.substring(0, 100) + "..." : 
            simplifiedError;
        }
      }
      
      setError(errorMessage);
      setIsGenerating(false);
    }
  }

  return (
    <Card className="border-primary/10 shadow-sm transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Create an Assessment</CardTitle>
        <CardDescription>
          Provide details about your assessment, and our AI will generate questions and materials.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment Topic</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Cell Biology, American Revolution, Algebra..." 
                      {...field} 
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        <SelectItem value="Math">Math</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Languages">Languages</SelectItem>
                        <SelectItem value="Arts">Arts</SelectItem>
                        <SelectItem value="Physical Education">Physical Education</SelectItem>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gradeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select grade level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        <SelectItem value="k-2">K-2</SelectItem>
                        <SelectItem value="3-5">3-5</SelectItem>
                        <SelectItem value="6-8">6-8</SelectItem>
                        <SelectItem value="9-12">9-12</SelectItem>
                        <SelectItem value="college">College</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="numberOfQuestions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Questions</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select number" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        <SelectItem value="5">5 questions</SelectItem>
                        <SelectItem value="10">10 questions</SelectItem>
                        <SelectItem value="15">15 questions</SelectItem>
                        <SelectItem value="20">20 questions</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>AI Model</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-2"
                    >
                      <div className="flex items-center space-x-2 rounded-md border border-muted p-2 hover:bg-muted/50">
                        <RadioGroupItem value="qwen" id="assessment-qwen" />
                        <Label htmlFor="assessment-qwen" className="cursor-pointer">Qwen</Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-md border border-muted p-2 hover:bg-muted/50">
                        <RadioGroupItem value="deepseek" id="assessment-deepseek" />
                        <Label htmlFor="assessment-deepseek" className="cursor-pointer">DeepSeek</Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-md border border-muted p-2 hover:bg-muted/50">
                        <RadioGroupItem value="mistral" id="assessment-mistral" />
                        <Label htmlFor="assessment-mistral" className="cursor-pointer">Mistral</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="questionTypes"
              render={() => (
                <FormItem>
                  <div className="mb-3">
                    <FormLabel>Question Types</FormLabel>
                    <FormDescription>
                      Select the types of questions to include.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {questionTypes.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="questionTypes"
                        render={({ field }) => (
                          <FormItem
                            key={item.id}
                            className="flex items-center space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/20"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bloomsLevels"
              render={() => (
                <FormItem>
                  <div className="mb-3">
                    <FormLabel>Bloom's Taxonomy Levels</FormLabel>
                    <FormDescription>
                      Select the cognitive levels to target.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { id: "remembering", label: "Remembering" },
                      { id: "understanding", label: "Understanding" },
                      { id: "applying", label: "Applying" },
                      { id: "analyzing", label: "Analyzing" },
                      { id: "evaluating", label: "Evaluating" },
                      { id: "creating", label: "Creating" },
                    ].map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="bloomsLevels"
                        render={({ field }) => (
                          <FormItem
                            key={item.id}
                            className="flex items-start space-x-3 space-y-0 rounded-md border p-2 hover:bg-muted/20"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm cursor-pointer">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="additionalInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any specific requirements or context..."
                      className="min-h-[100px] w-full resize-y"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full sm:w-auto sm:min-w-[200px] relative group" 
                disabled={isGenerating}
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    <span>Generating Assessment...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Assessment</span>
                    <span className="absolute -bottom-5 right-2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Alt+G</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
