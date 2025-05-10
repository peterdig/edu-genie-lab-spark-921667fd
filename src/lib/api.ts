
import { AssessmentResult } from "@/types/assessments";
import { LessonResult } from "@/types/lessons";
import { toast } from "sonner";

// In a real implementation, these would be API calls to a backend
// For now, we'll simulate API responses

export async function generateLesson(data: any): Promise<LessonResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Generate a placeholder lesson result
  return {
    id: `lesson-${Date.now()}`,
    title: `${data.topic} - Comprehensive Lesson Plan`,
    gradeLevel: data.gradeLevel,
    subject: data.topic.split(" ")[0],
    duration: data.duration,
    overview: `This lesson introduces students to ${data.topic} through interactive activities and discussions. Students will develop a fundamental understanding of key concepts and apply their knowledge through hands-on exercises.`,
    objectives: [
      `Understand the fundamental concepts of ${data.topic}`,
      `Apply critical thinking skills to analyze ${data.topic}`,
      `Demonstrate knowledge through practical examples`,
      `Collaborate effectively in group activities related to ${data.topic}`
    ],
    materials: [
      "Textbook or reading materials",
      "Interactive whiteboard or presentation slides",
      "Student worksheets",
      "Assessment materials",
      "Lab equipment (if applicable)"
    ],
    plan: `Introduction (5-10 minutes):\nBegin the lesson by activating prior knowledge about ${data.topic}. Ask open-ended questions to gauge student understanding and spark interest.\n\nDirect Instruction (15-20 minutes):\nPresent key concepts related to ${data.topic} using visual aids and examples. Explain how these concepts connect to real-world applications.\n\nGuided Practice (10-15 minutes):\nLead students through example problems or scenarios. Model the thinking process and gradually release responsibility to students.\n\nIndependent/Group Work (15-20 minutes):\nStudents work individually or in small groups on activities that reinforce understanding of ${data.topic}. Circulate to provide feedback and support.\n\nClosure (5-10 minutes):\nReview key concepts and address any questions. Have students reflect on their learning through exit tickets or brief summary activities.`,
    assessment: `Formative assessment will occur throughout the lesson through questioning, observation, and guided practice. Summative assessment will include a combination of multiple-choice questions, short answer responses, and a performance task related to ${data.topic}.`,
    questions: [
      {
        text: `What is the primary purpose of studying ${data.topic}?`,
        options: [
          "To memorize facts and figures",
          "To develop critical thinking skills",
          "To understand real-world applications",
          "All of the above"
        ],
        answer: "All of the above"
      },
      {
        text: `Which of the following best demonstrates application of knowledge in ${data.topic}?`,
        options: [
          "Reciting definitions",
          "Solving a novel problem",
          "Watching a video",
          "Reading a textbook"
        ],
        answer: "Solving a novel problem"
      },
      {
        text: `How does ${data.topic} connect to other subjects or disciplines?`,
        answer: "Open-ended response"
      }
    ],
    tags: [data.topic.split(" ")[0], data.gradeLevel, "Lesson Plan"],
    createdAt: new Date().toISOString()
  };
}

export async function generateAssessment(data: any): Promise<AssessmentResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Map Bloom's levels to question complexity
  const bloomsMapping: Record<string, string[]> = {
    "remembering": ["recall", "identify", "list", "define"],
    "understanding": ["explain", "describe", "discuss", "summarize"],
    "applying": ["apply", "demonstrate", "solve", "use"],
    "analyzing": ["analyze", "compare", "contrast", "examine"],
    "evaluating": ["evaluate", "judge", "critique", "assess"],
    "creating": ["create", "design", "develop", "formulate"]
  };
  
  // Generate questions based on selected Bloom's levels
  const questions: any[] = [];
  const selectedLevels = data.bloomsLevels;
  const questionCount = parseInt(data.numberOfQuestions);
  
  // Distribute questions across selected levels and types
  let qNumber = 0;
  while (qNumber < questionCount) {
    for (const level of selectedLevels) {
      if (qNumber >= questionCount) break;
      
      const verbs = bloomsMapping[level] || ["identify"];
      const verb = verbs[Math.floor(Math.random() * verbs.length)];
      
      // Choose question type from selected types
      const type = data.questionTypes[Math.floor(Math.random() * data.questionTypes.length)];
      
      let question: any = {
        text: `${verb.charAt(0).toUpperCase() + verb.slice(1)} a key concept related to ${data.topic}.`,
        type: type,
        bloomsLevel: level.charAt(0).toUpperCase() + level.slice(1)
      };
      
      if (type === 'multiple-choice') {
        question.options = [
          "First option related to the topic",
          "Second option related to the topic",
          "Third option related to the topic",
          "Fourth option related to the topic"
        ];
        question.answer = question.options[0];
      } else if (type === 'true-false') {
        question.options = ["True", "False"];
        question.answer = "True";
      } else {
        question.answer = "This is a sample answer that would demonstrate understanding of the concept.";
      }
      
      questions.push(question);
      qNumber++;
    }
  }
  
  return {
    id: `assessment-${Date.now()}`,
    title: `${data.topic} Assessment`,
    gradeLevel: data.gradeLevel,
    instructions: `This assessment covers key concepts related to ${data.topic}. Read each question carefully and provide your best response. You will have 45 minutes to complete this assessment.`,
    questions: questions.slice(0, questionCount),
    tags: [data.topic.split(" ")[0], data.gradeLevel, ...data.bloomsLevels],
    createdAt: new Date().toISOString()
  };
}
