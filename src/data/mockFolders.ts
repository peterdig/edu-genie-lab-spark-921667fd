import { Folder, ContentItem, Rubric, DifferentiationOption, ContentVersion } from "@/types/folders";
import { v4 as uuidv4 } from 'uuid';

// Mock content items
export const mockContentItems: ContentItem[] = [
  {
    id: uuidv4(),
    title: "Introduction to Photosynthesis",
    type: "lesson",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    contentId: "lesson-1",
    version: 1
  },
  {
    id: uuidv4(),
    title: "Cell Division Lab",
    type: "lab",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    contentId: "lab-1",
    version: 1
  },
  {
    id: uuidv4(),
    title: "Ecosystems Quiz",
    type: "assessment",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    contentId: "assessment-1",
    version: 1
  },
  {
    id: uuidv4(),
    title: "Newton's Laws of Motion",
    type: "lesson",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    contentId: "lesson-2",
    version: 2
  },
  {
    id: uuidv4(),
    title: "Gravity Simulation",
    type: "lab",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    contentId: "lab-2",
    version: 1
  }
];

// Mock folders
export const mockFolders: Folder[] = [
  {
    id: "folder-1",
    name: "Biology",
    description: "Biology lessons and materials",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    items: mockContentItems.filter(item => 
      ["Introduction to Photosynthesis", "Cell Division Lab", "Ecosystems Quiz"].includes(item.title)
    )
  },
  {
    id: "folder-2",
    name: "Physics",
    description: "Physics lessons and labs",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    items: mockContentItems.filter(item => 
      ["Newton's Laws of Motion", "Gravity Simulation"].includes(item.title)
    )
  },
  {
    id: "folder-3",
    name: "Chemistry",
    description: "Chemistry lessons and labs",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    items: []
  }
];

// Mock nested folder structure
export const mockFolderTree = [
  {
    id: "folder-1",
    name: "Biology",
    description: "Biology lessons and materials",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    children: [
      {
        id: "folder-1-1",
        name: "Plant Biology",
        description: "Plant biology topics",
        createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
        parentId: "folder-1",
        children: [],
        items: mockContentItems.filter(item => item.title === "Introduction to Photosynthesis")
      },
      {
        id: "folder-1-2",
        name: "Cell Biology",
        description: "Cell biology topics",
        createdAt: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        parentId: "folder-1",
        children: [],
        items: mockContentItems.filter(item => item.title === "Cell Division Lab")
      }
    ],
    items: mockContentItems.filter(item => item.title === "Ecosystems Quiz")
  },
  {
    id: "folder-2",
    name: "Physics",
    description: "Physics lessons and labs",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    children: [],
    items: mockContentItems.filter(item => 
      ["Newton's Laws of Motion", "Gravity Simulation"].includes(item.title)
    )
  },
  {
    id: "folder-3",
    name: "Chemistry",
    description: "Chemistry lessons and labs",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    children: [],
    items: []
  }
];

// Mock rubrics
export const mockRubrics: Rubric[] = [
  {
    id: uuidv4(),
    title: "Essay Writing Rubric",
    description: "Rubric for evaluating student essays",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    criteria: [
      {
        id: uuidv4(),
        name: "Content",
        description: "Depth and relevance of content",
        levels: [
          { score: 4, description: "Exceptional depth and relevance" },
          { score: 3, description: "Good depth and relevance" },
          { score: 2, description: "Adequate depth and relevance" },
          { score: 1, description: "Limited depth and relevance" }
        ]
      },
      {
        id: uuidv4(),
        name: "Organization",
        description: "Structure and flow of ideas",
        levels: [
          { score: 4, description: "Well-structured with seamless flow" },
          { score: 3, description: "Good structure with logical flow" },
          { score: 2, description: "Basic structure with some flow issues" },
          { score: 1, description: "Poor structure with disjointed flow" }
        ]
      },
      {
        id: uuidv4(),
        name: "Language",
        description: "Grammar, vocabulary, and style",
        levels: [
          { score: 4, description: "Sophisticated language use" },
          { score: 3, description: "Effective language use" },
          { score: 2, description: "Adequate language use" },
          { score: 1, description: "Limited language use" }
        ]
      }
    ],
    totalPoints: 12
  },
  {
    id: uuidv4(),
    title: "Science Project Rubric",
    description: "Rubric for evaluating science projects",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    criteria: [
      {
        id: uuidv4(),
        name: "Scientific Method",
        description: "Proper use of scientific method",
        levels: [
          { score: 5, description: "Exceptional application of scientific method" },
          { score: 4, description: "Strong application of scientific method" },
          { score: 3, description: "Adequate application of scientific method" },
          { score: 2, description: "Basic application of scientific method" },
          { score: 1, description: "Limited application of scientific method" }
        ]
      },
      {
        id: uuidv4(),
        name: "Data Collection",
        description: "Quality and quantity of data",
        levels: [
          { score: 5, description: "Comprehensive and accurate data" },
          { score: 4, description: "Substantial and mostly accurate data" },
          { score: 3, description: "Adequate data with some inaccuracies" },
          { score: 2, description: "Limited data with several inaccuracies" },
          { score: 1, description: "Minimal data with significant inaccuracies" }
        ]
      },
      {
        id: uuidv4(),
        name: "Presentation",
        description: "Quality of visual aids and explanation",
        levels: [
          { score: 5, description: "Outstanding presentation with clear explanation" },
          { score: 4, description: "Strong presentation with good explanation" },
          { score: 3, description: "Adequate presentation with basic explanation" },
          { score: 2, description: "Basic presentation with limited explanation" },
          { score: 1, description: "Poor presentation with unclear explanation" }
        ]
      }
    ],
    totalPoints: 15
  }
];

