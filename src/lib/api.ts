
import { AssessmentResult } from "@/types/assessments";
import { LessonResult } from "@/types/lessons";
import { Lab } from "@/types/labs";
import { toast } from "sonner";
import { generateWithOpenRouter, OpenRouterModel } from "./openrouter";

export async function generateLesson(data: any, model: OpenRouterModel = "qwen"): Promise<LessonResult> {
  toast.info("Generating lesson plan with " + model + "...");
  
  try {
    const prompt = `
      Create a detailed lesson plan about "${data.topic}" for grade level "${data.gradeLevel}" with a duration of "${data.duration}".
      ${data.additionalNotes ? `Additional context: ${data.additionalNotes}` : ''}
      
      Format your response as a JSON object with the following structure:
      {
        "title": "Descriptive title for the lesson",
        "gradeLevel": "${data.gradeLevel}",
        "subject": "Subject area",
        "duration": "${data.duration}",
        "overview": "Brief overview of the lesson (1-2 paragraphs)",
        "objectives": ["learning objective 1", "learning objective 2", ...],
        "materials": ["material 1", "material 2", ...],
        "plan": "Detailed lesson plan with sections for introduction, instruction, practice, etc.",
        "assessment": "Description of assessment methods",
        "questions": [
          {
            "text": "Question text",
            "options": ["option 1", "option 2", "option 3", "option 4"],
            "answer": "Correct answer"
          },
          ...
        ],
        "tags": ["relevant", "tags", "for", "this", "lesson"]
      }
    `;

    const response = await generateWithOpenRouter(prompt, model);
    let parsedResponse: any;
    
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      parsedResponse = JSON.parse(jsonString);
    } catch (error) {
      console.error("Failed to parse response:", error);
      throw new Error("Failed to parse the generated lesson plan. Please try again.");
    }
    
    return {
      id: `lesson-${Date.now()}`,
      title: parsedResponse.title || `${data.topic} - Lesson Plan`,
      gradeLevel: parsedResponse.gradeLevel || data.gradeLevel,
      subject: parsedResponse.subject || data.topic.split(" ")[0],
      duration: parsedResponse.duration || data.duration,
      overview: parsedResponse.overview || "Overview not generated.",
      objectives: parsedResponse.objectives || [],
      materials: parsedResponse.materials || [],
      plan: parsedResponse.plan || "Plan not generated.",
      assessment: parsedResponse.assessment || "Assessment not generated.",
      questions: parsedResponse.questions || [],
      tags: parsedResponse.tags || [data.topic.split(" ")[0], data.gradeLevel, "Lesson Plan"],
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Failed to generate lesson:", error);
    toast.error("Failed to generate lesson plan. Please try again.");
    throw error;
  }
}

export async function generateAssessment(data: any, model: OpenRouterModel = "qwen"): Promise<AssessmentResult> {
  toast.info("Generating assessment with " + model + "...");
  
  try {
    const prompt = `
      Create a detailed assessment about "${data.topic}" for grade level "${data.gradeLevel}" with ${data.numberOfQuestions} questions.
      Question types to include: ${data.questionTypes.join(", ")}
      Bloom's taxonomy levels to target: ${data.bloomsLevels.join(", ")}
      ${data.additionalInstructions ? `Additional instructions: ${data.additionalInstructions}` : ''}
      
      Format your response as a JSON object with the following structure:
      {
        "title": "Descriptive title for the assessment",
        "gradeLevel": "${data.gradeLevel}",
        "instructions": "Instructions for taking the assessment",
        "questions": [
          {
            "text": "Question text",
            "type": "one of: multiple-choice, true-false, short-answer, essay",
            "options": ["option 1", "option 2", "option 3", "option 4"] (for multiple-choice and true-false only),
            "answer": "Correct answer or sample answer",
            "bloomsLevel": "Targeted Bloom's level"
          },
          ...
        ],
        "tags": ["relevant", "tags", "for", "this", "assessment"]
      }
    `;

    const response = await generateWithOpenRouter(prompt, model);
    let parsedResponse: any;
    
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      parsedResponse = JSON.parse(jsonString);
    } catch (error) {
      console.error("Failed to parse response:", error);
      throw new Error("Failed to parse the generated assessment. Please try again.");
    }
    
    return {
      id: `assessment-${Date.now()}`,
      title: parsedResponse.title || `${data.topic} Assessment`,
      gradeLevel: parsedResponse.gradeLevel || data.gradeLevel,
      instructions: parsedResponse.instructions || `This assessment covers key concepts related to ${data.topic}.`,
      questions: parsedResponse.questions || [],
      tags: parsedResponse.tags || [data.topic.split(" ")[0], data.gradeLevel, ...data.bloomsLevels],
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Failed to generate assessment:", error);
    toast.error("Failed to generate assessment. Please try again.");
    throw error;
  }
}

