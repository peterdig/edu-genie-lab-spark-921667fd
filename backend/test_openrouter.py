import os
import httpx
import asyncio
import json
from dotenv import load_dotenv
import datetime

# Load environment variables
load_dotenv()

# Get API key from environment
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
API_URL = "https://openrouter.ai/api/v1/chat/completions"

async def test_openrouter_api():
    """Test the OpenRouter API directly"""
    print("Testing OpenRouter API...")
    print(f"API Key (first 10 chars): {OPENROUTER_API_KEY[:10]}...")
    
    if not OPENROUTER_API_KEY:
        print("❌ ERROR: OpenRouter API key is missing!")
        return
        
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://edu-genie-app.com", 
        "X-Title": "AI-Powered Educator Companion"
    }
    
    data = {
        "model": "meta-llama/llama-4-scout:free",
        "messages": [
            {"role": "system", "content": "You are a helpful teaching assistant."},
            {"role": "user", "content": "Generate a short teaching tip for mathematics."}
        ],
        "temperature": 0.7,
        "max_tokens": 300,
    }
    
    try:
        print(f"Sending request to {API_URL}...")
        async with httpx.AsyncClient() as client:
            response = await client.post(API_URL, headers=headers, json=data, timeout=60.0)
            
            # Print response data
            print(f"Response status: {response.status_code}")
            
            # Parse response JSON
            response_json = None
            try:
                response_json = response.json()
                print(f"Response JSON: {json.dumps(response_json, indent=2)}")
            except Exception:
                print("❌ Failed to parse response as JSON")
                print(f"Raw response: {response.text}")
                return
                
            # Check for rate limit error in the response JSON
            is_rate_limit = False
            
            # Check if there's an error object with a rate limit message or code 429
            if "error" in response_json:
                error = response_json["error"]
                if isinstance(error, dict):
                    error_code = error.get("code")
                    error_message = error.get("message", "").lower()
                    
                    if error_code == 429 or "rate limit" in error_message:
                        is_rate_limit = True
            
            # Detect rate limit error - either by status code or error code in body
            if response.status_code == 429 or is_rate_limit:
                error_data = response_json.get("error", {})
                error_message = error_data.get("message", "Unknown rate limit error")
                error_code = error_data.get("code", 429)
                metadata = error_data.get("metadata", {})
                headers = metadata.get("headers", {})
                
                # Extract rate limit info
                limit = headers.get("X-RateLimit-Limit", "Unknown")
                remaining = headers.get("X-RateLimit-Remaining", "Unknown")
                reset_time = headers.get("X-RateLimit-Reset", None)
                
                print("\n❌ RATE LIMIT ERROR DETECTED:")
                print(f"  - Message: {error_message}")
                print(f"  - Error code: {error_code}")
                print(f"  - Rate limit: {limit}")
                print(f"  - Remaining requests: {remaining}")
                
                if reset_time:
                    try:
                        # Convert milliseconds since epoch to datetime
                        reset_datetime = datetime.datetime.fromtimestamp(int(reset_time) / 1000)
                        print(f"  - Rate limit resets at: {reset_datetime}")
                        time_until_reset = reset_datetime - datetime.datetime.now()
                        hours, remainder = divmod(time_until_reset.total_seconds(), 3600)
                        minutes, seconds = divmod(remainder, 60)
                        print(f"  - Time until reset: {int(hours)}h {int(minutes)}m {int(seconds)}s")
                    except Exception as e:
                        print(f"  - Rate limit reset time: {reset_time} (failed to parse: {str(e)})")
                
                print("\nSOLUTION OPTIONS:")
                print("1. Wait until the rate limit resets")
                print("2. Add credits to your OpenRouter account for increased limits")
                print("3. Use the fallback content system implemented in the application")
                
                return
                
            # For normal 200 responses 
            if response.status_code == 200:
                if "choices" in response_json:
                    content = response_json["choices"][0]["message"]["content"]
                    print(f"\n✅ SUCCESS! Response content:\n{content[:200]}...")
                else:
                    print("\n❌ Error: 'choices' not found in response")
            else:
                print(f"\n❌ Error response (code {response.status_code})")
                
    except Exception as e:
        print(f"❌ Exception during API request: {type(e).__name__}: {str(e)}")

# Test fallback system (returns a tip even when API is unavailable)
async def test_fallback_system():
    """Test the fallback system for teaching tips"""
    print("\n=== Testing Fallback System ===")
    print("This simulates what happens when calling the /generate/teaching-tip endpoint with rate limits")
    
    # List of subjects to test
    subjects = ["mathematics", "science", "history", "english", "computer science"]
    
    for subject in subjects:
        # Create the URL for the teaching tip endpoint
        url = f"http://localhost:8888/generate/teaching-tip"
        data = {
            "subject": subject,
            "model": "meta-llama/llama-4-scout:free"  # This model is rate limited
        }
        
        print(f"\nTesting fallback for subject: {subject}")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=data, timeout=10.0)
                
                if response.status_code == 200:
                    result = response.json()
                    if "tip" in result:
                        print(f"✅ Got fallback tip: {result['tip'][:100]}...")
                        if "source" in result and result["source"] == "fallback":
                            print("   This is a confirmed fallback tip!")
                    else:
                        print(f"❓ Unexpected response format: {result}")
                else:
                    print(f"❌ Error response: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Exception during fallback test: {str(e)}")
    
    print("\nFallback system test complete.")

if __name__ == "__main__":
    asyncio.run(test_openrouter_api())
    
    # Uncomment to test the fallback system against the local API
    # Note: The backend server must be running on port 8888
    asyncio.run(test_fallback_system()) 