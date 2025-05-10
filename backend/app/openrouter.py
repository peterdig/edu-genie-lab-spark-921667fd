import os
import json
import httpx
import time
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
API_URL = "https://openrouter.ai/api/v1/chat/completions"

# List of available models from the user's requirements
AVAILABLE_MODELS = [
    {"name": "Meta: Llama 4 Scout", "id": "meta-llama/llama-4-scout:free", "input_cost": "$0", "output_cost": "$0", "context_length": 512000},
    {"name": "Google: Gemini 2.5 Pro Experimental", "id": "google/gemini-2.5-pro-exp-03-25", "input_cost": "$0", "output_cost": "$0", "context_length": 1000000},
    {"name": "DeepSeek: DeepSeek V3", "id": "deepseek/deepseek-chat:free", "input_cost": "$0", "output_cost": "$0", "context_length": 163840},
    {"name": "NVIDIA: Llama 3.1 Nemotron Ultra 253B", "id": "nvidia/llama-3.1-nemotron-ultra-253b-v1:free", "input_cost": "$0", "output_cost": "$0", "context_length": 131072},
    {"name": "Mistral: Mistral Small 3.1 24B", "id": "mistralai/mistral-small-3.1-24b-instruct:free", "input_cost": "$0", "output_cost": "$0", "context_length": 96000},
    {"name": "Meta: Llama 4 Maverick", "id": "meta-llama/llama-4-maverick:free", "input_cost": "$0", "output_cost": "$0", "context_length": 256000},
    {"name": "DeepSeek: DeepSeek V3 Base", "id": "deepseek/deepseek-v3-base:free", "input_cost": "$0", "output_cost": "$0", "context_length": 163840},
    {"name": "Qwen: Qwen3 4B", "id": "qwen/qwen3-4b:free", "input_cost": "$0", "output_cost": "$0", "context_length": 128000},
    {"name": "Google: Gemma 3 12B", "id": "google/gemma-3-12b-it:free", "input_cost": "$0", "output_cost": "$0", "context_length": 131072},
    {"name": "Agentica: Deepcoder 14B Preview", "id": "agentica-org/deepcoder-14b-preview:free", "input_cost": "$0", "output_cost": "$0", "context_length": 96000},
]

# Recommended models for education content generation
RECOMMENDED_MODELS = [
    "meta-llama/llama-4-scout:free",
    "google/gemini-2.5-pro-exp-03-25",
    "deepseek/deepseek-chat:free",
    "nvidia/llama-3.1-nemotron-ultra-253b-v1:free",
    "mistralai/mistral-small-3.1-24b-instruct:free"
]

# Cache for API responses to reduce redundant calls
RESPONSE_CACHE = {}
CACHE_EXPIRY = 24 * 60 * 60  # 24 hours in seconds

# Rate limiting configuration
API_CALLS = {}
MAX_CALLS_PER_MODEL = 10  # Maximum calls per model per hour
CALL_WINDOW = 60 * 60  # 1 hour in seconds

def get_available_models():
    """Return the list of available models"""
    return AVAILABLE_MODELS

def get_model_by_id(model_id: str):
    """Get model info by ID"""
    for model in AVAILABLE_MODELS:
        if model["id"] == model_id:
            return model
    return None

def get_system_prompt(context: str = "education") -> str:
    """
    Get an appropriate system prompt based on the context.
    
    Args:
        context: The context for the system prompt (default: "education")
        
    Returns:
        A system prompt string
    """
    prompts = {
        "education": "You are an AI educator assistant focused on helping teachers create high-quality educational content. Provide accurate, pedagogically sound material appropriate for the target grade level.",
        "assessment": "You are an AI assessment designer assistant. Create assessments that accurately measure student knowledge and skills using appropriate question types for the target grade level.",
        "lab": "You are an AI lab designer focused on helping teachers create engaging virtual lab experiences for students. Provide step-by-step instructions that promote scientific inquiry and critical thinking.",
        "general": "You are an AI assistant focused on helping educators create high-quality content."
    }
    
    return prompts.get(context.lower(), prompts["general"])

def check_rate_limit(model_id: str) -> bool:
    """
    Check if we've exceeded the rate limit for this model
    
    Args:
        model_id: The model ID to check
        
    Returns:
        True if allowed, False if rate limited
    """
    current_time = time.time()
    
    # Clean up expired entries
    for key in list(API_CALLS.keys()):
        if current_time - API_CALLS[key]["timestamp"] > CALL_WINDOW:
            del API_CALLS[key]
    
    # Check if model has been used
    if model_id in API_CALLS:
        calls = API_CALLS[model_id]
        
        # If within the time window and exceeded call limit
        if current_time - calls["timestamp"] < CALL_WINDOW and calls["count"] >= MAX_CALLS_PER_MODEL:
            return False
        
        # Update count if within window, or reset if window expired
        if current_time - calls["timestamp"] < CALL_WINDOW:
            API_CALLS[model_id]["count"] += 1
        else:
            API_CALLS[model_id] = {"count": 1, "timestamp": current_time}
    else:
        # First call for this model
        API_CALLS[model_id] = {"count": 1, "timestamp": current_time}
    
    return True

