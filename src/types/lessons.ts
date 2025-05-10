
export interface LessonResult {
  id: string;
  title: string;
  gradeLevel: string;
  subject: string;
  duration: string;
  overview: string;
  objectives: string[];
  materials: string[];
  plan: string;
  assessment: string;
  questions?: {
    text: string;
    options?: string[];
    answer?: string;
  }[];
  tags: string[];
  createdAt: string;
}
