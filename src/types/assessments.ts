export interface Question {
  text: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  options?: string[];
  answer?: string;
  bloomsLevel: string;
}

export interface AssessmentResult {
  id: string;
  title: string;
  gradeLevel: string;
  subject: string;
  instructions: string;
  questions: Question[];
  tags?: string[];
  createdAt: string;
}
