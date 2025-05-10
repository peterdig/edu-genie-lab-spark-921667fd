
import { toast } from "sonner";

// OpenRouter API key
const API_KEY = "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";

// Updated model IDs based on OpenRouter's current supported models
export const MODELS = {
  qwen: "anthropic/claude-3-haiku", // Using Claude 3 Haiku as replacement
  deepseek: "anthropic/claude-3-sonnet", // Using Claude 3 Sonnet as replacement
  mistral: "anthropic/claude-3-opus" // Using Claude 3 Opus as replacement
};

export type OpenRouterModel = keyof typeof MODELS;

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Make a request to the OpenRouter API
 * @param prompt The prompt to send to the API
 * @param model The model to use (qwen, deepseek, or mistral)
 * @param temperature The temperature to use (0.0 - 1.0)
 * @returns The generated text
 */
export async function generateWithOpenRouter(
  prompt: string, 
  model: OpenRouterModel = "qwen",
  temperature: number = 0.7
): Promise<string> {
  try {
    console.log(`Making request to OpenRouter with model: ${MODELS[model]}`);
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": window.location.href,
        "X-Title": "AI-Powered Educator Companion"
      },
      body: JSON.stringify({
        model: MODELS[model],
        messages: [
          { role: "system", content: "You are an AI educator assistant focused on helping teachers create high-quality educational content." },
          { role: "user", content: prompt }
        ],
        temperature: temperature,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API error:", errorData);
      
      // More specific error message based on the response
      if (errorData.error && errorData.error.message) {
        toast.error(`API Error: ${errorData.error.message}`);
        throw new Error(`Error: ${errorData.error.message}`);
      } else {
        toast.error(`Error: ${response.status} ${response.statusText}`);
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
    }

    const data: OpenRouterResponse = await response.json();
    
    // Log token usage for monitoring
    console.log("Token usage:", data.usage);
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Failed to generate content:", error);
    toast.error("Failed to generate content. Please try again.");
    throw error;
  }
}

// Helper function to detect if the JSON parsing failed and attempt to fix it
export function sanitizeAndParseJSON(jsonString: string): any {
  try {
    // First attempt to parse the response directly
    return JSON.parse(jsonString);
  } catch (e) {
    console.log("Failed to parse JSON directly, attempting to extract JSON...");
    
    // Try to extract JSON from the response (in case the model added extra text)
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        console.error("Failed to parse extracted JSON:", e2);
        
        // Further attempt to clean the JSON by removing markdown code blocks
        try {
          const cleanedJson = jsonString.replace(/```(json|javascript)?\n?|\n?```/g, '').trim();
          return JSON.parse(cleanedJson);
        } catch (e3) {
          console.error("Failed to parse cleaned JSON:", e3);
          
          // Last resort: create a minimal valid object with the content
          return {
            title: "Generated Lesson Plan",
            overview: "This lesson plan couldn't be properly formatted. Please regenerate or edit manually.",
            objectives: ["Review and edit the generated content"],
            materials: ["Teaching materials to be added"],
            plan: jsonString.substring(0, 2000), // Use raw text as plan
            assessment: "Assessment to be added",
            tags: ["Auto-generated"]
          };
        }
      }
    }
    console.error("Could not find valid JSON in response:", jsonString.substring(0, 200) + "...");
    // Return a fallback object
    return {
      title: "Generated Lesson Plan",
      overview: "The AI couldn't generate a properly structured lesson plan. Please try again or edit manually.",
      objectives: ["Review and edit the generated content"],
      materials: ["Teaching materials to be added"],
      plan: jsonString.substring(0, 2000), // Use raw text as plan
      assessment: "Assessment to be added",
      tags: ["Auto-generated"]
    };
  }
}

// Function to retry with a different model if one fails
export function getNextModel(currentModel: OpenRouterModel): OpenRouterModel {
  const modelOrder: OpenRouterModel[] = ["qwen", "deepseek", "mistral"];
  const currentIndex = modelOrder.indexOf(currentModel);
  const nextIndex = (currentIndex + 1) % modelOrder.length;
  return modelOrder[nextIndex];
}
