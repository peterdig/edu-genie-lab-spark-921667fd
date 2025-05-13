import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Beaker, 
  BookOpen, 
  FlaskConical, 
  Globe, 
  Search, 
  ExternalLink, 
  Play,
  Info,
  Star,
  StarHalf
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Define the lab interface for this component
interface VirtualLab {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  url: string;
  source: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  gradeLevel: string;
  tags: string[];
}

// Collection of open-source labs
const virtualLabs: VirtualLab[] = [
  {
    id: "phet-circuit",
    title: "Circuit Construction Kit",
    description: "Build circuits with batteries, resistors, light bulbs, and switches",
    category: "physics",
    thumbnail: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc-600.png",
    url: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html",
    source: "PhET Interactive Simulations",
    difficulty: "intermediate",
    gradeLevel: "6-12",
    tags: ["Physics", "Electricity", "Circuits"]
  },
  {
    id: "phet-balancing-chemical",
    title: "Balancing Chemical Equations",
    description: "Balance chemical equations by adjusting coefficients",
    category: "chemistry",
    thumbnail: "https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations-600.png",
    url: "https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations_en.html",
    source: "PhET Interactive Simulations",
    difficulty: "intermediate",
    gradeLevel: "9-12",
    tags: ["Chemistry", "Equations", "Stoichiometry"]
  },
  {
    id: "phet-build-atom",
    title: "Build an Atom",
    description: "Build atoms from protons, neutrons, and electrons",
    category: "chemistry",
    thumbnail: "https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom-600.png",
    url: "https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_en.html",
    source: "PhET Interactive Simulations",
    difficulty: "beginner",
    gradeLevel: "6-12",
    tags: ["Chemistry", "Atoms", "Elements"]
  },
  {
    id: "phet-forces",
    title: "Forces and Motion",
    description: "Explore the forces at work when pulling against a cart",
    category: "physics",
    thumbnail: "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics-600.png",
    url: "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_en.html",
    source: "PhET Interactive Simulations",
    difficulty: "beginner",
    gradeLevel: "3-8",
    tags: ["Physics", "Forces", "Motion", "Newton's Laws"]
  },
  {
    id: "phet-acid-base",
    title: "Acid-Base Solutions",
    description: "Investigate the pH scale and acid-base solutions",
    category: "chemistry",
    thumbnail: "https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions-600.png",
    url: "https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_en.html",
    source: "PhET Interactive Simulations",
    difficulty: "advanced",
    gradeLevel: "9-12",
    tags: ["Chemistry", "Acids", "Bases", "pH"]
  },
  {
    id: "phet-plate-tectonics",
    title: "Plate Tectonics",
    description: "Explore the Earth's tectonic plate boundaries",
    category: "earth",
    thumbnail: "https://phet.colorado.edu/sims/html/plate-tectonics/latest/plate-tectonics-600.png",
    url: "https://phet.colorado.edu/sims/html/plate-tectonics/latest/plate-tectonics_en.html",
    source: "PhET Interactive Simulations",
    difficulty: "intermediate",
    gradeLevel: "6-12",
    tags: ["Earth Science", "Geology", "Plates"]
  },
  {
    id: "phet-gene-expression",
    title: "Gene Expression",
    description: "Explore the process of gene expression including transcription and translation",
    category: "biology",
    thumbnail: "https://phet.colorado.edu/sims/html/gene-expression-essentials/latest/gene-expression-essentials-600.png",
    url: "https://phet.colorado.edu/sims/html/gene-expression-essentials/latest/gene-expression-essentials_en.html",
    source: "PhET Interactive Simulations",
    difficulty: "advanced",
    gradeLevel: "9-12",
    tags: ["Biology", "Genetics", "DNA", "RNA"]
  },
  {
    id: "phet-natural-selection",
    title: "Natural Selection",
    description: "Explore natural selection by controlling the environment and watching rabbits evolve",
    category: "biology",
    thumbnail: "https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection-600.png",
    url: "https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_en.html",
    source: "PhET Interactive Simulations",
    difficulty: "intermediate",
    gradeLevel: "9-12",
    tags: ["Biology", "Evolution", "Genetics"]
  },
  {
    id: "molecular-workbench",
    title: "Molecular Workbench",
    description: "Model and visualize molecular dynamics with interactive simulations",
    category: "chemistry",
    thumbnail: "https://concord.org/wp-content/uploads/2022/04/mw-partial-charges.jpg",
    url: "https://mw.concord.org/modeler/",
    source: "Concord Consortium",
    difficulty: "advanced",
    gradeLevel: "9-12",
    tags: ["Chemistry", "Physics", "Molecular Dynamics"]
  },
  {
    id: "cell-explorer",
    title: "Cell Explorer",
    description: "Explore the structure and function of plant and animal cells",
    category: "biology",
    thumbnail: "https://cdn.britannica.com/31/123131-050-8BA9CC21/animal-cell.jpg",
    url: "https://learn.genetics.utah.edu/content/cells/insideacell/",
    source: "Learn.Genetics",
    difficulty: "beginner",
    gradeLevel: "6-12",
    tags: ["Biology", "Cells", "Organelles"]
  },
  {
    id: "star-life-cycle",
    title: "Star Lifecycle Simulator",
    description: "Visualize the lifecycle of stars from formation to death",
    category: "earth",
    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Star_Life_Cycle_Chart.jpg/1200px-Star_Life_Cycle_Chart.jpg",
    url: "https://starinabox.lco.global/",
    source: "Las Cumbres Observatory",
    difficulty: "intermediate",
    gradeLevel: "6-12",
    tags: ["Astronomy", "Stars", "Space"]
  },
  {
    id: "wave-on-string",
    title: "Wave on a String",
    description: "Observe wave properties, interference, and reflection",
    category: "physics",
    thumbnail: "https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string-600.png",
    url: "https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_en.html",
    source: "PhET Interactive Simulations",
    difficulty: "intermediate",
    gradeLevel: "6-12",
    tags: ["Physics", "Waves", "Sound", "Light"]
  },
  {
    id: "projectile-motion",
    title: "Projectile Motion",
    description: "Investigate the principles of projectile motion with different objects",
    category: "physics",
    thumbnail: "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion-600.png",
    url: "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_en.html",
    source: "PhET Interactive Simulations",
    difficulty: "intermediate",
    gradeLevel: "9-12",
    tags: ["Physics", "Motion", "Gravity", "Kinematics"]
  },
  {
    id: "molecule-shapes",
    title: "Molecule Shapes",
    description: "Explore how electron pairs determine molecular shapes through VSEPR theory",
    category: "chemistry",
    thumbnail: "https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes-600.png",
    url: "https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes_en.html",
    source: "PhET Interactive Simulations",
    difficulty: "advanced",
    gradeLevel: "9-12",
    tags: ["Chemistry", "Molecular Geometry", "VSEPR", "3D Structures"]
  },
  {
    id: "energy-forms",
    title: "Energy Forms and Changes",
    description: "Explore energy conversions in various systems",
    category: "physics",
    thumbnail: "https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes-600.png",
    url: "https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_en.html",
    source: "PhET Interactive Simulations",
    difficulty: "intermediate",
    gradeLevel: "6-12",
    tags: ["Physics", "Energy", "Thermodynamics", "Heat"]
  },
  {
    id: "gravity-and-orbits",
    title: "Gravity and Orbits",
    description: "Experiment with gravity, orbits, and the solar system",
    category: "earth",
    thumbnail: "https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits-600.png",
    url: "https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_en.html",
    source: "PhET Interactive Simulations",
    difficulty: "intermediate",
    gradeLevel: "6-12",
    tags: ["Earth Science", "Astronomy", "Gravity", "Solar System"]
  },
  {
    id: "ph-scale",
    title: "pH Scale",
    description: "Visualize the pH scale and test various solutions",
    category: "chemistry",
    thumbnail: "https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale-600.png",
    url: "https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_en.html",
    source: "PhET Interactive Simulations",
    difficulty: "beginner",
    gradeLevel: "6-12",
    tags: ["Chemistry", "Acids", "Bases", "pH", "Solutions"]
  },
  {
    id: "vector-addition",
    title: "Vector Addition",
    description: "Explore vector addition in 1D and 2D",
    category: "physics",
    thumbnail: "https://phet.colorado.edu/sims/html/vector-addition/latest/vector-addition-600.png",
    url: "https://phet.colorado.edu/sims/html/vector-addition/latest/vector-addition_en.html",
    source: "PhET Interactive Simulations",
    difficulty: "intermediate",
    gradeLevel: "9-12",
    tags: ["Physics", "Vectors", "Forces", "Mathematics"]
  },
  {
    id: "virtual-frog-dissection",
    title: "Virtual Frog Dissection",
    description: "Perform a frog dissection virtually with detailed anatomy exploration",
    category: "biology",
    thumbnail: "https://www.biologycorner.com/worksheets/frog/images/frog_internal.jpg",
    url: "https://www.biologycorner.com/worksheets/frog/frog.html",
    source: "Biology Corner",
    difficulty: "intermediate",
    gradeLevel: "6-12",
    tags: ["Biology", "Anatomy", "Dissection", "Amphibians"]
  }
];

