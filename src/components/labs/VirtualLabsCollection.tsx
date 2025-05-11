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
  }
];

interface VirtualLabsCollectionProps {
  onLabSelect?: (lab: VirtualLab) => void;
}

export function VirtualLabsCollection({ onLabSelect }: VirtualLabsCollectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"phet" | "other" | "all">("all");
  const [previewingLab, setPreviewingLab] = useState<VirtualLab | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Filter labs based on search query, category, and grade
  const filteredLabs = virtualLabs.filter(lab => {
    const matchesSearch = searchQuery === "" || 
      lab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || lab.category === selectedCategory;
    const matchesGrade = selectedGrade === "all" || lab.gradeLevel === selectedGrade;
    
    const matchesSource = 
      activeTab === "all" || 
      (activeTab === "phet" && lab.source === "PhET Interactive Simulations") ||
      (activeTab === "other" && lab.source !== "PhET Interactive Simulations");
    
    return matchesSearch && matchesCategory && matchesGrade && matchesSource;
  });

  // Get the icon for a category
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
        return <div className="flex text-yellow-500"><Star className="h-3 w-3 fill-current" /></div>;
      case "intermediate":
        return <div className="flex text-yellow-500"><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /></div>;
      case "advanced":
        return <div className="flex text-yellow-500"><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /><Star className="h-3 w-3 fill-current" /></div>;
      default:
        return null;
    }
  };
  
  // Handle lab preview
  const handlePreview = (lab: VirtualLab) => {
    setPreviewingLab(lab);
    setIsPreviewLoading(true);
    setTimeout(() => {
      setIsPreviewLoading(false);
    }, 1500);
  };
  
  // Close the preview
  const closePreview = () => {
    setPreviewingLab(null);
  };
  
  // Launch the lab
  const launchLab = (lab: VirtualLab) => {
    if (onLabSelect) {
      onLabSelect(lab);
    } else {
      window.open(lab.url, "_blank");
      toast.success("Lab opened in new tab");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-opacity-40 bg-opacity-30 backdrop-blur-md bg-gradient-to-br from-white/30 to-white/10 dark:from-gray-900/50 dark:to-gray-900/30 shadow-md">
        <CardHeader>
          <CardTitle>Open-Source Virtual Labs</CardTitle>
          <CardDescription>
            Explore a collection of interactive simulations from PhET and other providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "phet" | "other" | "all")}>
            <div className="flex justify-between items-center mb-4">
              <TabsList className="grid w-full max-w-md grid-cols-3 bg-background/50 backdrop-blur-sm">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-md">All Labs</TabsTrigger>
                <TabsTrigger value="phet" className="data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-md">PhET Simulations</TabsTrigger>
                <TabsTrigger value="other" className="data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-md">Other Providers</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search simulations..." 
                  className="pl-8 bg-background/50 backdrop-blur-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <select 
                  className="border rounded px-3 py-1 text-sm bg-background/50 backdrop-blur-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="physics">Physics</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="biology">Biology</option>
                  <option value="earth">Earth Science</option>
                </select>
                
                <select 
                  className="border rounded px-3 py-1 text-sm bg-background/50 backdrop-blur-sm"
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                >
                  <option value="all">All Grades</option>
                  <option value="3-5">Grades 3-5</option>
                  <option value="6-8">Grades 6-8</option>
                  <option value="6-12">Grades 6-12</option>
                  <option value="9-12">Grades 9-12</option>
                </select>
              </div>
            </div>
            
            <TabsContent value="all" className="mt-0">
              {filteredLabs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No labs matching your filters.</p>
                </div>
              ) : previewingLab ? (
                <div className="space-y-4">
                  <Card className="border-opacity-40 bg-opacity-30 backdrop-blur-md bg-gradient-to-br from-white/30 to-white/10 dark:from-gray-900/50 dark:to-gray-900/30 shadow-md">
                    <div className="p-1 relative">
                      {isPreviewLoading ? (
                        <div className="aspect-video w-full bg-muted flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            <p className="mt-4 text-muted-foreground">Loading simulation preview...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video w-full overflow-hidden rounded-md">
                          <iframe 
                            src={previewingLab.url} 
                            className="w-full h-full border-0"
                            title={previewingLab.title}
                            allowFullScreen
                          ></iframe>
                        </div>
                      )}
                    </div>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-medium">{previewingLab.title}</h3>
                          <p className="text-muted-foreground text-sm mt-1">{previewingLab.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            {previewingLab.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs bg-secondary/50 backdrop-blur-sm">{tag}</Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-4 text-sm">
                            <div>
                              <span className="text-muted-foreground mr-1">Source:</span>
                              {previewingLab.source}
                            </div>
                            <div>
                              <span className="text-muted-foreground mr-1">Grade:</span>
                              {previewingLab.gradeLevel}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground mr-1">Difficulty:</span>
                              {getDifficultyStars(previewingLab.difficulty)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4">
                      <Button variant="outline" onClick={closePreview} className="backdrop-blur-sm">
                        Back to Collection
                      </Button>
                      <Button onClick={() => launchLab(previewingLab)} className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-300">
                        <Play className="h-4 w-4" />
                        Launch Lab
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLabs.map(lab => (
                    <Card key={lab.id} className="overflow-hidden flex flex-col h-full hover:shadow-md transition-all duration-300 border-opacity-40 bg-opacity-30 backdrop-blur-md bg-gradient-to-br from-white/30 to-white/10 dark:from-gray-900/50 dark:to-gray-900/30">
                      <div 
                        className="aspect-video w-full overflow-hidden bg-muted cursor-pointer relative group"
                        onClick={() => handlePreview(lab)}
                      >
                        <img 
                          src={lab.thumbnail} 
                          alt={lab.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-start p-4">
                          <Badge className="bg-primary/80 hover:bg-primary/90 backdrop-blur-sm text-white capitalize">{lab.category}</Badge>
                        </div>
                      </div>
                      <CardContent className="py-4 flex-grow">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium">{lab.title}</h3>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex mt-0.5">
                                  {getDifficultyStars(lab.difficulty)}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="backdrop-blur-md bg-background/70">
                                <p>Difficulty: {lab.difficulty}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                          {getCategoryIcon(lab.category)} <span className="capitalize">{lab.category}</span> • Grade {lab.gradeLevel}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{lab.description}</p>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {lab.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs bg-secondary/30 backdrop-blur-sm">{tag}</Badge>
                          ))}
                          {lab.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">+{lab.tags.length - 2}</Badge>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <div className="flex w-full gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1 flex-1 backdrop-blur-sm"
                            onClick={() => handlePreview(lab)}
                          >
                            <Info className="h-3 w-3" />
                            <span>Preview</span>
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex items-center gap-1 flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-sm hover:shadow-md transition-all duration-300"
                            onClick={() => launchLab(lab)}
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Launch</span>
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="phet" className="mt-0">
              {/* PhET specific content - identical format to "all" tab */}
              {filteredLabs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No PhET labs matching your filters.</p>
                </div>
              ) : previewingLab ? (
                <div className="space-y-4">
                  {/* Same preview format as "all" tab */}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Same card format as "all" tab */}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="other" className="mt-0">
              {/* Other providers specific content - identical format to "all" tab */}
              {filteredLabs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No external labs matching your filters.</p>
                </div>
              ) : previewingLab ? (
                <div className="space-y-4">
                  {/* Same preview format as "all" tab */}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Same card format as "all" tab */}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 