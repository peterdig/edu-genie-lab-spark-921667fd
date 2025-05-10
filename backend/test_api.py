import asyncio
import httpx
import json
from dotenv import load_dotenv
import os
import time
import sys
import argparse
from typing import Dict, Any, List

# Load environment variables
load_dotenv()

# Parse command line arguments
parser = argparse.ArgumentParser(description="Test the EduGenie API")
parser.add_argument("--port", type=int, default=8888, help="Port to test the API on (default: 8888)")
args = parser.parse_args()

# Constants
API_BASE_URL = f"http://localhost:{args.port}"
API_URL = API_BASE_URL

# Configure retry settings
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

async def test_api_endpoints():
    """
    Test the API endpoints.
    """
    print("Testing the EduGenie API endpoints...\n")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # First check if the server is running via health check
            try:
                response = await client.get(f"{API_URL}/health")
                if response.status_code == 200:
                    print("✅ Server is up and running")
                else:
                    print(f"⚠️ Server health check returned {response.status_code}")
            except httpx.RequestError as e:
                print(f"⚠️ Could not connect to server: {str(e)}")
                print("Continuing with tests anyway...")
            
            # Test models
            print("\nTesting GET /models...")
            try:
                response = await client.get(f"{API_URL}/models")
                if response.status_code == 200:
                    models = response.json()
                    print(f"✅ Found {len(models)} available models\n")
                else:
                    print(f"❌ Failed to get models: {response.status_code} {response.text}\n")
            except httpx.RequestError as e:
                print(f"❌ Request error when getting models: {str(e)}\n")
            
            # Test recommended models
            print("Testing GET /models/recommended...")
            try:
                response = await client.get(f"{API_URL}/models/recommended")
                if response.status_code == 200:
                    recommended = response.json()
                    print(f"✅ Found {len(recommended)} recommended models\n")
                else:
                    print(f"❌ Failed to get recommended models: {response.status_code} {response.text}\n")
            except httpx.RequestError as e:
                print(f"❌ Request error when getting recommended models: {str(e)}\n")
            
            # Test generating a lesson plan
            print("Testing POST /generate/lesson...")
            lesson_data = {
                "topic": "Introduction to Fractions",
                "gradeLevel": "3-5",
                "duration": "30min",
                "model": "meta-llama/llama-4-scout:free",  # Using one of our new recommended models
                "additionalNotes": "Focus on visual representations and real-world applications",
                "includeAssessment": True,
                "includeActivities": True
            }
            
            try:
                response = await client.post(
                    f"{API_URL}/generate/lesson",
                    json=lesson_data,
                    timeout=90.0  # Increased timeout for larger models
                )
                
                if response.status_code == 200:
                    lesson = response.json()
                    print(f"✅ Successfully generated lesson: {lesson['title']}\n")
                else:
                    print(f"❌ Failed to generate lesson: {response.status_code} {response.text}\n")
            except httpx.RequestError as e:
                print(f"❌ Request error when generating lesson: {str(e)}\n")
            
            # Test generating a teaching tip
            print("Testing POST /generate/teaching-tip...")
            tip_data = {
                "subject": "mathematics",
                "model": "deepseek/deepseek-chat:free"  # Using another of our recommended models
            }
            
            try:
                response = await client.post(
                    f"{API_URL}/generate/teaching-tip",
                    json=tip_data,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    tip = response.json()
                    print(f"✅ Successfully generated teaching tip: {tip['tip'][:50]}...\n")
                else:
                    print(f"❌ Failed to generate teaching tip: {response.status_code} {response.text}\n")
            except httpx.RequestError as e:
                print(f"❌ Request error when generating teaching tip: {str(e)}\n")
            
            print("API testing completed!")
            
        except Exception as e:
            print(f"Error during testing: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_api_endpoints())