from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
import fitz  # PyMuPDF
import numpy as np
import faiss
from typing import Optional, List
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, auth, firestore, storage
from dotenv import load_dotenv
import tempfile
from pytube import YouTube
from youtube_transcript_api import YouTubeTranscriptApi
import json

# Load environment variables
load_dotenv()

# Initialize Firebase Admin
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET', 'eduprep-ai.appspot.com')
})

# Initialize Firestore
db = firestore.client()

# Initialize Firebase Storage
bucket = storage.bucket()

# Initialize Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')
rag_model = genai.GenerativeModel('gemini-1.5-flash')

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your Flutter app's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LessonPlanRequest(BaseModel):
    syllabus: str
    grade: str
    subject: str
    token: str

class LessonPlanResponse(BaseModel):
    plan: str
    created_at: datetime

class SummaryResponse(BaseModel):
    title: str
    summary: str
    notes: str
    original_file_url: str
    content_type: str
    created_at: datetime

# Quiz generation models
class QuizOption(BaseModel):
    id: str  # A, B, C, D
    text: str

class QuizQuestion(BaseModel):
    question: str
    options: List[QuizOption]
    correctAnswer: str  # A, B, C, D
    bloomTag: str  # Knowledge, Understand, Apply, Analyze, Evaluate, Create

class QuizGenerationRequest(BaseModel):
    content: str
    numQuestions: int
    token: str
    title: str

class QuizGenerationResponse(BaseModel):
    title: str
    questions: List[QuizQuestion]
    created_at: datetime

# Speech-to-Plan Models
class SpeechToPlanRequest(BaseModel):
    transcript: str
    token: str

class SpeechToPlanResponse(BaseModel):
    plan: str
    generated_at: datetime

# Lesson Simulator Models
class LessonSimulationRequest(BaseModel):
    lesson_plan: str
    teacher_ideas: str
    student_age: int
    class_size: int
    subject_complexity: str # e.g., "beginner", "intermediate", "advanced"
    transcript: Optional[str] = None
    token: str

class SimulationFeedbackData(BaseModel):
    student_reactions: List[str]
    questions: List[str]
    suggestions: List[str]
    problem_areas: List[str]
    tone_feedback: Optional[str] = None
    improvement_tips: List[str]
    timestamp: datetime

# PDF related models
class QuizPdfRequest(BaseModel):
    file: Optional[UploadFile] = None
    youtube_url: Optional[str] = None
    numQuestions: int
    token: str
    title: Optional[str] = None

async def verify_token(token: str):
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token['uid']
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

