export type ContentType = 'lesson' | 'lab' | 'assessment';

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  createdAt: string;
  updatedAt: string;
  contentId: string;
  version?: number;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  items: ContentItem[];
}

export interface FolderTree {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  children: FolderTree[];
  items: ContentItem[];
}

export interface RubricCriteria {
  id: string;
  name: string;
  description: string;
  levels: {
    score: number;
    description: string;
  }[];
}

export interface Rubric {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  criteria: RubricCriteria[];
  totalPoints: number;
}

export interface DifferentiationOption {
  id: string;
  name: string;
  description: string;
  modifications: {
    section: string;
    original: string;
    modified: string;
  }[];
}

export interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  data: any;
  createdAt: string;
  createdBy?: string;
  notes?: string;
} 