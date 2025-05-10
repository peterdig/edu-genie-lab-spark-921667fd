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
import { Loader } from "lucide-react";
import { generateLab } from "@/lib/api";
import { Lab } from "@/types/labs";

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
    <Card>
      <CardHeader>
        <CardTitle>Create a Virtual Lab</CardTitle>
        <CardDescription>
          Provide details about your lab, and our AI will generate an interactive simulation.
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
                  <FormLabel>Lab Topic</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Circuit Building, Chemical Reactions, Cell Structure..." {...field} />
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
                          <RadioGroupItem value="qwen" id="qwen" />
                          <Label htmlFor="qwen">Qwen</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="deepseek" id="deepseek" />
                          <Label htmlFor="deepseek">DeepSeek</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mistral" id="mistral" />
                          <Label htmlFor="mistral">Mistral</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
            
            <Button type="submit" className="w-full" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Generating Lab Simulation...
                </>
              ) : (
                "Generate Lab Simulation"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