interface VirtualLabsCollectionProps {
  onLabSelect?: (lab: VirtualLab) => void;
}

export function VirtualLabsCollection({ onLabSelect }: VirtualLabsCollectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedGradeLevel, setSelectedGradeLevel] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [previewLab, setPreviewLab] = useState<VirtualLab | null>(null);
  
  // Filter labs based on search query and filters
  const filteredLabs = virtualLabs.filter(lab => {
    // Filter by tab first
    if (activeTab !== "all" && lab.category !== activeTab) {
      return false;
    }
    
    // Then by search term
    const matchesSearch = 
      searchQuery === "" || 
      lab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Then by category
    const matchesCategory = 
      selectedCategory === "all" || 
      lab.category === selectedCategory;
      
    // Then by difficulty
    const matchesDifficulty = 
      selectedDifficulty === "all" || 
      lab.difficulty === selectedDifficulty;
      
    // Then by grade level
    const matchesGradeLevel = 
      selectedGradeLevel === "all" || 
      lab.gradeLevel === selectedGradeLevel;
      
    return matchesSearch && matchesCategory && matchesDifficulty && matchesGradeLevel;
  });
  
  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "physics":
        return <FlaskConical className="h-4 w-4" />;
      case "chemistry":
        return <Beaker className="h-4 w-4" />;
      case "biology":
        return <BookOpen className="h-4 w-4" />;
      case "earth":
        return <Globe className="h-4 w-4" />;
      default:
        return <Beaker className="h-4 w-4" />;
    }
  };
  
  // Get difficulty stars
  const getDifficultyStars = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return (
          <div className="flex text-amber-400">
            <Star className="h-3.5 w-3.5 fill-current" />
            <Star className="h-3.5 w-3.5 text-muted-foreground/30" />
            <Star className="h-3.5 w-3.5 text-muted-foreground/30" />
          </div>
        );
      case "intermediate":
        return (
          <div className="flex text-amber-400">
            <Star className="h-3.5 w-3.5 fill-current" />
            <Star className="h-3.5 w-3.5 fill-current" />
            <Star className="h-3.5 w-3.5 text-muted-foreground/30" />
          </div>
        );
      case "advanced":
        return (
          <div className="flex text-amber-400">
            <Star className="h-3.5 w-3.5 fill-current" />
            <Star className="h-3.5 w-3.5 fill-current" />
            <Star className="h-3.5 w-3.5 fill-current" />
          </div>
        );
      default:
        return null;
    }
  };
  
  const handlePreview = (lab: VirtualLab) => {
    setPreviewLab(lab);
    // In real app this might scroll to top or do other behavior
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const closePreview = () => {
    setPreviewLab(null);
  };
  
  const launchLab = (lab: VirtualLab) => {
    if (onLabSelect) {
      onLabSelect(lab);
    } else {
      window.open(lab.url, "_blank");
      toast.success(`Opened ${lab.title} in a new tab`);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Preview Panel */}
      {previewLab && (
        <Card className="overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
          <div className="aspect-video w-full overflow-hidden relative">
            <img 
              src={previewLab.thumbnail} 
              alt={previewLab.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Button 
                variant="default" 
                size="lg" 
                className="flex items-center gap-2"
                onClick={() => launchLab(previewLab)}
              >
                <Play className="h-4 w-4" />
                <span>Launch Lab</span>
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
              onClick={closePreview}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
              </svg>
              <span className="sr-only">Close preview</span>
            </Button>
          </div>
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="flex gap-1.5 flex-wrap mb-1.5">
                  {previewLab.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <CardTitle className="text-lg sm:text-xl">{previewLab.title}</CardTitle>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                {getCategoryIcon(previewLab.category)}
                <span className="capitalize text-xs">{previewLab.category}</span>
              </Badge>
            </div>
        </CardHeader>
          <CardContent className="px-3 sm:px-6 text-sm">
            <p className="text-muted-foreground mb-4">{previewLab.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 text-xs sm:text-sm">
              <div>
                <span className="font-medium">Source:</span>{" "}
                <span className="text-muted-foreground">{previewLab.source}</span>
              </div>
              <div>
                <span className="font-medium">Grade Level:</span>{" "}
                <span className="text-muted-foreground">{previewLab.gradeLevel}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Difficulty:</span>{" "}
                {getDifficultyStars(previewLab.difficulty)}
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0 pb-3 sm:pb-6 px-3 sm:px-6">
            <Button 
              className="w-full text-sm h-9 sm:h-10"
              onClick={() => launchLab(previewLab)}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Open in New Tab
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Search and Filter */}
      <Card>
        <CardHeader className="pb-0 px-3 sm:px-6 pt-3 sm:pt-6">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                placeholder="Search labs..." 
                className="pl-8 pr-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery("")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                  </svg>
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
            <div className="text-sm flex items-center gap-2">
              <span className="hidden sm:inline text-muted-foreground">
                {filteredLabs.length} {filteredLabs.length === 1 ? "lab" : "labs"} found
              </span>
                          </div>
                        </div>
        </CardHeader>
        
        {/* Category Tabs */}
        <div className="px-3 sm:px-6 mt-3 sm:mt-4">
          <div className="overflow-x-auto no-scrollbar pb-1 -mx-3 px-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-muted/50 p-0.5 h-auto">
                <TabsTrigger value="all" className="text-xs rounded-sm py-1.5 px-2.5 h-7 data-[state=active]:bg-background">
                  All
                </TabsTrigger>
                <TabsTrigger value="physics" className="text-xs rounded-sm py-1.5 px-2.5 h-7 data-[state=active]:bg-background">
                  <FlaskConical className="h-3.5 w-3.5 mr-1.5" />
                  <span>Physics</span>
                </TabsTrigger>
                <TabsTrigger value="chemistry" className="text-xs rounded-sm py-1.5 px-2.5 h-7 data-[state=active]:bg-background">
                  <Beaker className="h-3.5 w-3.5 mr-1.5" />
                  <span>Chemistry</span>
                </TabsTrigger>
                <TabsTrigger value="biology" className="text-xs rounded-sm py-1.5 px-2.5 h-7 data-[state=active]:bg-background">
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                  <span>Biology</span>
                </TabsTrigger>
                <TabsTrigger value="earth" className="text-xs rounded-sm py-1.5 px-2.5 h-7 data-[state=active]:bg-background">
                  <Globe className="h-3.5 w-3.5 mr-1.5" />
                  <span>Earth Science</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
                            </div>
                          </div>
      </Card>
      
      {/* Lab Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredLabs.length === 0 ? (
          <Card className="col-span-full p-8 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Beaker className="h-6 w-6 text-muted-foreground/50" />
                        </div>
            <CardTitle className="text-lg mb-2">No labs found</CardTitle>
            <p className="text-muted-foreground text-sm mb-4">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedDifficulty("all");
                setSelectedGradeLevel("all");
                setActiveTab("all");
              }}
            >
              Clear All Filters
                      </Button>
                  </Card>
              ) : (
          filteredLabs.map((lab) => (
            <Card key={lab.id} className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow border border-border/50">
                      <div 
                className="aspect-video w-full overflow-hidden bg-muted cursor-pointer"
                        onClick={() => handlePreview(lab)}
                      >
                        <img 
                          src={lab.thumbnail} 
                          alt={lab.title}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                  loading="lazy"
                        />
                        </div>
              <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <div className="flex justify-between items-start gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge variant="outline" className="flex items-center gap-1 text-xs px-1.5 py-0.5 h-auto">
                      {getCategoryIcon(lab.category)}
                      <span className="capitalize text-xs">{lab.category}</span>
                    </Badge>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
                      {lab.gradeLevel}
                    </Badge>
                      </div>
                                  {getDifficultyStars(lab.difficulty)}
                                </div>
                <CardTitle className="text-base sm:text-lg line-clamp-1">{lab.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-0 flex-grow px-3 sm:px-6">
                <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">
                  {lab.description}
                </p>
                <div className="text-xs mt-2 text-muted-foreground">
                  <span>Source: {lab.source}</span>
                        </div>
                      </CardContent>
              <CardFooter className="pt-3 sm:pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="flex gap-2 w-full">
                          <Button 
                            variant="outline" 
                            size="sm" 
                    className="flex-1 text-xs"
                            onClick={() => handlePreview(lab)}
                          >
                    <Info className="h-3.5 w-3.5 mr-1.5" />
                            <span>Preview</span>
                          </Button>
                          <Button 
                    className="flex-1 text-xs"
                            onClick={() => launchLab(lab)}
                          >
                    <Play className="h-3.5 w-3.5 mr-1.5" />
                            <span>Launch</span>
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
          ))
        )}
                </div>
    </div>
  );
} 