
import { toast } from "sonner";

// OpenRouter API key
const API_KEY = "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";

// Available models
export const MODELS = {
  qwen: "qwen/qwen2-72b-instruct",
  deepseek: "deepseek-ai/deepseek-coder-v2",
  mistral: "mistralai/mistral-large-latest"
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
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data: OpenRouterResponse = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Failed to generate content:", error);
    toast.error("Failed to generate content. Please try again.");
    throw error;
  }
}