export async function generateLab(data: any, model: OpenRouterModel = "qwen"): Promise<Lab> {
  toast.info("Generating lab simulation with " + model + "...");
  
  try {
    const prompt = `
      Create a detailed virtual lab about "${data.topic}" for grade level "${data.gradeLevel}".
      
      Format your response as a JSON object with the following structure:
      {
        "title": "Descriptive title for the lab",
        "description": "Brief description of the lab (1-2 sentences)",
        "category": "science category (physics, chemistry, biology, earth, etc.)",
        "gradeLevel": "${data.gradeLevel}",
        "objectives": ["learning objective 1", "learning objective 2", ...],
        "steps": [
          {
            "title": "Step 1 title",
            "description": "Detailed description of step 1"
          },
          ...
        ],
        "questions": [
          {
            "text": "Question to consider during the lab",
            "hint": "Optional hint for the question"
          },
          ...
        ],
        "tags": ["relevant", "tags", "for", "this", "lab"]
      }
    `;

    const response = await generateWithOpenRouter(prompt, model);
    let parsedResponse: any;
    
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      parsedResponse = JSON.parse(jsonString);
    } catch (error) {
      console.error("Failed to parse response:", error);
      throw new Error("Failed to parse the generated lab simulation. Please try again.");
    }

    // For labs, we'll use preset thumbnails and URLs based on the category
    const labResources: Record<string, { thumbnail: string, url: string }> = {
      physics: {
        thumbnail: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc-600.png",
        url: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html"
      },
      chemistry: {
        thumbnail: "https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations-600.png",
        url: "https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations_en.html"
      },
      biology: {
        thumbnail: "https://cdn.britannica.com/31/123131-050-8BA9CC21/animal-cell.jpg",
        url: "https://learn.genetics.utah.edu/content/cells/insideacell/"
      },
      earth: {
        thumbnail: "https://phet.colorado.edu/sims/html/plate-tectonics/latest/plate-tectonics-600.png",
        url: "https://phet.colorado.edu/sims/html/plate-tectonics/latest/plate-tectonics_en.html"
      }
    };

    const category = parsedResponse.category?.toLowerCase() || "physics";
    const resources = labResources[category] || labResources.physics;
    
    return {
      id: `lab-${Date.now()}`,
      title: parsedResponse.title || `${data.topic} Lab`,
      description: parsedResponse.description || `An interactive lab about ${data.topic}.`,
      category: parsedResponse.category?.toLowerCase() || "physics",
      gradeLevel: parsedResponse.gradeLevel || data.gradeLevel,
      thumbnail: resources.thumbnail,
      url: resources.url,
      objectives: parsedResponse.objectives || [],
      steps: parsedResponse.steps || [],
      questions: parsedResponse.questions || [],
      tags: parsedResponse.tags || [data.topic.split(" ")[0], data.gradeLevel, "Lab"]
    };
  } catch (error) {
    console.error("Failed to generate lab:", error);
    toast.error("Failed to generate lab simulation. Please try again.");
    throw error;
  }
}
