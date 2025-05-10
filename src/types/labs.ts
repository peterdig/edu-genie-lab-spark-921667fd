
export interface LabStep {
  title: string;
  description: string;
}

export interface LabQuestion {
  text: string;
  hint?: string;
}

export interface Lab {
  id: string;
  title: string;
  description: string;
  category: string;
  gradeLevel: string;
  thumbnail: string;
  url: string;
  objectives: string[];
  steps: LabStep[];
  questions: LabQuestion[];
  tags: string[];
}
