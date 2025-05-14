import { toast } from "sonner";

// API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Model interface
export interface OpenRouterModel {
  name: string;
  id: string;
  input_cost: string;
  output_cost: string;
  context_length: number;
  is_free?: boolean;
}

// Cache available models
let availableModels: OpenRouterModel[] = [];
let recommendedModels: string[] = [];

/**
 * Fetch available models from the API
 */
export async function fetchAvailableModels(): Promise<OpenRouterModel[]> {
  try {
    if (availableModels.length > 0) {
      return availableModels;
    }
    
    const response = await fetch(`${API_BASE_URL}/models`);
    if (!response.ok) {
      throw new Error(`Error fetching models: ${response.status} ${response.statusText}`);
    }
    
    availableModels = await response.json();
    return availableModels;
  } catch (error) {
    console.error("Failed to fetch available models:", error);
    toast.error("Failed to fetch available models. Using default models instead.");
    
    // Return some default models if the API call fails
    return [
      {
        name: "Meta: Llama 3.1 8B Instruct",
        id: "meta-llama/llama-3.1-8b-instruct:free",
        input_cost: "$0",
        output_cost: "$0",
        context_length: 131072,
        is_free: true
      },
      {
        name: "Mistral: Mistral 7B Instruct",
        id: "mistralai/mistral-7b-instruct:free",
        input_cost: "$0",
        output_cost: "$0",
        context_length: 32768,
        is_free: true
      },
      {
        name: "DeepSeek: DeepSeek V3",
        id: "deepseek/deepseek-chat:free",
        input_cost: "$0",
        output_cost: "$0",
        context_length: 163840,
        is_free: true
      }
    ];
  }
}

/**
 * Fetch recommended models from the API
 */
export async function fetchRecommendedModels(): Promise<string[]> {
  try {
    if (recommendedModels.length > 0) {
      return recommendedModels;
    }
    
    const response = await fetch(`${API_BASE_URL}/models/recommended`);
    if (!response.ok) {
      throw new Error(`Error fetching recommended models: ${response.status} ${response.statusText}`);
    }
    
    recommendedModels = await response.json();
    return recommendedModels;
  } catch (error) {
    console.error("Failed to fetch recommended models:", error);
    
    // Return some default recommended models if the API call fails
    return [
      "meta-llama/llama-3.1-8b-instruct:free",
      "mistralai/mistral-7b-instruct:free",
      "deepseek/deepseek-chat:free"
    ];
  }
}

/**
 * Get a model by ID
 * @param modelId The model ID to look up
 * @returns The model info, or undefined if not found
 */
export async function getModelById(modelId: string): Promise<OpenRouterModel | undefined> {
  const models = await fetchAvailableModels();
  return models.find(model => model.id === modelId);
}

/**
 * Generate content via the backend API
 * @param endpoint The API endpoint to call
 * @param data The data to send to the API
 * @returns The API response as JSON
 */
