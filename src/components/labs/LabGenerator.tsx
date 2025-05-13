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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader, Sparkles } from "lucide-react";
import { generateLab } from "@/lib/api";
import { Lab } from "@/types/labs";
import { TextContentWithSpeech } from "@/components/accessibility/ContentWithSpeech";
import { useAccessibility } from "@/contexts/AccessibilityContext";

const formSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  gradeLevel: z.string().min(1, "Please select a grade level"),
  model: z.enum(["qwen", "deepseek", "mistral"]),
  additionalNotes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface LabGeneratorProps {
  onLabGenerated: (lab: Lab) => void;
}

export function LabGenerator({ onLabGenerated }: LabGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { settings } = useAccessibility();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      gradeLevel: "",
      model: "qwen",
      additionalNotes: "",
    },
  });

  async function onSubmit(data: FormData) {
    setIsGenerating(true);
    
    try {
      toast.info("Generating lab simulation...");
      
      const lab = await generateLab(data, data.model);
      
      onLabGenerated(lab);
      toast.success("Lab simulation generated successfully!");
    } catch (error) {
      console.error("Failed to generate lab:", error);
      toast.error("Failed to generate lab simulation. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Card className="border border-border/50">
      <CardHeader className="relative px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
        <div className="absolute top-4 right-4 text-primary/50">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <CardTitle className="text-lg sm:text-xl">Create a Virtual Lab</CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-1">
          Provide details about your lab, and our AI will generate an interactive simulation.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        {settings.textToSpeechEnabled && (
          <TextContentWithSpeech
            heading="Create a Virtual Lab"
            content="Fill out the form below to create a custom virtual lab. Provide a topic, select the grade level, choose an AI model, and add any additional notes. Our AI will generate an interactive lab simulation based on your specifications."
            className="mb-4"
          />
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm">Lab Topic</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Circuit Building, Chemical Reactions, Cell Structure..." 
                      {...field}
                      className="h-9 text-xs sm:text-sm"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="gradeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Grade Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-xs sm:text-sm">
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
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">AI Model</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-3 gap-1 sm:gap-4"
                      >
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <RadioGroupItem value="qwen" id="qwen" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <Label htmlFor="qwen" className="cursor-pointer text-xs sm:text-sm">Qwen</Label>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <RadioGroupItem value="deepseek" id="deepseek" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <Label htmlFor="deepseek" className="cursor-pointer text-xs sm:text-sm">DeepSeek</Label>
                        </div>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <RadioGroupItem value="mistral" id="mistral" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <Label htmlFor="mistral" className="cursor-pointer text-xs sm:text-sm">Mistral</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm">Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any specific requirements, learning objectives, or context..."
                      className="min-h-[80px] sm:min-h-[100px] text-xs sm:text-sm"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full h-9 sm:h-10 text-xs sm:text-sm" 
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Generating Lab Simulation...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Generate Lab Simulation
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
