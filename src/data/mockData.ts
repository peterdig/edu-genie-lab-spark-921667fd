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
    subject: "Science",
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
    subject: "History",
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
  },
  {
    id: "lab-7",
    title: "Acid-Base Solutions",
    description: "Explore the properties of acids and bases and test the pH of common solutions.",
    category: "chemistry",
    gradeLevel: "9-12",
    thumbnail: "https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions-600.png",
    url: "https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_en.html",
    objectives: [
      "Understand acid-base theory and pH scale",
      "Identify the properties of acids and bases",
      "Use indicators to test pH of various solutions",
      "Analyze acid-base neutralization reactions"
    ],
    steps: [
      {
        title: "Test different solutions",
        description: "Use pH paper and indicators to test the acidity of various solutions."
      },
      {
        title: "Observe molecular structures",
        description: "View the molecular representations of acids and bases in solution."
      },
      {
        title: "Conduct neutralization reactions",
        description: "Mix acids and bases to observe neutralization and salt formation."
      },
      {
        title: "Analyze concentration effects",
        description: "Change concentrations and observe effects on pH and conductivity."
      }
    ],
    questions: [
      {
        text: "What makes a solution acidic at the molecular level?"
      },
      {
        text: "How does an indicator work to show pH?"
      },
      {
        text: "What happens during a neutralization reaction?"
      }
    ],
    tags: ["Chemistry", "Acids", "Bases", "pH", "Solutions"]
  },
  {
    id: "lab-8",
    title: "Gene Expression",
    description: "Explore how DNA is transcribed and translated to create proteins.",
    category: "biology",
    gradeLevel: "9-12",
    thumbnail: "https://cdn.kastatic.org/ka-perseus-images/9695f179d14ef9b5e66a1d6aa7eb4456b3c1d94f.png",
    url: "https://learn.genetics.utah.edu/content/basics/",
    objectives: [
      "Understand the central dogma of molecular biology",
      "Visualize DNA transcription to mRNA",
      "Model translation from mRNA to protein",
      "Analyze how gene mutations affect protein structure"
    ],
    steps: [
      {
        title: "Examine DNA structure",
        description: "Explore the double helix structure and base pairing rules."
      },
      {
        title: "Transcribe DNA to RNA",
        description: "Follow the process of transcription from DNA to messenger RNA."
      },
      {
        title: "Translate mRNA to protein",
        description: "Use the genetic code to translate mRNA codons into amino acids."
      },
      {
        title: "Introduce mutations",
        description: "Observe how different types of mutations affect the final protein."
      }
    ],
    questions: [
      {
        text: "How does the structure of DNA enable it to store information?"
      },
      {
        text: "What is the relationship between a gene and a protein?"
      },
      {
        text: "Why might a single base mutation be harmful in some cases but not others?"
      }
    ],
    tags: ["Biology", "Genetics", "DNA", "Proteins", "Molecular Biology"]
  },
  {
    id: "lab-9",
    title: "Projectile Motion",
    description: "Investigate how objects move through the air when projected with initial velocity.",
    category: "physics",
    gradeLevel: "9-12",
    thumbnail: "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion-600.png",
    url: "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_en.html",
    objectives: [
      "Understand the physics of projectile motion",
      "Analyze the effect of launch angle on projectile trajectory",
      "Investigate how air resistance affects projectile paths",
      "Calculate range, height, and flight time of projectiles"
    ],
    steps: [
      {
        title: "Set launch parameters",
        description: "Adjust initial velocity, angle, and height for the projectile."
      },
      {
        title: "Observe trajectory",
        description: "Launch the projectile and observe its path through the air."
      },
      {
        title: "Analyze vectors",
        description: "Examine the horizontal and vertical components of motion."
      },
      {
        title: "Test different objects",
        description: "Compare trajectories of objects with different masses and air resistance."
      }
    ],
    questions: [
      {
        text: "What launch angle maximizes the horizontal distance of a projectile?"
      },
      {
        text: "How does air resistance affect the path compared to the ideal case?"
      },
      {
        text: "Why do the horizontal and vertical components of motion behave independently?"
      }
    ],
    tags: ["Physics", "Motion", "Kinematics", "Mechanics"]
  },
  {
    id: "lab-10",
    title: "Weather Patterns Simulation",
    description: "Explore the factors that influence weather patterns and climate systems.",
    category: "earth",
    gradeLevel: "6-12",
    thumbnail: "https://scied.ucar.edu/sites/default/files/styles/extra_large/public/2021-10/earth-weather-model.jpg",
    url: "https://scied.ucar.edu/interactive/climate-model",
    objectives: [
      "Understand the factors that influence weather and climate",
      "Model atmospheric circulation patterns",
      "Analyze the formation of storms and weather fronts",
      "Investigate climate change scenarios"
    ],
    steps: [
      {
        title: "Examine global wind patterns",
        description: "Visualize prevailing winds and global circulation cells."
      },
      {
        title: "Simulate ocean currents",
        description: "Observe how ocean currents affect regional climate."
      },
      {
        title: "Create weather fronts",
        description: "Model the collision of air masses to form weather fronts."
      },
      {
        title: "Adjust climate variables",
        description: "Change greenhouse gas levels and observe climate impacts."
      }
    ],
    questions: [
      {
        text: "How do ocean currents influence coastal climates?"
      },
      {
        text: "What causes the formation of hurricanes and cyclones?"
      },
      {
        text: "Explain how the greenhouse effect works and its role in climate."
      }
    ],
    tags: ["Earth Science", "Meteorology", "Climate", "Atmosphere"]
  },
  {
    id: "lab-11",
    title: "Forces and Motion",
    description: "Experiment with forces, friction, and motion to understand Newton's laws of physics.",
    category: "physics",
    gradeLevel: "6-12",
    thumbnail: "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics-600.png",
    url: "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_en.html",
    objectives: [
      "Understand Newton's three laws of motion",
      "Investigate the relationship between force, mass, and acceleration",
      "Explore the effects of friction on moving objects",
      "Analyze balanced and unbalanced forces"
    ],
    steps: [
      {
        title: "Explore force and motion",
        description: "Apply various forces to objects and observe how they move."
      },
      {
        title: "Investigate friction",
        description: "Change surface types and observe how friction affects motion."
      },
      {
        title: "Test Newton's Second Law",
        description: "Vary mass and force to see how they relate to acceleration."
      },
      {
        title: "Create balanced forces",
        description: "Experiment with opposing forces to create equilibrium."
      }
    ],
    questions: [
      {
        text: "How does doubling the force affect the acceleration of an object?"
      },
      {
        text: "What happens to acceleration when you double the mass but keep the force constant?"
      },
      {
        text: "Explain a real-world example of Newton's Third Law."
      }
    ],
    tags: ["Physics", "Newton's Laws", "Forces", "Motion", "Friction"]
  },
  {
    id: "lab-12",
    title: "Periodic Table Explorer",
    description: "Investigate the periodic table and explore patterns in element properties.",
    category: "chemistry",
    gradeLevel: "9-12",
    thumbnail: "https://cdn.britannica.com/07/196607-050-88249FA1/Periodic-table-elements.jpg",
    url: "https://ptable.com/",
    objectives: [
      "Understand the organization of the periodic table",
      "Identify trends in element properties",
      "Explore electron configurations and valence electrons",
      "Compare and contrast metals, nonmetals, and metalloids"
    ],
    steps: [
      {
        title: "Navigate the periodic table",
        description: "Explore the interactive table and examine element information."
      },
      {
        title: "Investigate periodic trends",
        description: "Observe patterns in atomic radius, electronegativity, and ionization energy."
      },
      {
        title: "Examine electron arrangements",
        description: "Study the electron configurations and how they relate to an element's position."
      },
      {
        title: "Compare element groups",
        description: "Analyze similarities and differences between element families."
      }
    ],
    questions: [
      {
        text: "How does atomic radius change as you move across a period and down a group?"
      },
      {
        text: "Why are noble gases so unreactive compared to other elements?"
      },
      {
        text: "How does an element's position in the periodic table relate to its properties?"
      }
    ],
    tags: ["Chemistry", "Periodic Table", "Elements", "Atomic Structure"]
  },
  {
    id: "lab-13",
    title: "Virtual Frog Dissection",
    description: "Explore frog anatomy without using an actual specimen through this virtual dissection.",
    category: "biology",
    gradeLevel: "6-12",
    thumbnail: "https://www.biologycorner.com/worksheets/frog/images/frog_internal.jpg",
    url: "https://www.biologycorner.com/worksheets/frog/frog.html",
    objectives: [
      "Identify major organs and systems in a frog",
      "Understand the function of different organ systems",
      "Compare frog anatomy to human anatomy",
      "Learn proper dissection techniques virtually"
    ],
    steps: [
      {
        title: "External examination",
        description: "Observe the external features of the frog before dissection."
      },
      {
        title: "Opening the body cavity",
        description: "Learn the proper technique for accessing internal organs."
      },
      {
        title: "Identify digestive system",
        description: "Locate and examine the stomach, intestines, and other digestive organs."
      },
      {
        title: "Explore other systems",
        description: "Identify circulatory, respiratory, and reproductive structures."
      }
    ],
    questions: [
      {
        text: "How is the frog's heart different from a human heart?"
      },
      {
        text: "What adaptations in the frog's digestive system relate to its diet and lifestyle?"
      },
      {
        text: "Compare the respiratory system of a frog to that of a human."
      }
    ],
    tags: ["Biology", "Anatomy", "Dissection", "Vertebrates", "Amphibians"]
  },
  {
    id: "lab-14",
    title: "Solar System Explorer",
    description: "Take a journey through our solar system and explore the planets, moons, and other celestial objects.",
    category: "earth",
    gradeLevel: "3-12",
    thumbnail: "https://solarsystem.nasa.gov/system/resources/detail_files/2486_stsci-h-p1953a_1800.jpg",
    url: "https://eyes.nasa.gov/apps/solar-system/",
    objectives: [
      "Understand the scale and structure of our solar system",
      "Compare the physical properties of different planets",
      "Explore moons, asteroids, and other objects in the solar system",
      "Learn about space missions and discoveries"
    ],
    steps: [
      {
        title: "Tour the planets",
        description: "Explore each planet's appearance, size, and unique features."
      },
      {
        title: "Investigate orbital patterns",
        description: "Observe how planets and other objects move around the sun."
      },
      {
        title: "Discover moons and rings",
        description: "Examine the moons and ring systems of the gas giants."
      },
      {
        title: "Learn about space missions",
        description: "Explore past and current missions to various parts of the solar system."
      }
    ],
    questions: [
      {
        text: "How do the inner planets differ from the outer planets?"
      },
      {
        text: "Why does Venus have such an extreme greenhouse effect compared to Earth?"
      },
      {
        text: "What evidence suggests that Jupiter's moon Europa might have an ocean under its surface?"
      }
    ],
    tags: ["Earth Science", "Astronomy", "Planets", "Solar System", "Space"]
  },
  {
    id: "lab-15",
    title: "Molecular Geometry Simulator",
    description: "Build molecules and explore how electron pairs determine molecular shapes.",
    category: "chemistry",
    gradeLevel: "9-12",
    thumbnail: "https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes-600.png",
    url: "https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes_en.html",
    objectives: [
      "Understand VSEPR theory and molecular geometry",
      "Predict 3D shapes based on electron pair arrangements",
      "Differentiate between electron geometry and molecular geometry",
      "Explore bond angles in different molecular structures"
    ],
    steps: [
      {
        title: "Build simple molecules",
        description: "Create basic structures like water, ammonia, and methane."
      },
      {
        title: "Add lone pairs",
        description: "Observe how non-bonding electron pairs affect molecular shape."
      },
      {
        title: "Measure bond angles",
        description: "Use the angle measurement tool to verify geometric predictions."
      },
      {
        title: "Compare real examples",
        description: "Match your models with real-world molecules."
      }
    ],
    questions: [
      {
        text: "How does a lone pair of electrons affect the shape of a molecule?"
      },
      {
        text: "Why does water have a bent shape rather than a linear one?"
      },
      {
        text: "What is the difference between electron geometry and molecular geometry?"
      }
    ],
    tags: ["Chemistry", "Molecular Geometry", "VSEPR Theory", "Chemical Bonding"]
  },
  {
    id: "lab-16",
    title: "Simple Machines",
    description: "Explore levers, pulleys, inclined planes and other simple machines that make work easier.",
    category: "physics",
    gradeLevel: "3-8",
    thumbnail: "https://phet.colorado.edu/sims/html/forces-and-simple-machines/latest/forces-and-simple-machines-600.png",
    url: "https://www.explorelearning.com/index.cfm?method=cResource.dspDetail&ResourceID=651",
    objectives: [
      "Understand the six types of simple machines",
      "Explore how simple machines make work easier",
      "Calculate mechanical advantage of different machines",
      "Build compound machines from simple components"
    ],
    steps: [
      {
        title: "Investigate levers",
        description: "Experiment with different classes of levers and observe mechanical advantage."
      },
      {
        title: "Explore pulleys",
        description: "Compare single fixed pulleys to compound pulley systems."
      },
      {
        title: "Test inclined planes",
        description: "Measure how inclined planes reduce the force needed to lift objects."
      },
      {
        title: "Build compound machines",
        description: "Combine simple machines to create more complex mechanical systems."
      }
    ],
    questions: [
      {
        text: "How does a longer lever arm affect the force needed to lift an object?"
      },
      {
        text: "Why does a pulley system with more wheels make it easier to lift heavy objects?"
      },
      {
        text: "Name three examples of simple machines you use in everyday life."
      }
    ],
    tags: ["Physics", "Simple Machines", "Mechanics", "Engineering", "Elementary"]
  },
  {
    id: "lab-17",
    title: "Magnetism Explorer",
    description: "Investigate magnetic fields, magnetic materials, and electromagnets through interactive simulations.",
    category: "physics",
    gradeLevel: "6-12",
    thumbnail: "https://phet.colorado.edu/sims/html/magnets-and-electromagnets/latest/magnets-and-electromagnets-600.png",
    url: "https://phet.colorado.edu/sims/html/magnets-and-electromagnets/latest/magnets-and-electromagnets_en.html",
    objectives: [
      "Understand the properties of magnetic fields",
      "Explore attraction and repulsion between magnets",
      "Investigate how electricity creates magnetism",
      "Discover applications of electromagnets"
    ],
    steps: [
      {
        title: "Explore bar magnets",
        description: "Observe magnetic fields and interactions between magnets."
      },
      {
        title: "Test materials",
        description: "Identify which materials are magnetic and which are not."
      },
      {
        title: "Build an electromagnet",
        description: "Create a magnet using electricity and see how to control its strength."
      },
      {
        title: "Generate electricity",
        description: "Use magnets to generate electrical current through induction."
      }
    ],
    questions: [
      {
        text: "What happens to the magnetic field when you break a magnet in half?"
      },
      {
        text: "How can you make an electromagnet stronger?"
      },
      {
        text: "Explain how a compass works using your knowledge of magnets."
      }
    ],
    tags: ["Physics", "Magnetism", "Electricity", "Electromagnetism"]
  },
  {
    id: "lab-18",
    title: "Weather Station",
    description: "Collect and analyze weather data to understand meteorological patterns and forecasting.",
    category: "earth",
    gradeLevel: "3-8",
    thumbnail: "https://scied.ucar.edu/sites/default/files/styles/extra_large/public/2021-09/weather-station-kids.jpg",
    url: "https://scied.ucar.edu/learning-zone/how-weather-works/weather-forecasting",
    objectives: [
      "Measure and record weather variables",
      "Understand cloud formation and precipitation",
      "Analyze weather patterns and make predictions",
      "Learn about tools meteorologists use"
    ],
    steps: [
      {
        title: "Collect weather data",
        description: "Measure temperature, pressure, humidity, and wind speed."
      },
      {
        title: "Observe clouds",
        description: "Identify different cloud types and what they indicate about weather."
      },
      {
        title: "Track weather patterns",
        description: "Record data over time to identify trends and patterns."
      },
      {
        title: "Create a forecast",
        description: "Use collected data to predict upcoming weather conditions."
      }
    ],
    questions: [
      {
        text: "How does air pressure relate to weather conditions?"
      },
      {
        text: "What causes different types of precipitation?"
      },
      {
        text: "Why is it important to collect weather data from many locations?"
      }
    ],
    tags: ["Earth Science", "Meteorology", "Weather", "Data Collection", "Elementary"]
  },
  {
    id: "lab-19",
    title: "DNA Extraction",
    description: "Extract DNA from fruits or vegetables using simple household materials.",
    category: "biology",
    gradeLevel: "6-12",
    thumbnail: "https://learn.genetics.utah.edu/content/labs/extraction/howto/images/step7.jpg",
    url: "https://learn.genetics.utah.edu/content/labs/extraction/",
    objectives: [
      "Understand the structure and location of DNA in cells",
      "Learn basic laboratory techniques for DNA extraction",
      "Observe DNA with the naked eye",
      "Connect visual observations to molecular biology concepts"
    ],
    steps: [
      {
        title: "Prepare cell material",
        description: "Break down cell walls and membranes to access DNA."
      },
      {
        title: "Separate DNA from proteins",
        description: "Use salt and dish soap to separate DNA from other cellular materials."
      },
      {
        title: "Precipitate DNA",
        description: "Add cold alcohol to make the DNA visible as it precipitates."
      },
      {
        title: "Collect and examine",
        description: "Collect the DNA and observe its appearance and properties."
      }
    ],
    questions: [
      {
        text: "Why is dish soap used in the DNA extraction process?"
      },
      {
        text: "What does DNA look like when you extract it from cells?"
      },
      {
        text: "How is this simple extraction different from techniques used in research labs?"
      }
    ],
    tags: ["Biology", "Genetics", "DNA", "Laboratory Techniques", "Molecular Biology"]
  },
  {
    id: "lab-20",
    title: "Ecosystem Explorer",
    description: "Build and observe virtual ecosystems to understand ecological relationships and balance.",
    category: "biology",
    gradeLevel: "3-8",
    thumbnail: "https://content.wolfram.com/uploads/sites/10/2018/02/ecosystem-predator-prey.png",
    url: "https://www.learner.org/wp-content/interactive/envsci/ecology/",
    objectives: [
      "Understand food webs and energy flow in ecosystems",
      "Observe effects of population changes on ecosystem balance",
      "Learn about competition, predation, and symbiotic relationships",
      "Investigate how environmental factors affect ecosystems"
    ],
    steps: [
      {
        title: "Build a food web",
        description: "Create connections between producers, consumers, and decomposers."
      },
      {
        title: "Introduce environmental changes",
        description: "Alter conditions like rainfall, temperature, or available resources."
      },
      {
        title: "Observe population dynamics",
        description: "Watch how species populations change over time and respond to each other."
      },
      {
        title: "Test biodiversity effects",
        description: "Compare stable, diverse ecosystems to simpler ones with fewer species."
      }
    ],
    questions: [
      {
        text: "What happens to an ecosystem when a predator is removed?"
      },
      {
        text: "How does energy flow through a food web?"
      },
      {
        text: "Why is biodiversity important for ecosystem stability?"
      }
    ],
    tags: ["Biology", "Ecology", "Ecosystems", "Food Webs", "Environmental Science", "Elementary"]
  }
];
