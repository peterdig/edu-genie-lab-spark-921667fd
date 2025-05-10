
import { AssessmentResult } from "@/types/assessments";
import { Lab } from "@/types/labs";
import { LessonResult } from "@/types/lessons";

// Mock lessons data
export const lessons: LessonResult[] = [
  {
    id: "lesson-1",
    title: "Photosynthesis - Comprehensive Lesson Plan",
    gradeLevel: "6-8",
    subject: "Science",
    duration: "45min",
    overview: "This lesson introduces students to photosynthesis through interactive activities and discussions. Students will develop a fundamental understanding of how plants convert light energy to chemical energy.",
    objectives: [
      "Understand the process of photosynthesis",
      "Identify the inputs and outputs of photosynthesis",
      "Explain the importance of photosynthesis for all living organisms",
      "Demonstrate knowledge through experimental activities"
    ],
    materials: [
      "Plant specimens",
      "Light sources",
      "CO2 indicators",
      "Worksheets",
      "Interactive models"
    ],
    plan: "Introduction (10 minutes):\nBegin the lesson by asking students what plants need to survive. Guide the discussion toward sunlight, water, and carbon dioxide.\n\nDirect Instruction (15 minutes):\nPresent the photosynthesis process using visual aids and animations. Explain the role of chlorophyll, stomata, and the transformation of light energy.\n\nGuided Practice (10 minutes):\nHave students create a flowchart of the photosynthesis process, labeling inputs and outputs.\n\nGroup Activity (15 minutes):\nStudents conduct a simple experiment measuring plant growth under different light conditions.\n\nClosure (5 minutes):\nReview key concepts and have students complete an exit ticket summarizing what they learned about photosynthesis.",
    assessment: "Formative assessment through questioning and observation. Summative assessment including diagram labeling, short answer responses, and a simple experimental design task related to photosynthesis.",
    questions: [
      {
        text: "Which of the following is NOT a product of photosynthesis?",
        options: [
          "Oxygen",
          "Carbon dioxide",
          "Glucose",
          "Water vapor"
        ],
        answer: "Carbon dioxide"
      },
      {
        text: "Where in the plant cell does photosynthesis primarily occur?",
        options: [
          "Chloroplasts",
          "Mitochondria",
          "Nucleus",
          "Cell wall"
        ],
        answer: "Chloroplasts"
      },
      {
        text: "Explain why photosynthesis is important for all living organisms, not just plants.",
        answer: "Photosynthesis produces oxygen that animals need for respiration and creates the basis for the food chain by converting sunlight into usable energy."
      }
    ],
    tags: ["Science", "Biology", "Plants", "Energy"],
    createdAt: "2023-05-10T15:45:00Z"
  },
  {
    id: "lesson-2",
    title: "World War II - Causes and Global Impact",
    gradeLevel: "9-12",
    subject: "History",
    duration: "60min",
    overview: "This lesson examines the complex factors that led to World War II and its profound global impact. Students will analyze primary sources and engage in critical discussions about this pivotal historical event.",
    objectives: [
      "Identify the major causes of World War II",
      "Analyze the global political climate of the 1930s",
      "Evaluate the impact of the Treaty of Versailles",
      "Recognize the roles of key historical figures"
    ],
    materials: [
      "Primary source documents",
      "Historical maps",
      "Documentary excerpts",
      "Timeline templates",
      "Analysis worksheets"
    ],
    plan: "Introduction (10 minutes):\nBegin with a brief video showing the state of Europe after WWI and the rise of fascism.\n\nDirect Instruction (20 minutes):\nPresent the major causes of WWII, including economic depression, nationalism, and the failure of the Treaty of Versailles.\n\nDocument Analysis (15 minutes):\nStudents work in pairs to analyze primary sources related to the outbreak of war.\n\nDiscussion (10 minutes):\nFacilitate a class discussion about the inevitability of WWII given the historical context.\n\nClosure (5 minutes):\nStudents create a cause-effect diagram connecting pre-war events to the outbreak of conflict.",
    assessment: "Formative assessment through document analysis and discussion participation. Summative assessment including an analytical essay and timeline creation.",
    questions: [
      {
        text: "Which of the following was NOT a cause of World War II?",
        options: [
          "The Great Depression",
          "The Treaty of Versailles",
          "The League of Nations' effectiveness",
          "The Russian Revolution"
        ],
        answer: "The Russian Revolution"
      },
      {
        text: "How did the Treaty of Versailles contribute to the outbreak of World War II?",
        options: [
          "It was too lenient on Germany",
          "It imposed harsh penalties on Germany, fostering resentment",
          "It created strong international peacekeeping mechanisms",
          "It established balanced power in Europe"
        ],
        answer: "It imposed harsh penalties on Germany, fostering resentment"
      },
      {
        text: "Compare and contrast the causes of World War I and World War II.",
        answer: "Open-ended response"
      }
    ],
    tags: ["History", "World War II", "20th Century", "Global Conflict"],
    createdAt: "2023-06-15T09:30:00Z"
  },
  {
    id: "lesson-3",
    title: "Fractions - Addition and Subtraction",
    gradeLevel: "3-5",
    subject: "Math",
    duration: "45min",
    overview: "This lesson teaches students how to add and subtract fractions with like and unlike denominators. Through visual models and hands-on activities, students will develop conceptual understanding and procedural fluency.",
    objectives: [
      "Add and subtract fractions with like denominators",
      "Find common denominators for unlike fractions",
      "Solve word problems involving fraction operations",
      "Use visual models to represent fraction operations"
    ],
    materials: [
      "Fraction manipulatives",
      "Fraction strips",
      "Worksheets",
      "Number lines",
      "Whiteboards"
    ],
    plan: "Introduction (5 minutes):\nReview fraction basics using visual models.\n\nDirect Instruction (15 minutes):\nTeach addition and subtraction with like denominators, then introduce finding common denominators for unlike fractions.\n\nGuided Practice (10 minutes):\nWork through example problems as a class, using fraction strips to visualize the operations.\n\nIndependent Practice (10 minutes):\nStudents solve practice problems independently, using manipulatives as needed.\n\nClosure (5 minutes):\nStudents share their strategies and solutions for selected problems.",
    assessment: "Formative assessment through observation and guided practice. Summative assessment through problem sets and performance tasks involving real-world applications.",
    questions: [
      {
        text: "What is 3/8 + 2/8?",
        options: [
          "5/8",
          "5/16",
          "3/10",
          "5/4"
        ],
        answer: "5/8"
      },
      {
        text: "To add 1/4 and 1/3, what common denominator could you use?",
        options: [
          "7",
          "12",
          "3",
          "4"
        ],
        answer: "12"
      },
      {
        text: "Maria ate 3/8 of a pizza on Monday and 1/4 of a pizza on Tuesday. How much pizza did she eat altogether?",
        answer: "5/8 of a pizza"
      }
    ],
    tags: ["Math", "Fractions", "Operations", "Elementary"],
    createdAt: "2023-09-22T13:15:00Z"
  }
];