export async function generateContent(endpoint: string, data: any): Promise<any> {
  const modelId = data.model;
  
  console.log(`Making API request to ${endpoint} with model: ${modelId}`);
  
  try {
    // Make the API request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    // Handle non-200 response
    if (!response.ok) {
      const errorData = await response.json();
      console.log(`API error (${response.status}):`, errorData);
      throw new Error(`Failed to generate ${endpoint.replace('/generate/', '')}: ${response.status}: ${errorData.detail || response.statusText}`);
    }
    
    // Parse the response
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    // Log the error and rethrow
    console.error(`Failed to generate content from ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Generate a lesson
 * @param data Lesson parameters
 * @param modelId The model ID to use
 * @returns The generated lesson
 */
export async function generateLesson(data: any, modelId: string): Promise<any> {
  const response = await generateContent("/generate/lesson", {
    ...data,
    model: modelId
  });
  
  // Validate essential lesson fields
  if (!response || typeof response !== 'object') {
    throw new Error("Invalid lesson response format");
  }
  
  if (!response.title || !response.overview || !response.objectives || !response.plan) {
    throw new Error("Incomplete lesson plan received from AI");
  }
  
  return response;
}

/**
 * Generate an assessment
 * @param data Assessment parameters
 * @param modelId The model ID to use
 * @returns The generated assessment
 */
export async function generateAssessment(data: any, modelId: string): Promise<any> {
  const response = await generateContent("/generate/assessment", {
    ...data,
    model: modelId
  });
  
  // Validate essential assessment fields
  if (!response || typeof response !== 'object') {
    throw new Error("Invalid assessment response format");
  }
  
  if (!response.title || !response.questions || !Array.isArray(response.questions)) {
    throw new Error("Incomplete assessment received from AI");
  }
  
  return response;
}

/**
 * Generate a lab
 * @param data Lab parameters
 * @param modelId The model ID to use
 * @returns The generated lab
 */
export async function generateLab(data: any, modelId: string): Promise<any> {
  const response = await generateContent("/generate/lab", {
    ...data,
    model: modelId
  });
  
  // Validate essential lab fields
  if (!response || typeof response !== 'object') {
    throw new Error("Invalid lab response format");
  }
  
  if (!response.title || !response.instructions || !response.materials) {
    throw new Error("Incomplete lab received from AI");
  }
  
  return response;
}

/**
 * Generate a teaching tip
 * @param subject The subject for the teaching tip
 * @param modelId The model ID to use
 * @returns The generated teaching tip
 */
export async function generateTeachingTip(subject: string, modelId: string): Promise<string> {
  try {
    console.log(`Making API request to /generate/teaching-tip for subject: ${subject} with model: ${modelId}`);
    
    const response = await fetch(`${API_BASE_URL}/generate/teaching-tip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject,
        model: modelId
      }),
    });

    if (!response.ok) {
      let errorMessage = `Error: ${response.status} ${response.statusText}`;
      let errorDetail = '';
      
      try {
        const errorData = await response.json();
        console.error(`API error (${response.status}):`, errorData);
        
        if (errorData.detail) {
          errorDetail = errorData.detail;
          errorMessage = errorData.detail;
          
          // Special handling for rate limit errors
          if (response.status === 429 || errorMessage.toLowerCase().includes('rate limit')) {
            throw new Error(`Rate limit exceeded: ${errorDetail}`);
          }
        }
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
        errorDetail = 'Unable to parse error response';
      }
      
      // Create a detailed error object
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).endpoint = '/generate/teaching-tip';
      (error as any).detail = errorDetail;
      (error as any).model = modelId;
      
      throw error;
    }

    const result = await response.json();
    
    // The API might return the tip in different formats:
    // 1. Direct string in the response
    if (typeof result === 'string') {
      return result;
    } 
    // 2. Object with a tip property (normal case)
    else if (result && typeof result === 'object') {
      // Check if we got a fallback response and log it
      if (result.source === 'fallback') {
        console.log("Using fallback teaching tip from backend");
      }
      
      // Return the tip if available
      if (result.tip && typeof result.tip === 'string') {
        return result.tip;
      }
    }
    
    throw new Error("Invalid response format from teaching tip API");
  } catch (error) {
    console.error("Error generating teaching tip:", error);
    throw error;
  }
}

/**
 * Get a recommended model if the current one fails
 * @param currentModelId The current model ID
 * @returns An alternative model ID
 */
export async function getNextRecommendedModel(currentModelId: string): Promise<string> {
  const recommended = await fetchRecommendedModels();
  
  // If current model is in the recommended list, get the next one
  const currentIndex = recommended.indexOf(currentModelId);
  if (currentIndex !== -1) {
    const nextIndex = (currentIndex + 1) % recommended.length;
    return recommended[nextIndex];
  }
  
  // Otherwise, return the first recommended model
  return recommended[0];
}

/**
 * Check API and OpenRouter status
 * @returns Status information about the API and OpenRouter service
 */
export async function checkApiStatus(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/status`);
    if (!response.ok) {
      throw new Error(`Error fetching API status: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to check API status:", error);
    throw error;
  }
}

/**
 * Get current model usage statistics 
 * @returns Statistics about model usage and rate limits
 */
export async function getModelStats(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/models/stats`);
    if (!response.ok) {
      throw new Error(`Error fetching model stats: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to get model stats:", error);
    return { 
      error: String(error),
      usage: {},
      errors: {}
    };
  }
}