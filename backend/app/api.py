from datetime import datetime
import uuid
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
import json
from pydantic import ValidationError
import traceback
import logging
import time

from .models import (
    LessonRequest, LessonResult, AssessmentRequest, AssessmentResult,
    LabRequest, Lab, Step, LabQuestion, TeachingTipRequest, ModelInfo
)
from .openrouter import (
    generate_content, sanitize_and_parse_json, 
    get_available_models, get_model_by_id, RECOMMENDED_MODELS, get_system_prompt
)
from .model_manager import ModelManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("edugenie.api")

# Load environment variables
load_dotenv()

# Get allowed origins from environment or use defaults
def get_allowed_origins():
    # Default origins for development and production
    default_origins = ["*"] if os.getenv("DEBUG", "False").lower() in ("true", "1", "t", "yes") else ["https://edu-genie-lab.vercel.app", "https://edu-genie.app"]
    
    # Check if additional origins are specified in environment
    allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
    if allowed_origins_env:
        # Split the comma-separated string into a list
        additional_origins = [origin.strip() for origin in allowed_origins_env.split(",")]
        # Replace wildcards with specific origins
        if "*" in default_origins and additional_origins:
            return additional_origins
        # Add additional origins to the default list
        return list(set(default_origins + additional_origins))
    
    return default_origins

