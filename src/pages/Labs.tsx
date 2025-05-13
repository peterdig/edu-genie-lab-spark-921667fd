import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { LabCard } from "@/components/labs/LabCard";
import { VirtualLabsCollection } from "@/components/labs/VirtualLabsCollection";
import { Lab } from "@/types/labs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Loader, 
  Search, 
  X, 
  Filter as FilterIcon, 
  ChevronDown, 
  ChevronUp, 
  ChevronsLeft, 
  ChevronsRight, 
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  BookOpen,
  Beaker,
  FlaskConical
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { labs } from "@/data/mockData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ReactNode } from "react";

// Number of items per page
const ITEMS_PER_PAGE = 6;

// Feature card components for consistent styling
interface FeatureCardProps {
  children: ReactNode;
  className?: string;
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
  <Card className={cn(
    'group relative rounded-xl shadow-md transition-all hover:shadow-lg', 
    'border-opacity-40 bg-opacity-30 backdrop-blur-md',
    'bg-gradient-to-br from-white/30 to-white/10 dark:from-gray-900/50 dark:to-gray-900/30',
    className
  )}>
    <CardDecorator />
    {children}
  </Card>
);

const CardDecorator = () => (
  <>
    <span className="border-primary absolute -left-px -top-px block size-2 border-l-2 border-t-2 rounded-tl"></span>
    <span className="border-primary absolute -right-px -top-px block size-2 border-r-2 border-t-2 rounded-tr"></span>
    <span className="border-primary absolute -bottom-px -left-px block size-2 border-b-2 border-l-2 rounded-bl"></span>
    <span className="border-primary absolute -bottom-px -right-px block size-2 border-b-2 border-r-2 rounded-br"></span>
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
  </>
);