@app.post("/api/generate-lesson-plan", response_model=LessonPlanResponse)
async def generate_lesson_plan(request: LessonPlanRequest):
    # Verify Firebase token
    user_id = await verify_token(request.token)
    
    try:
        # Generate lesson plan using Gemini
        prompt = f"""Generate a detailed lesson plan with objectives, activities, and materials for: {request.subject} ({request.grade}) on the topic: {request.syllabus}

Please include:
1. Learning Objectives
2. Required Materials
3. Lesson Structure (with time allocations)
4. Teaching Methods
5. Student Activities
6. Assessment Methods
7. Differentiation Strategies
8. Homework/Extension Activities

Format the response in markdown."""

        response = model.generate_content(prompt)
        generated_plan = response.text
        created_at = datetime.now()

        # Save to Firestore
        doc_ref = db.collection(f'users/{user_id}/lessonPlans').document()
        doc_ref.set({
            'syllabus': request.syllabus,
            'grade': request.grade,
            'subject': request.subject,
            'plan': generated_plan,
            'createdAt': created_at.isoformat(),
            'userId': user_id
        })

        return LessonPlanResponse(
            plan=generated_plan,
            created_at=created_at
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/speech-to-plan", response_model=SpeechToPlanResponse)
async def generate_speech_to_plan(request: SpeechToPlanRequest):
    uid = await verify_token(request.token) # Verify token from request body
    try:
        prompt = f"""
You are an expert instructional designer. A teacher has provided the following idea or topic for a lesson through a voice transcript:
'{request.transcript}'

Based on this, generate a comprehensive and structured lesson plan suitable for a classroom setting.
If the transcript mentions a specific grade or subject, use that. Otherwise, try to infer it or make a general assumption (e.g., middle school general topic).

The lesson plan should include, but not be limited to:
1.  **Lesson Title:** (A concise and descriptive title)
2.  **Learning Objectives:** (What students will know or be able to do - clear, measurable objectives)
3.  **Target Audience/Grade Level:** (Specify or infer)
4.  **Materials & Resources:** (List of necessary items, including any digital tools)
5.  **Lesson Activities & Procedure:** (A step-by-step breakdown, including approximate timings for each section: Introduction, Main Activities, Conclusion)
6.  **Differentiated Instruction:** (Suggestions for supporting diverse learners, e.g., for struggling students and for advanced learners)
7.  **Assessment:** (How learning will be checked, e.g., questions to ask, a short activity, exit ticket)
8.  **Estimated Total Duration:** (Approximate total time for the lesson)

Format the entire response in Markdown.
Ensure the plan is practical and engaging.
If the transcript is too short, unclear, or lacks sufficient detail to create a meaningful lesson plan, please state that you need more information and suggest what kind of details would be helpful. Do not attempt to generate a plan from insufficient input.
"""

        gemini_response = model.generate_content(prompt)
        generated_plan = gemini_response.text
        generated_at = datetime.now()

        # Optional: You could also save this generated plan to Firestore here if desired,
        # similar to the other lesson plan endpoint, associating it with the user (uid).
        # For now, just returning it as per the immediate requirement.

        return SpeechToPlanResponse(
            plan=generated_plan,
            generated_at=generated_at
        )
    except Exception as e:
        print(f"Error in generate_speech_to_plan: {e}") # Log the error server-side
        raise HTTPException(status_code=500, detail=f"An error occurred while generating the lesson plan: {str(e)}")

@app.post("/api/v1/simulate-lesson", response_model=SimulationFeedbackData)
async def simulate_lesson_endpoint(request: LessonSimulationRequest):
    user_id = await verify_token(request.token)
    current_time = datetime.now()

    # Prepare input for Firestore (excluding the token)
    input_data_for_firestore = {
        "lesson_plan": request.lesson_plan,
        "teacher_ideas": request.teacher_ideas,
        "student_age": request.student_age,
        "class_size": request.class_size,
        "subject_complexity": request.subject_complexity,
        "transcript": request.transcript,
    }

    # Construct the prompt for Gemini
    # This prompt needs to be carefully engineered to request JSON output.
    prompt_parts = [
        f"You are an AI simulating a classroom to evaluate a lesson plan.",
        f"The lesson plan is: '{request.lesson_plan}'.",
        f"Additional teacher ideas/comments for delivery: '{request.teacher_ideas}'.",
        f"The target students are {request.student_age} years old.",
        f"The class size is {request.class_size} students.",
        f"The subject complexity is '{request.subject_complexity}'.",
    ]
    if request.transcript:
        prompt_parts.append(f"The teacher's speech transcript for part of the lesson is: '{request.transcript}'. Analyze this for pacing and clarity.")
    
    prompt_parts.extend([
        f"Based on this, simulate student interactions and provide feedback.",
        f"Please format your entire response as a single JSON object with the following keys:",
        f"  'student_reactions': A list of 3-5 diverse, typical student reactions or comments (e.g., 'This is engaging!', 'I'm a bit confused about X', 'Can we do an example?').",
        f"  'questions': A list of 2-3 pertinent questions students might ask based on the plan.",
        f"  'suggestions': A list of 2-3 actionable suggestions for improving the lesson's engagement, clarity, or structure.",
        f"  'problem_areas': A list of 1-2 potential problem areas or parts of the lesson where students might struggle.",
        f"  'tone_feedback': If a transcript was provided, a brief comment on the perceived tone, pacing, or clarity from the transcript (e.g., 'The explanation of the core concept seemed a bit fast.'). Otherwise, null.",
        f"  'improvement_tips': A list of 2-3 general teaching improvement tips relevant to the lesson plan.",
        f"Example of a student_reaction: 'The activity for XYZ seems fun!'",
        f"Example of a question: 'What's the difference between A and B again?'",
        f"Ensure all lists contain strings. Do not include any explanatory text outside of the JSON object itself."
    ])
    final_prompt = "\n".join(prompt_parts)

    try:
        gemini_response = model.generate_content(final_prompt)
        
        # Debug: Print raw Gemini response
        print(f"Raw Gemini Response for simulation: {gemini_response.text}")

        # Attempt to parse the response as JSON
        # Gemini might sometimes include markdown backticks around the JSON, try to remove them.
        cleaned_response_text = gemini_response.text.strip()
        if cleaned_response_text.startswith('```json'):
            cleaned_response_text = cleaned_response_text[7:]
        if cleaned_response_text.endswith('```'):
            cleaned_response_text = cleaned_response_text[:-3]
        
        feedback_json = json.loads(cleaned_response_text.strip())

        # Validate and structure the feedback using Pydantic model
        # The timestamp for the feedback itself is when it's processed by our server
        feedback_data = SimulationFeedbackData(
            student_reactions=feedback_json.get('student_reactions', []),
            questions=feedback_json.get('questions', []),
            suggestions=feedback_json.get('suggestions', []),
            problem_areas=feedback_json.get('problem_areas', []),
            tone_feedback=feedback_json.get('tone_feedback'),
            improvement_tips=feedback_json.get('improvement_tips', []),
            timestamp=current_time
        )

        # Save to Firestore
        simulation_doc_ref = db.collection('simulations').document(user_id).collection('user_simulations').document()
        simulation_doc_ref.set({
            'input_data': input_data_for_firestore,
            'feedback': feedback_data.model_dump(), # Use model_dump() for Pydantic v2
            'userId': user_id,
            'timestamp': current_time # Top-level timestamp for querying
        })

        return feedback_data

    except json.JSONDecodeError as e:
        print(f"JSONDecodeError parsing Gemini response: {e}")
        print(f"Problematic Gemini response text: {gemini_response.text}")
        raise HTTPException(status_code=500, detail="Error processing AI model's response: Invalid JSON format.")
    except Exception as e:
        print(f"Error in simulate_lesson_endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred during lesson simulation: {str(e)}")

# Helper functions for RAG
def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def get_youtube_transcript(video_id):
    """Get transcript from YouTube video"""
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        text = " ".join([entry["text"] for entry in transcript])
        return text
    except Exception as e:
        return None

def extract_youtube_id(url):
    """Extract YouTube video ID from URL"""
    try:
        if "youtu.be" in url:
            return url.split("/")[-1].split("?")[0]
        elif "youtube.com" in url:
            return url.split("v=")[1].split("&")[0]
    except:
        return None

def chunk_text(text, chunk_size=1000, overlap=200):
    """Split text into overlapping chunks"""
    chunks = []
    for i in range(0, len(text), chunk_size - overlap):
        chunk = text[i:i + chunk_size]
        if len(chunk) > 200:  # Only include chunks with meaningful content
            chunks.append(chunk)
    return chunks

def create_embeddings(chunks):
    """Create embeddings for text chunks using simple averaging"""
    # Mock implementation since we're not using actual embeddings here
    # In production, use gemini.embed_content() or similar
    return np.random.rand(len(chunks), 512).astype('float32')

def build_rag_index(chunks, embeddings):
    """Build RAG index using FAISS"""
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    return index, chunks

def rag_generate_summary(chunks, title):
    """Generate summary using RAG approach"""
    # Use first chunk as context for short documents, or combine multiple chunks for longer documents
    if len(chunks) <= 2:
        context = chunks[0] if chunks else ""
    else:
        # For longer documents, use selected chunks strategically
        # Use first chunk (introduction), middle chunk, and last chunk (conclusion)
        first_chunk = chunks[0]
        middle_chunk = chunks[len(chunks) // 2]
        last_chunk = chunks[-1]
        context = f"{first_chunk}\n\n...\n\n{middle_chunk}\n\n...\n\n{last_chunk}"
    
    prompt = f"""You are an educational content summarizer for teachers. Generate high-quality structured content for a document titled '{title}'. 

Your task is to create TWO CLEARLY SEPARATED SECTIONS:

# Summary

First, provide a concise yet comprehensive summary of the main concepts and ideas in the document. This should be approximately 3-5 paragraphs covering the key points.

## Teaching Notes

Second, create detailed teaching notes including:
- Key concepts and definitions
- Important facts or figures
- Suggested teaching approaches
- Student activities or discussion questions
- Additional resources or references

The content should be well-organized with proper markdown formatting (headings, bullet points, etc.).

SOURCE DOCUMENT CONTENT:
{context}

FORMAT YOUR RESPONSE EXACTLY AS REQUESTED WITH THE TWO CLEARLY SEPARATED SECTIONS.
"""
    try:
        response = rag_model.generate_content(prompt)
        return response.text
    except Exception as e:
        # Fallback content in case of API failure
        fallback = f"""# Summary

This is a summary for the document titled "{title}". The AI was unable to generate a complete summary due to a technical issue: {str(e)}

## Teaching Notes

- Consider reviewing the document manually
- Key points may include important concepts from the document
- Technical error details: {str(e)}
"""
        return fallback

@app.post("/api/summarize-resource", response_model=SummaryResponse)
async def summarize_resource(
    file: Optional[UploadFile] = File(None),
    youtube_url: Optional[str] = Form(None),
    token: str = Form(...),
    title: Optional[str] = Form(None)
):
    # Verify Firebase token
    user_id = await verify_token(token)
    
    try:
        content_type = ""
        file_path = None
        file_url = ""
        extracted_text = ""
        
        # Process file upload or YouTube URL
        if file:
            # Save uploaded file to temporary location
            content_type = "pdf" if file.filename.lower().endswith('.pdf') else "video"
            
            # Create temp file with proper extension
            with tempfile.NamedTemporaryFile(delete=False, suffix=f".{content_type}") as temp_file:
                file_path = temp_file.name
            
            # Write uploaded content to temp file
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Generate unique filename for storage
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            storage_filename = f"{timestamp}_{file.filename}"
            
            # Upload to Firebase Storage
            try:
                blob = bucket.blob(f"users/{user_id}/{storage_filename}")
                blob.upload_from_filename(file_path)
                blob.make_public()
                file_url = blob.public_url
            except Exception as e:
                # If storage upload fails, still try to process the file
                print(f"Firebase storage upload error: {str(e)}")
                file_url = f"local://{file.filename}"
            
            # Extract text based on content type
            if content_type == "pdf":
                try:
                    extracted_text = extract_text_from_pdf(file_path)
                except Exception as e:
                    raise HTTPException(
                        status_code=422, 
                        detail=f"Could not extract text from PDF: {str(e)}"
                    )
            else:
                # For video, we'd need a different approach (not implemented)
                extracted_text = "Video text extraction not implemented yet."
                
            # Clean up temporary file
            try:
                os.unlink(file_path)
            except:
                pass
            
            # Use filename as title if not provided
            if not title:
                title = file.filename
            
        elif youtube_url:
            content_type = "video"
            video_id = extract_youtube_id(youtube_url)
            
            if not video_id:
                raise HTTPException(status_code=400, detail="Invalid YouTube URL")
            
            # Get video metadata
            try:
                yt = YouTube(youtube_url)
                if not title:
                    title = yt.title
            except Exception as e:
                # If YouTube metadata retrieval fails, use URL as title
                if not title:
                    title = "YouTube Video"
                
            # Get transcript if available
            try:
                transcript = get_youtube_transcript(video_id)
                if transcript:
                    extracted_text = transcript
                else:
                    extracted_text = "No transcript available for this video."
            except Exception as e:
                extracted_text = f"Error retrieving transcript: {str(e)}"
                
            file_url = youtube_url
        else:
            raise HTTPException(status_code=400, detail="Either file or YouTube URL must be provided")
        
        # Process the extracted text using RAG
        if extracted_text:
            # Mock implementation of RAG for testing/demonstration
            if len(extracted_text) < 100:
                # Not enough text to process meaningfully
                summary = "# Summary\n\nThe provided content is too short to generate a meaningful summary."
                notes = "## Teaching Notes\n\nNot enough content to generate teaching notes."
            else:
                chunks = chunk_text(extracted_text)
                embeddings = create_embeddings(chunks)
                index, indexed_chunks = build_rag_index(chunks, embeddings)
                
                # Generate summary and notes
                try:
                    summary_content = rag_generate_summary(chunks, title)
                    
                    # Split the returned content into summary and notes
                    if "## Teaching Notes" in summary_content:
                        parts = summary_content.split("## Teaching Notes")
                        summary = parts[0].strip()
                        notes = "## Teaching Notes" + parts[1].strip()
                    else:
                        # If AI doesn't format as expected, provide reasonable fallback
                        summary = "# Summary\n\n" + summary_content
                        notes = "## Teaching Notes\n\nNo structured teaching notes were generated."
                except Exception as e:
                    # Fallback if Gemini API fails
                    print(f"Gemini API error: {str(e)}")
                    summary = "# Summary\n\nError generating summary with AI. Please try again later."
                    notes = "## Teaching Notes\n\nError generating teaching notes with AI. Please try again later."
            
            # Ensure the summary starts with a markdown heading
            if not summary.strip().startswith("#"):
                summary = "# Summary\n\n" + summary
            
            # Ensure the notes section starts with a proper markdown heading
            if not notes.strip().startswith("#"):
                notes = "## Teaching Notes\n\n" + notes
            
            # Process markdown to ensure compatibility with our custom renderer
            # Explicitly format markdown for better display
            summary = summary.replace("**", "**").replace("*", "*")
            notes = notes.replace("**", "**").replace("*", "*")
            
            # Format numbered lists appropriately
            # This ensures our regex in the Flutter app can recognize them
            summary_lines = summary.split("\n")
            processed_summary_lines = []
            for line in summary_lines:
                if line.strip() and line.strip()[0].isdigit() and "." in line:
                    number_end = line.find(".")
                    if number_end > 0 and number_end < 5:  # Reasonable digit length
                        indent = line.find(line.strip())
                        spaces = " " * indent if indent > 0 else ""
                        number = line.strip()[:number_end+1]
                        rest = line.strip()[number_end+1:].strip()
                        line = f"{spaces}{number} {rest}"
                processed_summary_lines.append(line)
            summary = "\n".join(processed_summary_lines)
            
            # Do the same for notes
            notes_lines = notes.split("\n")
            processed_notes_lines = []
            for line in notes_lines:
                if line.strip() and line.strip()[0].isdigit() and "." in line:
                    number_end = line.find(".")
                    if number_end > 0 and number_end < 5:  # Reasonable digit length
                        indent = line.find(line.strip())
                        spaces = " " * indent if indent > 0 else ""
                        number = line.strip()[:number_end+1]
                        rest = line.strip()[number_end+1:].strip()
                        line = f"{spaces}{number} {rest}"
                processed_notes_lines.append(line)
            notes = "\n".join(processed_notes_lines)
            
            created_at = datetime.now()
            
            # Save to Firestore
            try:
                doc_ref = db.collection(f'users/{user_id}/summaries').document()
                doc_ref.set({
                    'title': title,
                    'summary': summary,
                    'notes': notes,
                    'originalFileUrl': file_url,
                    'contentType': content_type,
                    'createdAt': created_at.isoformat(),
                    'userId': user_id
                })
            except Exception as e:
                # If Firestore save fails, still return the generated content
                print(f"Firestore save error: {str(e)}")
            
            return SummaryResponse(
                title=title,
                summary=summary,
                notes=notes,
                original_file_url=file_url,
                content_type=content_type,
                created_at=created_at
            )
        else:
            raise HTTPException(status_code=400, detail="Could not extract text from the provided resource")
            
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the full error for debugging
        import traceback
        traceback.print_exc()
        # Return a user-friendly error
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/api/generate-quiz", response_model=QuizGenerationResponse)
async def generate_quiz(request: QuizGenerationRequest):
    # Verify Firebase token
    user_id = await verify_token(request.token)
    
    try:
        # Generate quiz using Gemini
        prompt = f"""Generate {request.numQuestions} multiple-choice questions based on the following content. 
Each question must be tagged according to Bloom's Taxonomy (e.g., Knowledge, Understand, Apply, Analyze, Evaluate, Create).

Content: {request.content}

Format your response in the following JSON structure:
{{
  "questions": [
    {{
      "question": "Question text here",
      "options": [
        {{ "id": "A", "text": "Option A text" }},
        {{ "id": "B", "text": "Option B text" }},
        {{ "id": "C", "text": "Option C text" }},
        {{ "id": "D", "text": "Option D text" }}
      ],
      "correctAnswer": "A",
      "bloomTag": "Knowledge"
    }}
  ]
}}

Ensure each question is challenging but fair, and the options are all plausible but with only one correct answer.
Make sure to tag each question according to Bloom's Taxonomy level (Knowledge, Understand, Apply, Analyze, Evaluate, Create).
"""

        response = model.generate_content(prompt)
        
        # Parse the response
        import json
        import re
        
        # Extract JSON from the response
        response_text = response.text
        json_match = re.search(r'```json\n(.*?)\n```', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Try to find any JSON-like structure
            json_match = re.search(r'\{[\s\S]*"questions"[\s\S]*\}', response_text)
            if json_match:
                json_str = json_match.group(0)
            else:
                json_str = response_text
        
        try:
            parsed_response = json.loads(json_str)
        except json.JSONDecodeError:
            # If we can't parse JSON, create a structured response with an error message
            parsed_response = {
                "questions": [{
                    "question": "Error generating quiz. Please try again.",
                    "options": [
                        {"id": "A", "text": "Try again"},
                        {"id": "B", "text": "Use different content"},
                        {"id": "C", "text": "Contact support"},
                        {"id": "D", "text": "Report bug"}
                    ],
                    "correctAnswer": "A",
                    "bloomTag": "Knowledge"
                }]
            }
        
        # Format questions to match our model
        questions = []
        for q in parsed_response.get("questions", []):
            question = QuizQuestion(
                question=q.get("question", ""),
                options=[
                    QuizOption(id=opt.get("id", ""), text=opt.get("text", ""))
                    for opt in q.get("options", [])
                ],
                correctAnswer=q.get("correctAnswer", ""),
                bloomTag=q.get("bloomTag", "Knowledge")
            )
            questions.append(question)
        
        created_at = datetime.now()
        
        # Save to Firestore
        doc_ref = db.collection(f'users/{user_id}/quizzes').document()
        doc_ref.set({
            'title': request.title,
            'questions': [q.dict() for q in questions],
            'createdAt': created_at.isoformat(),
            'userId': user_id,
            'sourceType': 'manual',
            'pdfExported': False
        })
        
        return QuizGenerationResponse(
            title=request.title,
            questions=questions,
            created_at=created_at
        )
    
    except Exception as e:
        # Log the full error for debugging
        import traceback
        traceback.print_exc()
        # Return a user-friendly error
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/api/generate-quiz-from-file", response_model=QuizGenerationResponse)
async def generate_quiz_from_file(
    file: Optional[UploadFile] = File(None),
    youtube_url: Optional[str] = Form(None),
    num_questions: int = Form(5),
    token: str = Form(...),
    title: Optional[str] = Form(None)
):
    # Verify Firebase token
    user_id = await verify_token(token)
    
    try:
        content_type = ""
        file_path = None
        file_url = ""
        extracted_text = ""
        
        # Process file upload or YouTube URL
        if file:
            # Save uploaded file to temporary location
            content_type = "pdf" if file.filename.lower().endswith('.pdf') else "video"
            
            # Create temp file with proper extension
            with tempfile.NamedTemporaryFile(delete=False, suffix=f".{content_type}") as temp_file:
                file_path = temp_file.name
            
            # Write uploaded content to temp file
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Generate unique filename for storage
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            storage_filename = f"{timestamp}_{file.filename}"
            
            # Upload to Firebase Storage
            try:
                blob = bucket.blob(f"users/{user_id}/{storage_filename}")
                blob.upload_from_filename(file_path)
                blob.make_public()
                file_url = blob.public_url
            except Exception as e:
                # If storage upload fails, still try to process the file
                print(f"Firebase storage upload error: {str(e)}")
                file_url = f"local://{file.filename}"
            
            # Extract text based on content type
            if content_type == "pdf":
                try:
                    extracted_text = extract_text_from_pdf(file_path)
                except Exception as e:
                    raise HTTPException(
                        status_code=422, 
                        detail=f"Could not extract text from PDF: {str(e)}"
                    )
            else:
                # For video, we'd need a different approach (not implemented)
                extracted_text = "Video text extraction not implemented yet."
                
            # Clean up temporary file
            try:
                os.unlink(file_path)
            except:
                pass
            
            # Use filename as title if not provided
            if not title:
                title = file.filename
            
        elif youtube_url:
            content_type = "video"
            video_id = extract_youtube_id(youtube_url)
            
            if not video_id:
                raise HTTPException(status_code=400, detail="Invalid YouTube URL")
            
            # Get video metadata
            try:
                yt = YouTube(youtube_url)
                if not title:
                    title = yt.title
            except Exception as e:
                # If YouTube metadata retrieval fails, use URL as title
                if not title:
                    title = "YouTube Video"
                
            # Get transcript if available
            try:
                transcript = get_youtube_transcript(video_id)
                if transcript:
                    extracted_text = transcript
                else:
                    extracted_text = "No transcript available for this video."
            except Exception as e:
                extracted_text = f"Error retrieving transcript: {str(e)}"
                
            file_url = youtube_url
        else:
            raise HTTPException(status_code=400, detail="Either file or YouTube URL must be provided")
        
        # Generate quiz using the extracted text
        if extracted_text:
            # Create quiz generation request with extracted text
            quiz_request = QuizGenerationRequest(
                content=extracted_text,
                numQuestions=num_questions,
                token=token,
                title=title
            )
            
            # Use the existing quiz generation endpoint
            return await generate_quiz(quiz_request)
        else:
            raise HTTPException(status_code=400, detail="Could not extract text from the provided resource")
            
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the full error for debugging
        import traceback
        traceback.print_exc()
        # Return a user-friendly error
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 