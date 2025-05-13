import { useSupabaseData } from './useSupabaseHook';
import { Template } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

// Mock user for demo purposes - using a proper UUID format
// const CURRENT_USER_ID = '00000000-0000-0000-0000-000000000000'; // Using a nil UUID for demo

// Sample templates
const DEFAULT_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Lab Report Template',
    description: 'Standard template for science lab reports',
    content: {
      sections: [
        { title: 'Purpose', content: '', placeholder: 'Describe the purpose of this experiment' },
        { title: 'Materials', content: '', placeholder: 'List all materials used' },
        { title: 'Procedure', content: '', placeholder: 'List the steps of the experiment in order' },
        { title: 'Results', content: '', placeholder: 'Record your observations and data' },
        { title: 'Discussion', content: '', placeholder: 'Analyze your results and discuss what they mean' },
        { title: 'Conclusion', content: '', placeholder: 'Summarize your findings and their significance' }
      ]
    },
    category: 'Science',
    tags: ['lab report', 'science', 'experiment'],
    created_by: 'anonymous',
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Essay Outline',
    description: 'Standard 5-paragraph essay structure',
    content: {
      sections: [
        { title: 'Introduction', content: '', placeholder: 'Hook, background information, and thesis statement' },
        { title: 'Body Paragraph 1', content: '', placeholder: 'Topic sentence, evidence, analysis, transition' },
        { title: 'Body Paragraph 2', content: '', placeholder: 'Topic sentence, evidence, analysis, transition' },
        { title: 'Body Paragraph 3', content: '', placeholder: 'Topic sentence, evidence, analysis, transition' },
        { title: 'Conclusion', content: '', placeholder: 'Restate thesis, summarize key points, closing thought' }
      ]
    },
    category: 'English',
    tags: ['essay', 'writing', 'outline'],
    created_by: 'anonymous',
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Math Quiz Template',
    description: 'Structure for creating math quizzes',
    content: {
      sections: [
        { title: 'Multiple Choice', content: '', placeholder: '5 multiple choice questions' },
        { title: 'Short Answer', content: '', placeholder: '3 short answer questions' },
        { title: 'Problem Solving', content: '', placeholder: '2 multi-step problems' }
      ],
      settings: {
        timeLimit: 30,
        totalPoints: 20,
        shuffleQuestions: true
      }
    },
    category: 'Math',
    tags: ['quiz', 'assessment', 'math'],
    created_by: 'anonymous',
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Lesson Plan Template',
    description: 'Standard lesson plan structure',
    content: {
      sections: [
        { title: 'Objectives', content: '', placeholder: 'Learning objectives for this lesson' },
        { title: 'Standards', content: '', placeholder: 'Applicable curriculum standards' },
        { title: 'Materials', content: '', placeholder: 'Materials needed for this lesson' },
        { title: 'Warm-up', content: '', placeholder: '5-10 minute activity to begin class' },
        { title: 'Direct Instruction', content: '', placeholder: 'Main teaching portion' },
        { title: 'Guided Practice', content: '', placeholder: 'Activity with teacher guidance' },
        { title: 'Independent Practice', content: '', placeholder: 'Activity students complete on their own' },
        { title: 'Assessment', content: '', placeholder: 'How learning will be assessed' },
        { title: 'Closure', content: '', placeholder: 'Activity to conclude the lesson' },
        { title: 'Differentiation', content: '', placeholder: 'Modifications for different learners' }
      ]
    },
    category: 'Lesson Planning',
    tags: ['lesson plan', 'teaching'],
    created_by: 'anonymous',
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export function useTemplates() {
  const {
    data: templates,
    loading,
    error,
    addItem: addTemplate,
    updateItem: updateTemplate,
    deleteItem: deleteTemplate,
    queryByField,
    isUsingFallback
  } = useSupabaseData<Template>('templates', 'edgenie_templates', DEFAULT_TEMPLATES);

  // Get all categories
  const getCategories = () => {
    const categories = new Set<string>();
    templates.forEach(template => {
      if (template.category) {
        categories.add(template.category);
      }
    });
    return Array.from(categories);
  };

  // Get all tags
  const getTags = () => {
    const tags = new Set<string>();
    templates.forEach(template => {
      if (template.tags && Array.isArray(template.tags)) {
        template.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  };

  // Filter templates by category
  const filterByCategory = (category: string) => {
    return templates.filter(template => template.category === category);
  };

  // Filter templates by tag
  const filterByTag = (tag: string) => {
    return templates.filter(template => 
      template.tags && Array.isArray(template.tags) && template.tags.includes(tag)
    );
  };

  // Search templates by name or description
  const searchTemplates = (query: string) => {
    if (!query.trim()) return templates;
    
    const lowerQuery = query.toLowerCase();
    return templates.filter(template => 
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery)
    );
  };

  // Create a new template
  const createTemplate = async (
    name: string,
    description: string,
    content: Record<string, any>,
    category: string,
    tags: string[],
    isPublic: boolean = false
  ) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated. Cannot create template.");
    }

    const userId = user.id;

    return await addTemplate({
      name,
      description,
      content,
      category,
      tags,
      created_by: userId,
      is_public: isPublic
    });
  };

  // Clone an existing template
  const cloneTemplate = async (templateId: string, newName?: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');
    
    return await addTemplate({
      name: newName || `Copy of ${template.name}`,
      description: template.description,
      content: JSON.parse(JSON.stringify(template.content)), // Deep copy
      category: template.category,
      tags: [...template.tags],
      created_by: 'anonymous',
      is_public: false
    });
  };

  // Use a template (creates a new content based on template)
  const useTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');
    
    return {
      templateId: template.id,
      templateName: template.name,
      content: JSON.parse(JSON.stringify(template.content)) // Deep copy
    };
  };

  // Get templates created by the current user
  const getUserTemplates = () => {
    return templates.filter(t => t.created_by === 'anonymous');
  };

  return {
    templates,
    loading,
    error,
    getCategories,
    getTags,
    filterByCategory,
    filterByTag,
    searchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    cloneTemplate,
    useTemplate,
    getUserTemplates,
    isUsingFallback
  };
}