export default function Labs() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("saved");
  
  // State for saved labs with caching
  const [savedLabs, setSavedLabs] = useState<Lab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting state
  const [sortField, setSortField] = useState<"title" | "category" | "gradeLevel">("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  // Load labs with caching
  useEffect(() => {
    const loadLabs = async () => {
      setIsLoading(true);
      
      try {
        // MODIFIED: Always use the latest data from mockData.ts
        // and ignore any cached data in localStorage
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Add timestamps for sorting
        const labsWithDate = labs.map(lab => ({
          ...lab,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
        }));
        
        setSavedLabs(labsWithDate);
        
        // Update the cache
        localStorage.setItem('savedLabs', JSON.stringify(labsWithDate));
        
        console.log(`Loaded ${labsWithDate.length} labs from mockData.ts`);
      } catch (error) {
        console.error("Failed to load labs:", error);
        toast.error("Failed to load labs. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLabs();
  }, []);
  
  // Handle lab click
  const handleLabClick = (labId: string) => {
    navigate(`/labs/${labId}`);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setGradeFilter("all");
  };
  
  // Refresh the labs list
  const refreshLabs = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      // In a real app, this would refetch from API
      setSavedLabs([...savedLabs]);
      setIsLoading(false);
      toast.success("Labs list refreshed");
    }, 500);
  };
  
  // Reset labs data from mock data
  const resetLabsData = () => {
    setIsLoading(true);
    
    try {
      // Clear the localStorage cache
      localStorage.removeItem('savedLabs');
      
      // Add timestamps for sorting
      const labsWithDate = labs.map(lab => ({
        ...lab,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
      }));
      
      console.log(`Reset to ${labsWithDate.length} labs from mockData.ts`);
      
      // Update state with the latest data
      setSavedLabs(labsWithDate);
      
      // Cache the result
      localStorage.setItem('savedLabs', JSON.stringify(labsWithDate));
      
      toast.success(`Labs data has been reset with the latest ${labsWithDate.length} labs`);
    } catch (error) {
      console.error("Failed to reset labs data:", error);
      toast.error("Failed to reset labs data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle sort direction or change sort field
  const handleSort = (field: "title" | "category" | "gradeLevel") => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  // Filter and sort labs
  const filteredLabs = useMemo(() => {
    // First, filter the labs
    let result = savedLabs.filter(lab => {
      const matchesSearch = 
        searchQuery === "" || 
        lab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lab.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lab.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
      const matchesCategory = 
        categoryFilter === "all" || 
        lab.category === categoryFilter;
        
      const matchesGrade =
        gradeFilter === "all" ||
        lab.gradeLevel === gradeFilter;
        
      return matchesSearch && matchesCategory && matchesGrade;
    });
    
    // Then, sort the filtered results
    result.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      
      if (sortField === "title") {
        return direction * a.title.localeCompare(b.title);
      } else if (sortField === "category") {
        return direction * a.category.localeCompare(b.category);
      } else { // gradeLevel
        return direction * a.gradeLevel.localeCompare(b.gradeLevel);
      }
    });
    
    return result;
  }, [savedLabs, searchQuery, categoryFilter, gradeFilter, sortField, sortDirection]);
  
  // Paginate labs
  const paginatedLabs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLabs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredLabs, currentPage]);
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(filteredLabs.length / ITEMS_PER_PAGE));
  
  // Handle page changes
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  // Calculate category distribution for visualization
  const getCategoryDistribution = () => {
    const distribution: Record<string, number> = {};
    savedLabs.forEach(lab => {
      distribution[lab.category] = (distribution[lab.category] || 0) + 1;
    });
    return distribution;
  };
  
  const categoryDistribution = getCategoryDistribution();
  
  // Function to get appropriate icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "physics":
        return <FlaskConical className="h-4 w-4" />;
      case "chemistry":
        return <Beaker className="h-4 w-4" />;
      case "biology":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Beaker className="h-4 w-4" />;
    }
  };

  // Calculate total categories
  const totalCategories = Object.values(categoryDistribution).reduce((a, b) => a + b, 0);

  // Handle external lab selection
  const handleExternalLabSelect = (lab: any) => {
    window.open(lab.url, "_blank");
    toast.success(`Opened ${lab.title} in a new tab`);
  };

  return (
    <Layout>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Virtual Labs</h1>
          <p className="text-muted-foreground mt-1">
            Explore interactive virtual lab simulations for various science subjects
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList className="mb-2 bg-background/50 backdrop-blur-sm">
              <TabsTrigger value="saved" className="data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-md">
                Available Labs
                <kbd className="ml-2 bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded">Alt+1</kbd>
              </TabsTrigger>
              <TabsTrigger value="explore" className="data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-md">
                Explore More
                <kbd className="ml-2 bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded">Alt+2</kbd>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="saved" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <FeatureCard>
              <CardHeader className="pb-0">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
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
                        <X className="h-3.5 w-3.5" />
                        <span className="sr-only">Clear search</span>
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <FilterIcon className="h-3.5 w-3.5" />
                      <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <ChevronDown className="h-3.5 w-3.5" />
                          <span>Sort</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className={cn("flex justify-between", sortField === "title" && "text-primary font-medium")}
                          onClick={() => handleSort("title")}
                        >
                          <span>Title</span>
                          {sortField === "title" && (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className={cn("flex justify-between", sortField === "category" && "text-primary font-medium")}
                          onClick={() => handleSort("category")}
                        >
                          <span>Category</span>
                          {sortField === "category" && (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className={cn("flex justify-between", sortField === "gradeLevel" && "text-primary font-medium")}
                          onClick={() => handleSort("gradeLevel")}
                        >
                          <span>Grade Level</span>
                          {sortField === "gradeLevel" && (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={refreshLabs}
                      className="h-8 w-8"
                      disabled={isLoading}
                    >
                      <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                      <span className="sr-only">Refresh</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetLabsData}
                      disabled={isLoading}
                      className="ml-2"
                    >
                      Reset Data
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {showFilters && (
                <CardContent className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in-50 duration-300">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                      <SelectItem value="biology">Biology</SelectItem>
                      <SelectItem value="earth">Earth Science</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder="Grade Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      <SelectItem value="k-2">K-2</SelectItem>
                      <SelectItem value="3-5">3-5</SelectItem>
                      <SelectItem value="6-8">6-8</SelectItem>
                      <SelectItem value="9-12">9-12</SelectItem>
                      <SelectItem value="college">College</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {(categoryFilter !== "all" || gradeFilter !== "all" || searchQuery) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearFilters}
                      className="text-xs sm:col-span-2"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </CardContent>
              )}
            </FeatureCard>
            
            {/* Category Distribution */}
            {!isLoading && savedLabs.length > 0 && (
              <FeatureCard>
                <CardHeader>
                  <h3 className="text-lg font-medium">Lab Categories Distribution</h3>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-3">
                    {Object.entries(categoryDistribution).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(category)}
                          <span className="capitalize">{category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs">{count} labs</div>
                          <div className="text-xs">({Math.round(count / totalCategories * 100)}%)</div>
                        </div>
                        <div className="w-1/3 bg-muted rounded-full overflow-hidden h-1.5">
                          <div 
                            className="bg-primary h-full rounded-full" 
                            style={{ width: `${(count / totalCategories) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </FeatureCard>
            )}
            
            {isLoading ? (
              // Loading skeleton
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <FeatureCard key={index} className="h-[250px] animate-pulse">
                    <div className="aspect-video w-full bg-muted"></div>
                    <CardContent className="p-4 h-full">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                      <div className="h-8 bg-muted rounded w-full mt-auto"></div>
                    </CardContent>
                  </FeatureCard>
                ))}
              </div>
            ) : paginatedLabs.length === 0 ? (
              // Empty state
              <div className="text-center py-12 border rounded-lg bg-background">
                <Beaker className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No labs found</h3>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                  {filteredLabs.length === 0 ? 
                    "No labs available at the moment." : 
                    "No labs match your current filters. Try adjusting your search criteria."}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedLabs.map((lab) => (
                    <FeatureCard key={lab.id} className="hover:border-primary/30 transition-colors overflow-hidden">
                      <LabCard lab={lab} onClick={() => handleLabClick(lab.id)} />
                    </FeatureCard>
                  ))}
                </div>
                
                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-xs text-muted-foreground">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredLabs.length)} of {filteredLabs.length} labs
                    </p>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <span className="text-xs">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          {/* Explore Tab for Virtual Labs Collection */}
          <TabsContent value="explore" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <VirtualLabsCollection onLabSelect={handleExternalLabSelect} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