// Mock assessments data
export const assessments: AssessmentResult[] = [
  {
    id: "assessment-1",
    title: "Photosynthesis Quiz",
    gradeLevel: "6-8",
    instructions: "Answer all questions to the best of your ability. You have 30 minutes to complete this assessment.",
    questions: [
      {
        text: "What gas do plants absorb during photosynthesis?",
        type: "multiple-choice",
        options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"],
        answer: "Carbon dioxide",
        bloomsLevel: "Remembering"
      },
      {
        text: "What organelle in plant cells is responsible for photosynthesis?",
        type: "multiple-choice",
        options: ["Chloroplast", "Mitochondrion", "Nucleus", "Vacuole"],
        answer: "Chloroplast",
        bloomsLevel: "Remembering"
      },
      {
        text: "Explain the relationship between photosynthesis and cellular respiration.",
        type: "short-answer",
        answer: "Photosynthesis creates glucose and oxygen from carbon dioxide and water using light energy. Cellular respiration uses that glucose and oxygen to create energy for the cell, producing carbon dioxide and water as byproducts. These processes form a cycle where the products of one become the reactants for the other.",
        bloomsLevel: "Understanding"
      },
      {
        text: "Why do leaves appear green?",
        type: "multiple-choice",
        options: [
          "Chlorophyll reflects green light",
          "Chlorophyll absorbs green light",
          "Leaves contain green pigments unrelated to photosynthesis",
          "Green is the natural color of all plant cells"
        ],
        answer: "Chlorophyll reflects green light",
        bloomsLevel: "Understanding"
      },
      {
        text: "Design an experiment to test how light intensity affects the rate of photosynthesis.",
        type: "essay",
        answer: "A well-designed experiment would include different light intensities as the independent variable, a way to measure photosynthetic rate (such as oxygen production or carbon dioxide consumption) as the dependent variable, and controls for other variables like temperature and CO2 availability.",
        bloomsLevel: "Creating"
      }
    ],
    tags: ["Science", "Biology", "Plants", "Middle School"],
    createdAt: "2023-09-15T10:30:00Z"
  },
  {
    id: "assessment-2",
    title: "American Revolution Assessment",
    gradeLevel: "9-12",
    instructions: "Complete all questions. Essay responses should be thorough and include specific historical examples.",
    questions: [
      {
        text: "Which event occurred first?",
        type: "multiple-choice",
        options: [
          "Boston Tea Party",
          "Signing of the Declaration of Independence",
          "Battle of Lexington and Concord",
          "Signing of the Constitution"
        ],
        answer: "Boston Tea Party",
        bloomsLevel: "Remembering"
      },
      {
        text: "The phrase 'No taxation without representation' refers to:",
        type: "multiple-choice",
        options: [
          "Colonists' objection to paying any taxes",
          "Colonists' desire for representatives in British Parliament",
          "British tax collectors living in the colonies",
          "A slogan from the French Revolution"
        ],
        answer: "Colonists' desire for representatives in British Parliament",
        bloomsLevel: "Understanding"
      },
      {
        text: "Analyze how economic factors contributed to the American Revolution.",
        type: "essay",
        answer: "Strong responses would discuss British mercantilism, trade restrictions, taxation policies like the Sugar Act and Stamp Act, smuggling, boycotts of British goods, and how these economic tensions fueled revolutionary sentiment.",
        bloomsLevel: "Analyzing"
      },
      {
        text: "Compare and contrast the perspectives of Loyalists and Patriots during the American Revolution.",
        type: "essay",
        answer: "This response should examine the motivations, arguments, and demographics of both Loyalists and Patriots, noting their different views on British authority, colonial rights, and the consequences of revolution.",
        bloomsLevel: "Analyzing"
      },
      {
        text: "Evaluate the significance of the French alliance to the American victory in the Revolutionary War.",
        type: "essay",
        answer: "A strong response would assess the military, financial, and diplomatic contributions of France, considering both their tangible impact on specific battles and the broader strategic implications for British war-making capacity.",
        bloomsLevel: "Evaluating"
      }
    ],
    tags: ["History", "American Revolution", "High School"],
    createdAt: "2023-10-05T14:45:00Z"
  }
];

