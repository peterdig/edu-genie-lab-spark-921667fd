
import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { LessonResult } from "@/types/lessons";
import { generateLesson } from "@/lib/api";
import { OpenRouterModel } from "@/lib/openrouter";

const formSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  gradeLevel: z.string().min(1, "Please select a grade level"),
  duration: z.string().min(1, "Please select a lesson duration"),
  model: z.enum(["qwen", "deepseek", "mistral"]),
  additionalNotes: z.string().optional(),
  includeAssessment: z.boolean().default(true),
  includeActivities: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface LessonGeneratorProps {
  onLessonGenerated: (lesson: LessonResult) => void;
}

export function LessonGenerator({ onLessonGenerated }: LessonGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      gradeLevel: "",
      duration: "30min",
      model: "qwen",
      additionalNotes: "",
      includeAssessment: true,
      includeActivities: true,
    },
  });

  async function onSubmit(data: FormData) {
    setIsGenerating(true);
    
    try {
      toast.info("Generating lesson plan...");
      
      // Call the API with the selected model
      const lesson = await generateLesson(data, data.model as OpenRouterModel);
      
      onLessonGenerated(lesson);
      toast.success("Lesson plan generated successfully!");
    } catch (error) {
      console.error("Failed to generate lesson:", error);
      toast.error("Failed to generate lesson plan. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Lesson Plan</CardTitle>
        <CardDescription>
          Provide details about your lesson, and our AI will generate a complete lesson plan.
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
                  <FormLabel>Lesson Topic</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Photosynthesis, World War II, Fractions..." {...field} />
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
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Duration</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="15min">15 minutes</SelectItem>
                        <SelectItem value="30min">30 minutes</SelectItem>
                        <SelectItem value="45min">45 minutes</SelectItem>
                        <SelectItem value="60min">60 minutes</SelectItem>
                        <SelectItem value="90min">90 minutes</SelectItem>
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
                        <RadioGroupItem value="qwen" id="lesson-qwen" />
                        <Label htmlFor="lesson-qwen">Qwen</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="deepseek" id="lesson-deepseek" />
                        <Label htmlFor="lesson-deepseek">DeepSeek</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mistral" id="lesson-mistral" />
                        <Label htmlFor="lesson-mistral">Mistral</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any specific requirements, learning objectives, or context..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="includeAssessment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Include Assessment</FormLabel>
                      <FormDescription>
                        Generate quiz questions and assessment tools
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Include Activities</FormLabel>
                      <FormDescription>
                        Generate interactive class activities
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
            
            <Button type="submit" className="w-full" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Generating Lesson Plan...
                </>
              ) : (
                "Generate Lesson Plan"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
