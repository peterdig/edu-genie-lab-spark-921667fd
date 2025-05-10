import { AssessmentResult } from "@/types/assessments";
import { LessonResult } from "@/types/lessons";
import { Lab } from "@/types/labs";
import { toast } from "sonner";
import { 
  generateLesson as backendGenerateLesson,
  generateAssessment as backendGenerateAssessment,
  generateLab as backendGenerateLab,
  generateTeachingTip as backendGenerateTeachingTip,
  getNextRecommendedModel
} from "./openrouter";

export async function generateLesson(data: any, modelId: string): Promise<LessonResult> {
  toast.info(`Generating lesson plan with ${modelId}...`);
  
  try {
    // Call the backend API through our openrouter integration
    return await backendGenerateLesson(data, modelId);
  } catch (error) {
    console.error("Failed to generate lesson:", error);
    toast.error(`Failed to generate lesson plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // If we've reached a retry limit, throw the error to be handled by the component
    if (data._retryCount && data._retryCount >= 2) {
      throw error;
    }
    
    // Try with a different model
    try {
      const nextModelId = await getNextRecommendedModel(modelId);
      
      if (nextModelId !== modelId) {
        toast.info(`Automatically retrying with ${nextModelId}...`);
        return await generateLesson({
          ...data,
          _retryCount: (data._retryCount || 0) + 1
        }, nextModelId);
      }
    } catch (retryError) {
      console.error("Failed to retry with different model:", retryError);
    }
    
    // Return a minimal valid lesson plan as a fallback
    return {
      id: `lesson-${Date.now()}`,
      title: `${data.topic} - Draft Lesson Plan`,
      gradeLevel: data.gradeLevel,
      subject: data.topic.split(" ")[0],
      duration: data.duration,
      overview: "This is a draft lesson plan. The AI encountered an error during generation.",
      objectives: ["Review and edit this draft lesson"],
      materials: ["Materials to be added"],
      plan: "The AI was unable to generate a complete lesson plan. Please try again or edit this draft manually.",
      assessment: "Assessment to be added",
      questions: [],
      tags: [data.topic.split(" ")[0], data.gradeLevel, "Draft"],
      createdAt: new Date().toISOString()
    };
  }
}

export async function generateAssessment(data: any, modelId: string): Promise<AssessmentResult> {
  toast.info(`Generating assessment with ${modelId}...`);
  
  try {
    return await backendGenerateAssessment(data, modelId);
  } catch (error) {
    console.error("Failed to generate assessment:", error);
    toast.error(`Failed to generate assessment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // If we've reached a retry limit, throw the error to be handled by the component
    if (data._retryCount && data._retryCount >= 2) {
      throw error;
    }
    
    // Try with a different model
    try {
      const nextModelId = await getNextRecommendedModel(modelId);
      
      if (nextModelId !== modelId) {
        toast.info(`Automatically retrying with ${nextModelId}...`);
        return await generateAssessment({
          ...data,
          _retryCount: (data._retryCount || 0) + 1
        }, nextModelId);
      }
    } catch (retryError) {
      console.error("Failed to retry with different model:", retryError);
    }
    
    throw error;
  }
}

export async function generateLab(data: any, modelId: string): Promise<Lab> {
  toast.info(`Generating lab simulation with ${modelId}...`);
  
  try {
    return await backendGenerateLab(data, modelId);
  } catch (error) {
    console.error("Failed to generate lab:", error);
    toast.error(`Failed to generate lab: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // If we've reached a retry limit, throw the error to be handled by the component
    if (data._retryCount && data._retryCount >= 2) {
      throw error;
    }
    
    // Try with a different model
    try {
      const nextModelId = await getNextRecommendedModel(modelId);
      
      if (nextModelId !== modelId) {
        toast.info(`Automatically retrying with ${nextModelId}...`);
        return await generateLab({
          ...data,
          _retryCount: (data._retryCount || 0) + 1
        }, nextModelId);
      }
    } catch (retryError) {
      console.error("Failed to retry with different model:", retryError);
    }
    
    throw error;
  }
}

export async function generateTeachingTip(subject: string, modelId: string = "meta-llama/llama-4-scout:free"): Promise<string> {
  try {
    return await backendGenerateTeachingTip(subject, modelId);
  } catch (error) {
    console.error("Failed to generate teaching tip:", error);
    // Provide a fallback teaching tip if the API call fails
    return "Create interactive learning stations to engage different learning styles simultaneously.";
  }
}