// Mock labs data
export const labs: Lab[] = [
  {
    id: "lab-1",
    title: "Circuit Builder",
    description: "Build and test electrical circuits with batteries, resistors, light bulbs, and switches.",
    category: "physics",
    gradeLevel: "6-12",
    thumbnail: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc-600.png",
    url: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html",
    objectives: [
      "Build electrical circuits with various components",
      "Understand the relationship between voltage, current, and resistance",
      "Analyze series and parallel circuits",
      "Troubleshoot electrical circuits"
    ],
    steps: [
      {
        title: "Build a simple circuit",
        description: "Connect a battery to a light bulb using wires to create a complete circuit."
      },
      {
        title: "Measure voltage and current",
        description: "Add an ammeter and voltmeter to your circuit to measure electrical properties."
      },
      {
        title: "Explore resistance",
        description: "Add resistors to your circuit and observe how they affect current flow."
      },
      {
        title: "Compare series and parallel",
        description: "Build both series and parallel circuits with multiple light bulbs and compare their brightness."
      }
    ],
    questions: [
      {
        text: "What happens to the brightness of light bulbs when connected in series vs. parallel?"
      },
      {
        text: "How does increasing the voltage affect the current in the circuit?"
      },
      {
        text: "Design a circuit that allows you to turn one light on and off without affecting another light."
      }
    ],
    tags: ["Physics", "Electricity", "Circuits", "Interactive"]
  },
  {
    id: "lab-2",
    title: "Balancing Chemical Equations",
    description: "Learn to balance chemical equations using interactive molecular models.",
    category: "chemistry",
    gradeLevel: "9-12",
    thumbnail: "https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations-600.png",
    url: "https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations_en.html",
    objectives: [
      "Understand the conservation of mass in chemical reactions",
      "Balance chemical equations by adding coefficients",
      "Visualize molecular representations of chemical reactions",
      "Differentiate between reactants and products"
    ],
    steps: [
      {
        title: "Examine the reaction",
        description: "Identify the reactants and products in the chemical equation."
      },
      {
        title: "Count atoms",
        description: "Count the number of each type of atom on both sides of the equation."
      },
      {
        title: "Add coefficients",
        description: "Add coefficients to balance the number of atoms on each side."
      },
      {
        title: "Verify balance",
        description: "Check that each type of atom appears in equal numbers on both sides."
      }
    ],
    questions: [
      {
        text: "Why must chemical equations be balanced?"
      },
      {
        text: "What law of chemistry explains the need for balanced equations?"
      },
      {
        text: "Balance this equation: H₂ + O₂ → H₂O"
      }
    ],
    tags: ["Chemistry", "Chemical Reactions", "Stoichiometry"]
  },
  {
    id: "lab-3",
    title: "Cell Structure Explorer",
    description: "Investigate the structures and functions of plant and animal cells.",
    category: "biology",
    gradeLevel: "6-12",
    thumbnail: "https://cdn.britannica.com/31/123131-050-8BA9CC21/animal-cell.jpg",
    url: "https://learn.genetics.utah.edu/content/cells/insideacell/",
    objectives: [
      "Identify the major organelles in plant and animal cells",
      "Compare and contrast plant and animal cells",
      "Understand the functions of cellular components",
      "Relate cell structure to function"
    ],
    steps: [
      {
        title: "Explore the cell membrane",
        description: "Examine the structure and function of the cell membrane in controlling what enters and exits the cell."
      },
      {
        title: "Investigate organelles",
        description: "Click on different organelles to learn about their structures and functions."
      },
      {
        title: "Compare cell types",
        description: "Switch between plant and animal cell views to identify unique structures in each."
      },
      {
        title: "Connect to function",
        description: "Consider how the structure of each organelle relates to its function in the cell."
      }
    ],
    questions: [
      {
        text: "What structures are found in plant cells but not in animal cells?"
      },
      {
        text: "How does the structure of mitochondria relate to their function?"
      },
      {
        text: "Why are cells considered the basic unit of life?"
      }
    ],
    tags: ["Biology", "Cells", "Microscopy", "Organelles"]
  },
  {
    id: "lab-4",
    title: "Plate Tectonics Simulator",
    description: "Explore how Earth's plates move and interact to shape our planet's surface.",
    category: "earth",
    gradeLevel: "6-12",
    thumbnail: "https://phet.colorado.edu/sims/html/plate-tectonics/latest/plate-tectonics-600.png",
    url: "https://phet.colorado.edu/sims/html/plate-tectonics/latest/plate-tectonics_en.html",
    objectives: [
      "Model the movement of Earth's tectonic plates",
      "Understand convergent, divergent, and transform plate boundaries",
      "Examine the formation of mountains, trenches, and volcanoes",
      "Relate plate tectonics to earthquakes and volcanic activity"
    ],
    steps: [
      {
        title: "Explore plate boundaries",
        description: "Identify and interact with different types of plate boundaries."
      },
      {
        title: "Create mountains",
        description: "Simulate the collision of continental plates to form mountain ranges."
      },
      {
        title: "Generate earthquakes",
        description: "Observe how plate movements generate earthquakes and where they're most likely to occur."
      },
      {
        title: "Form volcanoes",
        description: "Examine how subduction zones lead to volcanic activity."
      }
    ],
    questions: [
      {
        text: "What evidence supports the theory of plate tectonics?"
      },
      {
        text: "How do transform boundaries differ from convergent and divergent boundaries?"
      },
      {
        text: "Explain the relationship between plate tectonics and the Ring of Fire."
      }
    ],
    tags: ["Earth Science", "Geology", "Plate Tectonics", "Natural Disasters"]
  },
  {
    id: "lab-5",
    title: "Wave Properties Simulation",
    description: "Investigate the properties of waves including amplitude, frequency, and wavelength.",
    category: "physics",
    gradeLevel: "6-12",
    thumbnail: "https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string-600.png",
    url: "https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_en.html",
    objectives: [
      "Manipulate wave properties like amplitude, frequency, and wavelength",
      "Observe the relationship between frequency and wavelength",
      "Understand the difference between transverse and longitudinal waves",
      "Analyze wave behavior including reflection and interference"
    ],
    steps: [
      {
        title: "Generate waves",
        description: "Use the oscillator to create waves with different properties."
      },
      {
        title: "Adjust frequency",
        description: "Change the frequency and observe the effect on wavelength."
      },
      {
        title: "Modify amplitude",
        description: "Adjust the amplitude and note how it affects the wave's appearance."
      },
      {
        title: "Observe wave reflections",
        description: "Watch how waves reflect at fixed and loose endpoints."
      }
    ],
    questions: [
      {
        text: "How does changing the frequency affect the wavelength if wave speed is constant?"
      },
      {
        text: "What determines the energy carried by a wave?"
      },
      {
        text: "Compare transverse and longitudinal waves with examples of each."
      }
    ],
    tags: ["Physics", "Waves", "Sound", "Light"]
  },
  {
    id: "lab-6",
    title: "Natural Selection Simulator",
    description: "Explore how natural selection leads to evolution through an interactive simulation.",
    category: "biology",
    gradeLevel: "9-12",
    thumbnail: "https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection-600.png",
    url: "https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_en.html",
    objectives: [
      "Understand how natural selection drives evolution",
      "Observe the effects of mutations on a population",
      "Analyze how environmental factors influence survival",
      "Predict evolutionary outcomes based on selection pressures"
    ],
    steps: [
      {
        title: "Set up environment",
        description: "Configure the initial environment and rabbit population."
      },
      {
        title: "Introduce mutations",
        description: "Add genetic mutations affecting fur color, tooth size, or tail length."
      },
      {
        title: "Apply selection pressure",
        description: "Introduce wolves, food limitations, or climate changes as selection pressures."
      },
      {
        title: "Observe generations",
        description: "Watch how the rabbit population changes over multiple generations."
      }
    ],
    questions: [
      {
        text: "How does natural selection differ from artificial selection?"
      },
      {
        text: "What role do mutations play in the process of evolution?"
      },
      {
        text: "Design an experiment using this simulation to demonstrate adaptation."
      }
    ],
    tags: ["Biology", "Evolution", "Genetics", "Natural Selection"]
  }
];
