from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class Question(BaseModel):
    text: str
    options: Optional[List[str]] = None
    answer: Optional[str] = None
    
class LessonRequest(BaseModel):
    topic: str
    gradeLevel: str
    duration: str
    model: str
    additionalNotes: Optional[str] = None
    includeAssessment: bool = True
    includeActivities: bool = True

class Step(BaseModel):
    title: str
    description: str

class LabQuestion(BaseModel):
    text: str
    hint: Optional[str] = None

class LessonResult(BaseModel):
    id: str
    title: str
    gradeLevel: str
    subject: str
    duration: str
    overview: str
    objectives: List[str]
    materials: List[str]
    plan: Union[str, Dict[str, Any]]
    assessment: str
    questions: Optional[List[Question]] = []
    tags: List[str]
    createdAt: str

class AssessmentRequest(BaseModel):
    topic: str
    gradeLevel: str
    numberOfQuestions: int
    questionTypes: List[str]
    bloomsLevels: List[str]
    additionalInstructions: Optional[str] = None
    model: str

class AssessmentResult(BaseModel):
    id: str
    title: str
    gradeLevel: str
    instructions: str
    questions: List[Question]
    tags: List[str]
    createdAt: str

class LabRequest(BaseModel):
    topic: str
    gradeLevel: str
    model: str
    additionalNotes: Optional[str] = None

class Lab(BaseModel):
    id: str
    title: str
    description: str
    category: str
    gradeLevel: str
    thumbnail: str
    url: str
    objectives: List[str]
    steps: List[Step]
    questions: List[LabQuestion]
    tags: List[str]

class TeachingTipRequest(BaseModel):
    subject: str
    model: str

class ModelInfo(BaseModel):
    name: str
    id: str
    input_cost: str
    output_cost: str
    context_length: int
    is_free: bool = True 