// Mock differentiation options
export const mockDifferentiationOptions: DifferentiationOption[] = [
  {
    id: uuidv4(),
    name: "ELL Support",
    description: "Modifications for English Language Learners",
    modifications: [
      {
        section: "Vocabulary",
        original: "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water.",
        modified: "Photosynthesis is how plants make food. Plants use sunlight, water, and air to make food. This happens in the green parts of plants."
      },
      {
        section: "Instructions",
        original: "Analyze the impact of varying light intensities on the rate of photosynthesis.",
        modified: "Look at how different amounts of light change how fast plants make food. More light = faster food making? Less light = slower food making?"
      }
    ]
  },
  {
    id: uuidv4(),
    name: "Advanced Learners",
    description: "Extensions for advanced students",
    modifications: [
      {
        section: "Additional Challenge",
        original: "Describe the process of photosynthesis.",
        modified: "Compare and contrast the light-dependent and light-independent reactions of photosynthesis, and explain how environmental factors might affect each stage differently."
      },
      {
        section: "Research Extension",
        original: "Research one application of photosynthesis.",
        modified: "Research current scientific efforts to artificially replicate photosynthesis for sustainable energy production. Evaluate the potential environmental and economic impacts of these technologies."
      }
    ]
  },
  {
    id: uuidv4(),
    name: "Visual Learners",
    description: "Adaptations for visual learning preferences",
    modifications: [
      {
        section: "Concept Explanation",
        original: "The water cycle involves evaporation, condensation, and precipitation.",
        modified: "The water cycle has three main parts (see diagram): 1) Evaporation: water rises from lakes/oceans as vapor, 2) Condensation: vapor forms clouds, 3) Precipitation: water falls as rain/snow."
      },
      {
        section: "Assessment",
        original: "Write a paragraph explaining the water cycle.",
        modified: "Create a labeled diagram of the water cycle. Include arrows to show the direction of water movement and brief annotations explaining each stage."
      }
    ]
  }
];

// Mock content versions
export const mockContentVersions: ContentVersion[] = [
  {
    id: uuidv4(),
    contentId: "lesson-1",
    version: 1,
    data: {
      title: "Introduction to Photosynthesis",
      content: "Initial version of the photosynthesis lesson."
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "Teacher",
    notes: "Initial creation"
  },
  {
    id: uuidv4(),
    contentId: "lesson-1",
    version: 2,
    data: {
      title: "Introduction to Photosynthesis",
      content: "Updated version with more detailed explanations and diagrams."
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "Teacher",
    notes: "Added more visuals and examples"
  },
  {
    id: uuidv4(),
    contentId: "lesson-2",
    version: 1,
    data: {
      title: "Newton's Laws of Motion",
      content: "Initial version covering the three laws of motion."
    },
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "Teacher",
    notes: "Initial creation"
  },
  {
    id: uuidv4(),
    contentId: "lesson-2",
    version: 2,
    data: {
      title: "Newton's Laws of Motion",
      content: "Updated with more real-world examples and practice problems."
    },
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "Teacher",
    notes: "Added practical applications"
  }
]; 