app = FastAPI(
    title="EduGenie API",
    description="API for the EduGenie educational content generation platform",
    version="1.0.0",
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Initialize ModelManager for smart model selection
model_manager = ModelManager(
    models=get_available_models(),
    recommended_models=RECOMMENDED_MODELS
)

# Domain-specific fallback tips when rate limits are hit
FALLBACK_TIPS = {
    "math": "Use real-world examples to make abstract mathematical concepts concrete and relevant to students' lives.",
    "science": "Incorporate hands-on experiments that allow students to observe scientific principles in action rather than just reading about them.",
    "history": "Connect historical events to current issues to help students understand the relevance and impact of history on today's world.",
    "english": "Have students write reflectively about their personal connections to texts to deepen comprehension and engagement.",
    "art": "Integrate choice-based activities that allow students to express their creativity while still learning fundamental techniques.",
    "music": "Use call-and-response activities to develop students' listening skills and build confidence in music performance.",
    "physical education": "Structure activities to ensure maximum participation and movement time for all students regardless of ability level.",
    "computer science": "Use pair programming to encourage collaboration and problem-solving skills while coding.",
    "foreign language": "Create immersive classroom experiences where students must communicate in the target language to accomplish tasks.",
    "education": "Create opportunities for students to teach concepts to their peers, which reinforces learning through explanation."
}

# Teaching tip cache to minimize API calls
TEACHING_TIP_CACHE = {}
CACHE_EXPIRY = 24 * 60 * 60  # 24 hours in seconds

@app.get("/")
async def root():
    return {"message": "Welcome to the EduGenie API"}

@app.get("/models", response_model=List[ModelInfo])
async def get_models():
    """Get all available models from OpenRouter"""
    models = get_available_models()
    return models

@app.get("/models/recommended", response_model=List[str])
async def get_recommended_models():
    """Get recommended models for education content"""
    return RECOMMENDED_MODELS

@app.get("/models/stats")
async def get_model_stats():
    """Get current model usage statistics"""
    return model_manager.get_model_stats()

@app.post("/generate/lesson", response_model=LessonResult)
async def generate_lesson(request: LessonRequest):
    """Generate a lesson plan based on the provided parameters"""
    try:
        # Add flags for assessment and activities in the prompt
        assessment_instruction = "Include assessment questions with answers." if request.includeAssessment else "Do not include assessment questions."
        activities_instruction = "Include engaging student activities in the lesson plan." if request.includeActivities else "No need to include student activities."
        
        prompt = f"""
        Create a detailed lesson plan about "{request.topic}" for grade level "{request.gradeLevel}" with a duration of "{request.duration}".
        {f"Additional context: {request.additionalNotes}" if request.additionalNotes else ""}
        
        IMPORTANT INSTRUCTIONS:
        {assessment_instruction}
        {activities_instruction}
        
        Format your response as a JSON object with the following structure:
        {{
            "title": "Descriptive title for the lesson",
            "gradeLevel": "{request.gradeLevel}",
            "subject": "Subject area",
            "duration": "{request.duration}",
            "overview": "Brief overview of the lesson (1-2 paragraphs)",
            "objectives": ["learning objective 1", "learning objective 2", ...],
            "materials": ["material 1", "material 2", ...],
            "plan": "Detailed lesson plan with sections for introduction, instruction, practice, etc.",
            "assessment": "Description of assessment methods",
            "questions": [
                {{
                    "text": "Question text",
                    "options": ["option 1", "option 2", "option 3", "option 4"],
                    "answer": "Correct answer",
                    "bloomsLevel": "Knowledge/Comprehension/Application/Analysis/Synthesis/Evaluation"
                }},
                ...
            ],
            "tags": ["relevant", "tags", "for", "this", "lesson"]
        }}

        IMPORTANT: Your response must be a valid JSON object with no additional text before or after.
        """
        
        # Get the best model to use - either the requested one or a substitute if rate limited
        model_id = model_manager.get_best_model(request.model)
        
        # If we're using a different model than requested, log it
        if model_id != request.model:
            logger.info(f"Using alternative model {model_id} instead of requested {request.model}")
            
        model = get_model_by_id(model_id)
        if not model:
            raise HTTPException(status_code=400, detail=f"Invalid model ID: {model_id}")
            
        # Calculate optimal max_tokens based on model's context length
        # For very large models, we can use more tokens for output
        context_length = model["context_length"]
        max_tokens = min(8000, context_length // 4)  # Cap at 8000 but use up to 1/4 of context window
        
        # Special case for the largest models
        if context_length >= 500000:  # For models like Llama 4 Scout and Gemini
            max_tokens = min(12000, context_length // 8)  # Allow up to 12K tokens for massive models
            
        try:
            response = await generate_content(
                prompt=prompt,
                model_id=model_id,
                temperature=0.7,
                max_tokens=max_tokens
            )
            
            parsed_response = sanitize_and_parse_json(response)
            
            # Ensure the plan is a string
            if parsed_response.get("plan") and not isinstance(parsed_response["plan"], str):
                parsed_response["plan"] = str(parsed_response["plan"])
            
            # Create the lesson result
            lesson_result = LessonResult(
                id=f"lesson-{uuid.uuid4()}",
                title=parsed_response.get("title", f"{request.topic} - Lesson Plan"),
                gradeLevel=parsed_response.get("gradeLevel", request.gradeLevel),
                subject=parsed_response.get("subject", request.topic.split(" ")[0]),
                duration=parsed_response.get("duration", request.duration),
                overview=parsed_response.get("overview", "Overview not generated."),
                objectives=parsed_response.get("objectives", []),
                materials=parsed_response.get("materials", []),
                plan=parsed_response.get("plan", "Plan not generated."),
                assessment=parsed_response.get("assessment", "Assessment not generated."),
                questions=parsed_response.get("questions", []),
                tags=parsed_response.get("tags", [request.topic.split(" ")[0], request.gradeLevel, "Lesson Plan"]),
                createdAt=datetime.now().isoformat()
            )
            
            return lesson_result
        except Exception as model_error:
            # Record the error for this model
            model_manager.record_error(model_id)
            
            # Check if this is a rate limit error
            error_message = str(model_error).lower()
            if "rate limit" in error_message or "429" in error_message:
                logger.warning(f"Rate limit error for model {model_id}, trying another model")
                
                # Try with a different model instead
                alternative_model_id = model_manager.get_best_model()
                if alternative_model_id != model_id:
                    logger.info(f"Retrying with alternative model {alternative_model_id}")
                    
                    # Update the request and call ourselves again
                    request.model = alternative_model_id
                    return await generate_lesson(request)
            
            # If not a rate limit or retry failed, raise the original error
            raise model_error
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate lesson: {str(e)}")

@app.post("/generate/assessment", response_model=AssessmentResult)
async def generate_assessment(request: AssessmentRequest):
    """Generate an assessment based on the provided parameters"""
    try:
        prompt = f"""
        Create a detailed assessment about "{request.topic}" for grade level "{request.gradeLevel}" with {request.numberOfQuestions} questions.
        Question types to include: {", ".join(request.questionTypes)}
        Bloom's taxonomy levels to target: {", ".join(request.bloomsLevels)}
        {f"Additional instructions: {request.additionalInstructions}" if request.additionalInstructions else ""}
        
        EXTREMELY IMPORTANT: 
        - EVERY question MUST include an "answer" field with the correct answer.
        - For multiple-choice questions, the "answer" MUST be the FULL TEXT of the correct option, not just A, B, C, D.
        - For true-false questions, the "answer" MUST be either "True" or "False".
        - For short-answer and essay questions, provide a sample correct answer.
        - Do not skip providing an answer for ANY question type.
        
        Format your response as a JSON object with the following structure:
        {{
            "title": "Descriptive title for the assessment",
            "gradeLevel": "{request.gradeLevel}",
            "instructions": "Instructions for taking the assessment",
            "questions": [
                {{
                    "text": "Question text",
                    "type": "one of: multiple-choice, true-false, short-answer, essay",
                    "options": ["option 1", "option 2", "option 3", "option 4"] (for multiple-choice and true-false only),
                    "answer": "FULL TEXT of the correct answer - THIS IS REQUIRED FOR ALL QUESTIONS",
                    "bloomsLevel": "Targeted Bloom's level"
                }},
                ...
            ],
            "tags": ["relevant", "tags", "for", "this", "assessment"]
        }}

        IMPORTANT: Your response must be a valid JSON object with no additional text before or after. EVERY QUESTION MUST HAVE AN ANSWER FIELD FILLED IN.
        """
        
        model = get_model_by_id(request.model)
        if not model:
            raise HTTPException(status_code=400, detail=f"Invalid model ID: {request.model}")
            
        # Calculate optimal max_tokens based on model's context length
        # For very large models, we can use more tokens for output
        context_length = model["context_length"]
        max_tokens = min(8000, context_length // 4)  # Cap at 8000 but use up to 1/4 of context window
        
        # Special case for the largest models
        if context_length >= 500000:  # For models like Llama 4 Scout and Gemini
            max_tokens = min(12000, context_length // 8)  # Allow up to 12K tokens for massive models
            
        response = await generate_content(
            prompt=prompt,
            model_id=request.model,
            temperature=0.7,
            max_tokens=max_tokens
        )
        
        parsed_response = sanitize_and_parse_json(response)
        
        # Validate and ensure answers are present for each question
        questions = parsed_response.get("questions", [])
        
        # Debug logging for questions and answers
        print(f"Assessment generated with {len(questions)} questions")
        for i, question in enumerate(questions):
            answer = question.get("answer")
            print(f"Question {i+1} ({question.get('type')}): Answer present: {answer is not None}, Answer: {answer}")
        
        for question in questions:
            # Ensure each question has an answer field
            if "answer" not in question or not question["answer"]:
                # For multiple-choice, default to the first option if no answer provided
                if question.get("type") == "multiple-choice" and question.get("options"):
                    question["answer"] = question["options"][0]
                    print(f"Setting default answer for multiple-choice: {question['answer']}")
                # For true-false, default to "True" if no answer provided
                elif question.get("type") == "true-false":
                    question["answer"] = "True"
                    print(f"Setting default answer for true-false: True")
                # For other types, provide a placeholder answer
                else:
                    question["answer"] = "Sample answer placeholder - requires manual input"
                    print(f"Setting default answer placeholder for {question.get('type')}")
            # For multiple choice, ensure the answer is the full text of an option, not just a letter
            elif question.get("type") == "multiple-choice" and question.get("options"):
                options = question.get("options", [])
                answer = question.get("answer", "")
                
                # Check if the answer is just a letter like "A", "B", "C", "D"
                if len(answer) == 1 and answer.upper() in "ABCD":
                    # Convert letter to index (A=0, B=1, etc.)
                    index = ord(answer.upper()) - ord('A')
                    # Make sure index is valid
                    if 0 <= index < len(options):
                        question["answer"] = options[index]
                        print(f"Converting letter answer '{answer}' to full text: '{question['answer']}'")
                # Also check for answers like "(A)" or "A)"
                elif (len(answer) <= 3 and 
                      (answer.upper().startswith("(") or answer.upper().endswith(")")) and
                      any(letter in answer.upper() for letter in "ABCD")):
                    # Extract the letter
                    letter = ''.join(c for c in answer.upper() if c in "ABCD")
                    index = ord(letter) - ord('A')
                    # Make sure index is valid
                    if 0 <= index < len(options):
                        question["answer"] = options[index]
                        print(f"Converting parenthesized letter answer '{answer}' to full text: '{question['answer']}'")
                # If answer is not in the options, default to the first option
                elif answer not in options:
                    print(f"Answer '{answer}' not found in options, setting to first option")
                    question["answer"] = options[0]
        
        # Create the assessment result
        assessment_result = AssessmentResult(
            id=f"assessment-{uuid.uuid4()}",
            title=parsed_response.get("title", f"{request.topic} Assessment"),
            gradeLevel=parsed_response.get("gradeLevel", request.gradeLevel),
            instructions=parsed_response.get("instructions", f"This assessment covers key concepts related to {request.topic}."),
            questions=questions,
            tags=parsed_response.get("tags", [request.topic.split(" ")[0], request.gradeLevel, *request.bloomsLevels]),
            createdAt=datetime.now().isoformat()
        )
        
        return assessment_result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate assessment: {str(e)}")

@app.post("/generate/lab", response_model=Lab)
async def generate_lab(request: LabRequest):
    """Generate a virtual lab based on the provided parameters"""
    try:
        prompt = f"""
        Create a detailed virtual lab about "{request.topic}" for grade level "{request.gradeLevel}".
        {f"Additional notes: {request.additionalNotes}" if request.additionalNotes else ""}
        
        Format your response as a JSON object with the following structure:
        {{
            "title": "Descriptive title for the lab",
            "description": "Brief description of the lab (1-2 sentences)",
            "category": "science category (physics, chemistry, biology, earth, etc.)",
            "gradeLevel": "{request.gradeLevel}",
            "objectives": ["learning objective 1", "learning objective 2", ...],
            "steps": [
                {{
                    "title": "Step 1 title",
                    "description": "Detailed description of step 1"
                }},
                ...
            ],
            "questions": [
                {{
                    "text": "Question to consider during the lab",
                    "hint": "Optional hint for the question"
                }},
                ...
            ],
            "tags": ["relevant", "tags", "for", "this", "lab"]
        }}

        IMPORTANT: Your response must be a valid JSON object with no additional text before or after.
        """
        
        model = get_model_by_id(request.model)
        if not model:
            raise HTTPException(status_code=400, detail=f"Invalid model ID: {request.model}")
            
        # Calculate optimal max_tokens based on model's context length
        # For very large models, we can use more tokens for output
        context_length = model["context_length"]
        max_tokens = min(8000, context_length // 4)  # Cap at 8000 but use up to 1/4 of context window
        
        # Special case for the largest models
        if context_length >= 500000:  # For models like Llama 4 Scout and Gemini
            max_tokens = min(12000, context_length // 8)  # Allow up to 12K tokens for massive models
            
        response = await generate_content(
            prompt=prompt,
            model_id=request.model,
            temperature=0.7,
            max_tokens=max_tokens
        )
        
        parsed_response = sanitize_and_parse_json(response)
        
        # For labs, we'll use preset thumbnails and URLs based on the category
        lab_resources = {
            "physics": {
                "thumbnail": "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc-600.png",
                "url": "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html"
            },
            "chemistry": {
                "thumbnail": "https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations-600.png",
                "url": "https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations_en.html"
            },
            "biology": {
                "thumbnail": "https://cdn.britannica.com/31/123131-050-8BA9CC21/animal-cell.jpg",
                "url": "https://learn.genetics.utah.edu/content/cells/insideacell/"
            },
            "earth": {
                "thumbnail": "https://phet.colorado.edu/sims/html/plate-tectonics/latest/plate-tectonics-600.png",
                "url": "https://phet.colorado.edu/sims/html/plate-tectonics/latest/plate-tectonics_en.html"
            }
        }

        category = parsed_response.get("category", "").lower() or "physics"
        resources = lab_resources.get(category, lab_resources["physics"])
        
        # Create the lab result
        lab_result = Lab(
            id=f"lab-{uuid.uuid4()}",
            title=parsed_response.get("title", f"{request.topic} Lab"),
            description=parsed_response.get("description", f"An interactive lab about {request.topic}."),
            category=parsed_response.get("category", "physics").lower(),
            gradeLevel=parsed_response.get("gradeLevel", request.gradeLevel),
            thumbnail=resources["thumbnail"],
            url=resources["url"],
            objectives=parsed_response.get("objectives", []),
            steps=parsed_response.get("steps", []),
            questions=parsed_response.get("questions", []),
            tags=parsed_response.get("tags", [request.topic.split(" ")[0], request.gradeLevel, "Lab"])
        )
        
        return lab_result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate lab: {str(e)}")

@app.post("/generate/teaching-tip")
async def generate_teaching_tip(request: TeachingTipRequest):
    """Generate a teaching tip for the specified subject"""
    try:
        # Validate the input
        if not request.subject:
            raise HTTPException(status_code=400, detail="Subject is required")
            
        # Get the best model to use - either the requested one or a substitute if rate limited
        model_id = model_manager.get_best_model(request.model)
        
        # If we're using a different model than requested, log it
        if model_id != request.model:
            logger.info(f"Using alternative model {model_id} instead of requested {request.model}")
            
        # Validate the model
        model = get_model_by_id(model_id)
        if not model:
            raise HTTPException(status_code=400, detail=f"Invalid model ID: {model_id}")
        
        # Check the subject-specific cache first
        subject_key = request.subject.lower()
        cache_key = f"{subject_key}:{model_id}"
        
        if cache_key in TEACHING_TIP_CACHE:
            cache_entry = TEACHING_TIP_CACHE[cache_key]
            # If cache is still valid (less than 24 hours old)
            if time.time() - cache_entry["timestamp"] < CACHE_EXPIRY:
                logger.info(f"Using cached teaching tip for subject: {subject_key}")
                return {"tip": cache_entry["tip"]}
        
        # Create a well-formatted prompt
        prompt = f"""
        Generate a concise, helpful teaching tip for educators teaching {request.subject}.
        The tip should be practical, evidence-based, and immediately applicable in a classroom setting.
        Response should be a single paragraph of 1-3 sentences.
        """
            
        # For teaching tips, we want concise responses
        max_tokens = 300
            
        # Log the request
        logger.info(f"Generating teaching tip for subject: {request.subject} using model: {model_id}")

        # Call the OpenRouter API
        try:
            response = await generate_content(
                prompt=prompt,
                model_id=model_id,
                system_prompt=get_system_prompt("education"),
                temperature=0.7,
                max_tokens=max_tokens
            )
            
            # Validate the response is not empty
            if not response or not response.strip():
                logger.warning("Empty response received from model")
                raise ValueError("Empty response received from model")
                
            # Save to cache
            TEACHING_TIP_CACHE[cache_key] = {
                "tip": response.strip(),
                "timestamp": time.time()
            }
            
            # Trim cache if it gets too large (keep most recent 100 entries)
            if len(TEACHING_TIP_CACHE) > 100:
                # Sort by timestamp and keep only the most recent entries
                sorted_keys = sorted(TEACHING_TIP_CACHE.keys(), 
                                    key=lambda k: TEACHING_TIP_CACHE[k]["timestamp"], 
                                    reverse=True)
                # Remove oldest entries
                for key in sorted_keys[100:]:
                    del TEACHING_TIP_CACHE[key]
            
            # Return the response
            result = {"tip": response.strip()}
            logger.info(f"Successfully generated teaching tip: {result['tip'][:50]}...")
            return result
            
        except Exception as api_error:
            # Record the error for this model
            model_manager.record_error(model_id)
            
            error_message = str(api_error).lower()
            logger.error(f"Error during API call: {error_message}")
            
            # Check if this is a rate limit error
            if "rate limit" in error_message or "429" in error_message:
                logger.warning(f"Rate limit error for model {model_id}")
                
                # Try with a different model if this was a rate limit error
                if model_id == request.model:  # Only retry once to avoid loops
                    alternative_model_id = model_manager.get_best_model(exclude_models=[model_id])
                    if alternative_model_id != model_id:
                        logger.info(f"Retrying with alternative model {alternative_model_id}")
                        request.model = alternative_model_id
                        return await generate_teaching_tip(request)
                
                # If retry not possible or this was already a retry, use fallback
                subject = request.subject.lower()
                
                # Find the most relevant tip based on subject
                tip = None
                for key, value in FALLBACK_TIPS.items():
                    if key in subject:
                        tip = value
                        break
                        
                # If no specific match, use the general education tip
                if not tip:
                    tip = FALLBACK_TIPS["education"]
                
                # Save fallback tip to cache with shorter expiration (4 hours)
                TEACHING_TIP_CACHE[cache_key] = {
                    "tip": tip,
                    "timestamp": time.time(),
                    "is_fallback": True
                }
                    
                logger.info(f"Returning fallback teaching tip for subject: {subject}")
                return {"tip": tip, "source": "fallback"}
            
            # For other errors, propagate the error
            raise HTTPException(
                status_code=502,
                detail=f"Error communicating with AI model: {str(api_error)}"
            )

    except HTTPException:
        # Re-raise HTTP exceptions directly
        raise
    except Exception as e:
        logger.error(f"Unexpected error in teaching tip endpoint: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate teaching tip: {str(e)}"
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"} 

@app.get("/status")
async def api_status():
    """Get comprehensive API status including rate limits and model availability"""
    try:
        # Test connection to OpenRouter with minimal call
        test_model = "meta-llama/llama-4-scout:free"
        test_prompt = "echo 'ok'"
        
        try:
            # Try a minimal API call
            await generate_content(
                prompt=test_prompt,
                model_id=test_model,
                max_tokens=10,
                temperature=0.1
            )
            openrouter_status = "ok"
        except Exception as e:
            error_message = str(e).lower()
            if "rate limit" in error_message or "429" in error_message:
                openrouter_status = "rate_limited"
            else:
                openrouter_status = "error"
            
        # Compile comprehensive status
        status = {
            "api": {
                "status": "ok",
                "timestamp": datetime.now().isoformat(),
                "uptime": "unknown",  # Could be implemented with server start time
            },
            "openrouter": {
                "status": openrouter_status,
                "models_count": len(get_available_models()),
                "recommended_models": RECOMMENDED_MODELS,
            },
            "model_manager": model_manager.get_model_stats(),
            "cache": {
                "teaching_tips": {
                    "size": len(TEACHING_TIP_CACHE),
                    "subjects": list(set(key.split(":")[0] for key in TEACHING_TIP_CACHE.keys())),
                }
            }
        }
        
        return status
    except Exception as e:
        logger.error(f"Error in status endpoint: {str(e)}")
        return {
            "api": {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        } 