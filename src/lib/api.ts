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
    
    let errorMsg = "Unknown error";
    if (error instanceof Error) {
      // Get a cleaner error message without the nested stack traces
      const errorParts = error.message.split(':');
      errorMsg = errorParts[errorParts.length - 1].trim();
      
      // Truncate if too long
      if (errorMsg.length > 100) {
        errorMsg = errorMsg.substring(0, 100) + "...";
      }
    }
    
    toast.error(`Failed to generate lesson plan: ${errorMsg}`);
    
    // Simply rethrow the error to be handled by the component
    throw new Error(`Failed to generate lesson plan: ${errorMsg}`);
  }
}

export async function generateAssessment(data: any, modelId: string): Promise<any> {
  toast.info(`Generating assessment with ${modelId}...`);
  
  try {
    // Call the backend API through our openrouter integration
    return await backendGenerateAssessment(data, modelId);
  } catch (error) {
    console.error("Failed to generate assessment:", error);
    
    let errorMsg = "Unknown error";
    if (error instanceof Error) {
      // Get a cleaner error message without the nested stack traces
      const errorParts = error.message.split(':');
      errorMsg = errorParts[errorParts.length - 1].trim();
      
      // Truncate if too long
      if (errorMsg.length > 100) {
        errorMsg = errorMsg.substring(0, 100) + "...";
      }
    }
    
    toast.error(`Failed to generate assessment: ${errorMsg}`);
    
    // Simply rethrow the error to be handled by the component
    throw new Error(`Failed to generate assessment: ${errorMsg}`);
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