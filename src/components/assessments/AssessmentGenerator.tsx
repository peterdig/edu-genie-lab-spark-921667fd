
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
import { Loader } from "lucide-react";
import { AssessmentResult } from "@/types/assessments";
import { generateAssessment } from "@/lib/api";
import { OpenRouterModel } from "@/lib/openrouter";

const questionTypes = [
  { id: "multiple-choice", label: "Multiple Choice" },
  { id: "true-false", label: "True/False" },
  { id: "short-answer", label: "Short Answer" },
  { id: "essay", label: "Essay" },
] as const;

const formSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      gradeLevel: "",
      numberOfQuestions: "5",
      questionTypes: ["multiple-choice"],
      model: "qwen",
      additionalInstructions: "",
      bloomsLevels: ["remembering", "understanding"],
    },
  });

  async function onSubmit(data: FormData) {
    setIsGenerating(true);
    
    try {
      toast.info("Generating assessment...");
      
      // Call the API with the selected model
      const assessment = await generateAssessment(data, data.model as OpenRouterModel);
      
      onAssessmentGenerated(assessment);
      toast.success("Assessment generated successfully!");
    } catch (error) {
      console.error("Failed to generate assessment:", error);
      toast.error("Failed to generate assessment. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an Assessment</CardTitle>
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
                    <Input placeholder="e.g. Cell Biology, American Revolution, Algebra..." {...field} />
                  </FormControl>
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
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                        <SelectTrigger>
                          <SelectValue placeholder="Select number" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                <FormItem>
                  <FormLabel>AI Model</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="qwen" id="assessment-qwen" />
                        <Label htmlFor="assessment-qwen">Qwen</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="deepseek" id="assessment-deepseek" />
                        <Label htmlFor="assessment-deepseek">DeepSeek</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mistral" id="assessment-mistral" />
                        <Label htmlFor="assessment-mistral">Mistral</Label>
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
                  <div className="mb-4">
                    <FormLabel>Question Types</FormLabel>
                    <FormDescription>
                      Select the types of questions to include.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {questionTypes.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="questionTypes"
                        render={({ field }) => (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
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
                            <FormLabel className="font-normal">
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
                  <div className="mb-4">
                    <FormLabel>Bloom's Taxonomy Levels</FormLabel>
                    <FormDescription>
                      Select the cognitive levels to target.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                            className="flex flex-row items-start space-x-3 space-y-0"
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
                            <FormLabel className="font-normal">
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
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Generating Assessment...
                </>
              ) : (
                "Generate Assessment"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