def get_cache_key(prompt: str, model_id: str, max_tokens: int) -> str:
    """
    Generate a cache key for a request
    
    Args:
        prompt: The user prompt
        model_id: The model ID
        max_tokens: Maximum tokens to generate
        
    Returns:
        A unique cache key string
    """
    return f"{model_id}:{hash(prompt)}:{max_tokens}"

async def generate_content(
    prompt: str,
    model_id: str,
    system_prompt: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 2000
) -> str:
    """
    Generate content using the OpenRouter API with caching and rate limiting
    
    Args:
        prompt: The user prompt
        model_id: The model ID from OpenRouter
        system_prompt: Optional system prompt
        temperature: Controls randomness (0.0-1.0)
        max_tokens: Maximum tokens to generate
        
    Returns:
        The generated text as a string
    """
    if not system_prompt:
        system_prompt = "You are an AI educator assistant focused on helping teachers create high-quality educational content."
    
    if not OPENROUTER_API_KEY:
        raise Exception("OpenRouter API key is missing. Please set the OPENROUTER_API_KEY environment variable.")
    
    # Check cache first
    cache_key = get_cache_key(prompt, model_id, max_tokens)
    
    if cache_key in RESPONSE_CACHE:
        cache_entry = RESPONSE_CACHE[cache_key]
        # If cache is still valid
        if time.time() - cache_entry["timestamp"] < CACHE_EXPIRY:
            print(f"Cache hit for prompt with model: {model_id}")
            return cache_entry["content"]
    
    # Check rate limiting 
    if not check_rate_limit(model_id):
        print(f"Rate limit exceeded for model: {model_id}")
        raise Exception(f"Local rate limit exceeded for model: {model_id}. Try a different model or wait.")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://edu-genie-app.com",
        "X-Title": "AI-Powered Educator Companion"
    }
    
    data = {
        "model": model_id,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    
    try:
        print(f"Sending request to OpenRouter API for model: {model_id}")
        async with httpx.AsyncClient() as client:
            response = await client.post(API_URL, headers=headers, json=data, timeout=180.0)
            
            # Parse the response JSON
            response_json = response.json()
            
            # Check for error in the response
            if "error" in response_json:
                error_data = response_json["error"]
                error_code = error_data.get("code", 0)
                error_message = error_data.get("message", "Unknown error")
                
                # Handle rate limit errors
                if error_code == 429 or "rate limit" in error_message.lower():
                    print(f"Rate limit exceeded: {error_message}")
                    raise Exception(f"OpenRouter API rate limit exceeded: {error_message}")
                
                # Handle other API errors
                print(f"OpenRouter API error: {error_message}")
                raise Exception(f"OpenRouter API error: {error_message}")
            
            # Handle non-200 status codes that don't have error in JSON
            if response.status_code != 200:
                print(f"OpenRouter API returned status code {response.status_code}")
            response.raise_for_status()
            
            # Check for "choices" in the response
            if "choices" not in response_json:
                print(f"Invalid response format: 'choices' not found in response")
                print(f"Response: {response.text}")
                raise Exception("Invalid response format from OpenRouter API")
            
            # Extract the content from the response
            content = response_json["choices"][0]["message"]["content"]
            
            # Store in cache
            RESPONSE_CACHE[cache_key] = {
                "content": content,
                "timestamp": time.time()
            }
            
            # Trim cache if it gets too large (keep most recent 100 entries)
            if len(RESPONSE_CACHE) > 100:
                # Sort by timestamp and keep only the most recent entries
                sorted_keys = sorted(RESPONSE_CACHE.keys(), 
                                    key=lambda k: RESPONSE_CACHE[k]["timestamp"], 
                                    reverse=True)
                for key in sorted_keys[100:]:
                    del RESPONSE_CACHE[key]
            
            return content
            
    except httpx.HTTPStatusError as e:
        error_info = f"HTTP Error: {e.response.status_code}"
        try:
            error_data = e.response.json()
            if "error" in error_data and "message" in error_data["error"]:
                error_info += f" - {error_data['error']['message']}"
        except:
            pass
        print(f"OpenRouter API HTTP error: {error_info}")
        raise Exception(error_info)
    except httpx.RequestError as e:
        print(f"OpenRouter API request error: {str(e)}")
        raise Exception(f"Request error: {str(e)}")
    except Exception as e:
        print(f"Unexpected error with OpenRouter API: {str(e)}")
        raise Exception(f"Error generating content: {str(e)}")

def sanitize_and_parse_json(json_string: str) -> Dict[str, Any]:
    """
    Attempt to parse and sanitize JSON from AI response.
    
    Args:
        json_string: String containing JSON data
        
    Returns:
        Parsed JSON as a dictionary
    """
    try:
        # First attempt to parse the response directly
        return json.loads(json_string)
    except json.JSONDecodeError:
        # Try to extract JSON from the response (in case model added extra text)
        import re
        json_match = re.search(r'\{[\s\S]*\}', json_string)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                # Try cleaning the JSON by removing markdown code blocks
                cleaned_json = re.sub(r'```(json|javascript)?\n?|\n?```', '', json_string).strip()
                try:
                    return json.loads(cleaned_json)
                except json.JSONDecodeError:
                    raise ValueError("Could not parse JSON from response")
        raise ValueError("Could not extract valid JSON from response") 