export interface LessonResult {
  id: string;
  title: string;
  gradeLevel: string;
  subject: string;
  duration: string;
  overview: string;
  objectives: string[];
  materials: string[];
  plan: string | any;  // Updated to handle non-string values
  assessment: string;
  questions?: {
    text: string;
    options?: string[];
    answer?: string;
    bloomsLevel?: string;  // Added bloomsLevel property
  }[];
  tags: string[];
  createdAt: string;
  timestamp?: number;  // For tracking when the lesson was last viewed
  savedAt?: string;    // For tracking when the lesson was saved
}
