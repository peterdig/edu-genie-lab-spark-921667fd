import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockContentItems } from "@/data/mockFolders";
import { ContentItem } from "@/types/folders";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Book, Beaker, FileSpreadsheet, Plus, Calendar, Clock, GripHorizontal, X, Trash2, Save, Download, Pencil } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';
import "@/styles/curriculum-planner.css";

// Define types for curriculum planning
interface PlannerItem extends ContentItem {
  notes?: string;
  duration?: string;
}

interface PlannerDay {
  id: string;
  date: string;
  items: PlannerItem[];
}

interface PlannerWeek {
  id: string;
  weekNumber: number;
  days: PlannerDay[];
}

export default function CurriculumPlanner() {
  const [availableContent, setAvailableContent] = useState<ContentItem[]>([]);
  const [weeks, setWeeks] = useState<PlannerWeek[]>([]);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");
  const [isAddWeekDialogOpen, setIsAddWeekDialogOpen] = useState(false);
  const [newWeekNumber, setNewWeekNumber] = useState<number>(1);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<{item: PlannerItem, dayId: string} | null>(null);
  
  // Use ref to store a flag indicating if drag is in progress
  const isDraggingRef = useRef(false);
  
  // Initialize with mock data
  useEffect(() => {
    // Try to load saved plan from localStorage
    const savedPlan = localStorage.getItem('curriculumPlan');
    
    if (savedPlan) {
      try {
        const { weeks: savedWeeks, currentWeek: savedCurrentWeek } = JSON.parse(savedPlan);
        setWeeks(savedWeeks);
        setCurrentWeek(savedCurrentWeek);
        toast.success("Loaded saved curriculum plan");
      } catch (error) {
        console.error("Error loading saved plan:", error);
        initializeWithDefaultData();
      }
    } else {
      initializeWithDefaultData();
    }
  }, []);
  
  // Initialize with default data
  const initializeWithDefaultData = () => {
    // Make sure we have content items available
    if (mockContentItems && mockContentItems.length > 0) {
      // Create deep copies to avoid reference issues
      const contentItemsCopy = JSON.parse(JSON.stringify(mockContentItems));
      setAvailableContent(contentItemsCopy);
      
      // Create initial week
      const initialWeek = createWeek(1);
      setWeeks([initialWeek]);
      
      console.log("Initialized curriculum planner with mock data:", {
        contentItems: contentItemsCopy.length,
        weeks: 1
      });
    } else {
      console.error("No mock content items found for curriculum planner");
      // Create empty arrays to avoid null references
      setAvailableContent([]);
      
      // Create initial week even if no content is available
      const initialWeek = createWeek(1);
      setWeeks([initialWeek]);
    }
  };
  
  // Create a new week with 5 days (Monday to Friday)
  const createWeek = (weekNumber: number): PlannerWeek => {
    const days: PlannerDay[] = [];
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    
    // Set to Monday of the current week
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay; // If Sunday, go back 6 days, otherwise adjust to Monday
    firstDayOfWeek.setDate(today.getDate() + diff + (weekNumber - 1) * 7);
    
    // Create 5 days (Monday to Friday)
    for (let i = 0; i < 5; i++) {
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + i);
      
      days.push({
        id: uuidv4(),
        date: date.toISOString().split('T')[0],
        items: []
      });
    }
    
    return {
      id: uuidv4(),
      weekNumber,
      days
    };
  };
  
  // Add a new week
  const handleAddWeek = () => {
    if (weeks.some(week => week.weekNumber === newWeekNumber)) {
      toast.error(`Week ${newWeekNumber} already exists`);
      return;
    }
    
    const newWeek = createWeek(newWeekNumber);
    setWeeks([...weeks, newWeek].sort((a, b) => a.weekNumber - b.weekNumber));
    setCurrentWeek(newWeekNumber);
    setIsAddWeekDialogOpen(false);
    toast.success(`Week ${newWeekNumber} added`);
  };
  
  // Handle drag start
  const onDragStart = () => {
    isDraggingRef.current = true;
    document.body.classList.add('dragging');
    document.body.classList.add('dragging-ui');
    
    // Force grabbing cursor style
    const style = document.createElement('style');
    style.id = 'grabbing-cursor-style';
    style.innerHTML = `
      * {
        cursor: grabbing !important;
      }
      .draggable-item.dragging * {
        cursor: grabbing !important;
      }
    `;
    document.head.appendChild(style);
  };
  
  // Handle drag and drop
  const onDragEnd = (result: DropResult) => {
    isDraggingRef.current = false;
    document.body.classList.remove('dragging');
    document.body.classList.remove('dragging-ui');
    
    // Remove grabbing cursor style
    const style = document.getElementById('grabbing-cursor-style');
    if (style) {
      style.parentNode?.removeChild(style);
    }
    
    const { source, destination } = result;
    
    // Dropped outside a droppable area
    if (!destination) return;
    
    // Moving within the available content list
    if (source.droppableId === "available-content" && destination.droppableId === "available-content") {
      const items = Array.from(availableContent);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      setAvailableContent(items);
      return;
    }
    
    // Moving from available content to a day
    if (source.droppableId === "available-content") {
      const sourceItems = Array.from(availableContent);
      const [movedItem] = sourceItems.splice(source.index, 1);
      
      const currentWeekData = weeks.find(week => week.weekNumber === currentWeek);
      if (!currentWeekData) return;
      
      const dayIndex = currentWeekData.days.findIndex(day => day.id === destination.droppableId);
      if (dayIndex === -1) return;
      
      // Create a deep copy of the weeks array to ensure proper state update
      const newWeeks = JSON.parse(JSON.stringify(weeks));
      const weekIndex = newWeeks.findIndex(week => week.weekNumber === currentWeek);
      
      // Create a planner item from the content item
      const plannerItem: PlannerItem = {
        ...movedItem,
        id: uuidv4(), // Generate a new ID for the planner item
        notes: "",
        duration: "1 hour"
      };
      
      newWeeks[weekIndex].days[dayIndex].items.splice(destination.index, 0, plannerItem);
      
      setWeeks(newWeeks);
      setAvailableContent(sourceItems);
      
      // Save to localStorage immediately to ensure persistence
      localStorage.setItem('curriculumPlan', JSON.stringify({
        weeks: newWeeks,
        currentWeek
      }));
      
      // Show success toast
      toast.success(`Added "${movedItem.title}" to ${formatDate(newWeeks[weekIndex].days[dayIndex].date)}`);
      return;
    }
    
    // Moving between days or within the same day
    const currentWeekData = weeks.find(week => week.weekNumber === currentWeek);
    if (!currentWeekData) return;
    
    const sourceDay = currentWeekData.days.find(day => day.id === source.droppableId);
    const destDay = currentWeekData.days.find(day => day.id === destination.droppableId);
    
    if (!sourceDay || !destDay) return;
    
    // Create a deep copy of the weeks array to ensure proper state update
    const newWeeks = JSON.parse(JSON.stringify(weeks));
    const weekIndex = newWeeks.findIndex(week => week.weekNumber === currentWeek);
    
    // Moving within the same day
    if (source.droppableId === destination.droppableId) {
      const dayIndex = newWeeks[weekIndex].days.findIndex(day => day.id === source.droppableId);
      const dayItems = Array.from(newWeeks[weekIndex].days[dayIndex].items);
      const [reorderedItem] = dayItems.splice(source.index, 1);
      dayItems.splice(destination.index, 0, reorderedItem);
      newWeeks[weekIndex].days[dayIndex].items = dayItems;
      
      setWeeks(newWeeks);
      
      // Save to localStorage immediately to ensure persistence
      localStorage.setItem('curriculumPlan', JSON.stringify({
        weeks: newWeeks,
        currentWeek
      }));
      
      toast.success("Item reordered");
    } else {
      // Moving between days
      const sourceDayIndex = newWeeks[weekIndex].days.findIndex(day => day.id === source.droppableId);
      const destDayIndex = newWeeks[weekIndex].days.findIndex(day => day.id === destination.droppableId);
      
      const sourceItems = Array.from(newWeeks[weekIndex].days[sourceDayIndex].items);
      const destItems = Array.from(newWeeks[weekIndex].days[destDayIndex].items);
      
      const [movedItem] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, movedItem);
      
      newWeeks[weekIndex].days[sourceDayIndex].items = sourceItems;
      newWeeks[weekIndex].days[destDayIndex].items = destItems;
      
      setWeeks(newWeeks);
      
      // Save to localStorage immediately to ensure persistence
      localStorage.setItem('curriculumPlan', JSON.stringify({
        weeks: newWeeks,
        currentWeek
      }));
      
      toast.success(`Moved item to ${formatDate(newWeeks[weekIndex].days[destDayIndex].date)}`);
    }
  };
  
  // Remove an item from a day
  const handleRemoveItem = (dayId: string, itemId: string) => {
    const currentWeekData = weeks.find(week => week.weekNumber === currentWeek);
    if (!currentWeekData) return;
    
    const dayIndex = currentWeekData.days.findIndex(day => day.id === dayId);
    if (dayIndex === -1) return;
    
    const itemIndex = currentWeekData.days[dayIndex].items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;
    
    // Create a deep copy of the weeks array to ensure proper state update
    const newWeeks = JSON.parse(JSON.stringify(weeks));
    const weekIndex = newWeeks.findIndex(week => week.weekNumber === currentWeek);
    
    // Get the removed item before removing it
    const removedItem = newWeeks[weekIndex].days[dayIndex].items[itemIndex];
    
    // Remove the item
    newWeeks[weekIndex].days[dayIndex].items.splice(itemIndex, 1);
    
    // Add the item back to available content if it came from there originally
    // We need to modify this slightly to make sure we're not adding duplicate items
    const cleanedItem = {
      id: uuidv4(), // Generate a new ID to avoid conflicts
      title: removedItem.title,
      type: removedItem.type,
      createdAt: removedItem.createdAt,
      updatedAt: removedItem.updatedAt,
      contentId: removedItem.contentId,
      version: removedItem.version
    };
    
    setAvailableContent([...availableContent, cleanedItem]);
    setWeeks(newWeeks);
    
    // Save to localStorage immediately to ensure persistence
    localStorage.setItem('curriculumPlan', JSON.stringify({
      weeks: newWeeks,
      currentWeek
    }));
    
    toast.success(`Removed "${removedItem.title}" from schedule`);
  };
  
  // Edit an item
  const handleEditItem = (dayId: string, item: PlannerItem) => {
    setCurrentEditItem({item, dayId});
    setIsItemDialogOpen(true);
  };
  
  // Save edited item
  const handleSaveItem = () => {
    if (!currentEditItem) return;
    
    const {item, dayId} = currentEditItem;
    
    const currentWeekData = weeks.find(week => week.weekNumber === currentWeek);
    if (!currentWeekData) return;
    
    const dayIndex = currentWeekData.days.findIndex(day => day.id === dayId);
    if (dayIndex === -1) return;
    
    const itemIndex = currentWeekData.days[dayIndex].items.findIndex(existingItem => existingItem.id === item.id);
    if (itemIndex === -1) return;
    
    // Create a deep copy of the weeks array to ensure proper state update
    const newWeeks = JSON.parse(JSON.stringify(weeks));
    const weekIndex = newWeeks.findIndex(week => week.weekNumber === currentWeek);
    
    // Update the item with edited values
    newWeeks[weekIndex].days[dayIndex].items[itemIndex] = {
      ...item,
      updatedAt: new Date().toISOString()
    };
    
    setWeeks(newWeeks);
    setIsItemDialogOpen(false);
    setCurrentEditItem(null);
    
    // Save to localStorage immediately to ensure persistence
    localStorage.setItem('curriculumPlan', JSON.stringify({
      weeks: newWeeks,
      currentWeek
    }));
    
    toast.success(`Updated "${item.title}" details`);
  };
  
  // Save plan to localStorage
  const handleSavePlan = () => {
    try {
      // Create a deep copy to ensure we're saving the complete state
      const planToSave = {
        weeks: JSON.parse(JSON.stringify(weeks)),
        currentWeek
      };
      
      localStorage.setItem('curriculumPlan', JSON.stringify(planToSave));
      toast.success("Curriculum plan saved successfully");
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Failed to save curriculum plan");
    }
  };
  
  // Export the curriculum plan as PDF
  const handleExportPlan = () => {
    // In a real app, this would generate a PDF using a library like jsPDF
    // For this demo, we'll create a printable version
    
    // Create a formatted text version of the plan
    let planText = "# CURRICULUM PLAN\n\n";
    
    // Sort weeks
    const sortedWeeks = [...weeks].sort((a, b) => a.weekNumber - b.weekNumber);
    
    sortedWeeks.forEach(week => {
      planText += `## Week ${week.weekNumber}\n\n`;
      
      week.days.forEach(day => {
        planText += `### ${formatDate(day.date)}\n\n`;
        
        if (day.items.length === 0) {
          planText += "No items scheduled\n\n";
        } else {
          day.items.forEach(item => {
            planText += `- ${item.title} (${item.type})`;
            if (item.duration) planText += ` - ${item.duration}`;
            planText += "\n";
            if (item.notes) planText += `  Notes: ${item.notes}\n`;
            planText += "\n";
          });
        }
      });
      
      planText += "\n";
    });
    
    // Create a data URL for downloading
    const blob = new Blob([planText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `curriculum-plan-${timestamp}.txt`;
    link.href = url;
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    
    toast.success("Curriculum plan exported successfully");
  };
  
  // Filter available content
  const filteredContent = availableContent.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = contentTypeFilter === "all" || item.type === contentTypeFilter;
    return matchesSearch && matchesType;
  });
  
  // Get content type icon
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <Book className="h-4 w-4" />;
      case 'lab':
        return <Beaker className="h-4 w-4" />;
      case 'assessment':
        return <FileSpreadsheet className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  // Get the current week data
  const currentWeekData = weeks.find(week => week.weekNumber === currentWeek);
  
  // Calculate summary statistics for the current week
  const calculateWeekStats = () => {
    if (!currentWeekData) return null;
    
    const totalItems = currentWeekData.days.reduce((sum, day) => sum + day.items.length, 0);
    
    // Count by type
    const typeCount = {
      lesson: 0,
      lab: 0,
      assessment: 0
    };
    
    // Track daily workload
    const dailyCount = currentWeekData.days.map(day => day.items.length);
    
    // Calculate total duration if available
    let totalDurationMinutes = 0;
    let itemsWithDuration = 0;
    
    currentWeekData.days.forEach(day => {
      day.items.forEach(item => {
        // Count by type
        if (item.type in typeCount) {
          typeCount[item.type as keyof typeof typeCount]++;
        }
        
        // Try to parse duration if available
        if (item.duration) {
          const durationMatch = item.duration.match(/(\d+)\s*(?:hour|hr)/i);
          if (durationMatch) {
            const hours = parseInt(durationMatch[1]);
            totalDurationMinutes += hours * 60;
            itemsWithDuration++;
          }
        }
      });
    });
    
    // Find max and min workload days
    const maxWorkloadDay = Math.max(...dailyCount);
    const minWorkloadDay = Math.min(...dailyCount);
    
    return {
      totalItems,
      typeCount,
      dailyCount,
      totalDurationMinutes,
      itemsWithDuration,
      maxWorkloadDay,
      minWorkloadDay
    };
  };

  const weekStats = calculateWeekStats();
  
  return (
    <Layout>
      <div className="container mx-auto py-4">
        {/* Top Navigation Bar with Week Selection */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 bg-card/90 shadow-sm border-muted/60 rounded-md p-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary hidden md:block" />
          <div>
              <h2 className="text-xl font-bold">Curriculum Planner</h2>
              {currentWeekData && (
                <p className="text-sm text-muted-foreground">
                  {formatDate(currentWeekData.days[0].date)} — {formatDate(currentWeekData.days[currentWeekData.days.length-1].date)}
                </p>
              )}
          </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
          <div className="flex items-center gap-2">
              <Select value={currentWeek.toString()} onValueChange={(value) => setCurrentWeek(parseInt(value))}>
                <SelectTrigger className="w-[150px] h-9">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground md:hidden" />
                  <span>Week {currentWeek}</span>
                </SelectTrigger>
                <SelectContent>
                  {weeks.map((week) => (
                    <SelectItem key={week.id} value={week.weekNumber.toString()}>
                      Week {week.weekNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Dialog open={isAddWeekDialogOpen} onOpenChange={setIsAddWeekDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Plus className="h-4 w-4" />
            </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Week</DialogTitle>
                    <DialogDescription>
                      Enter the week number to add to your curriculum plan.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="week-number">Week Number</Label>
                      <Input
                        id="week-number"
                        type="number"
                        min="1"
                        value={newWeekNumber}
                        onChange={(e) => setNewWeekNumber(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddWeekDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddWeek}>Add Week</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {currentWeekData && weekStats && (
              <div className="flex items-center gap-3 px-3 py-1 bg-muted/30 rounded-md text-xs">
                <div className="flex items-center gap-1">
                  <Book className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{weekStats.typeCount.lesson}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Beaker className="h-3.5 w-3.5 text-blue-500" />
                  <span>{weekStats.typeCount.lab}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-amber-500" />
                  <span>{weekStats.typeCount.assessment}</span>
                </div>
                <div className="hidden md:flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {weekStats.itemsWithDuration > 0 
                      ? `${Math.round(weekStats.totalDurationMinutes / 60)}h` 
                      : "0h"}
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={handleExportPlan} className="h-9">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button size="sm" onClick={handleSavePlan} className="h-9">
                <Save className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline">Save</span>
            </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-12 gap-4">
          {/* Main Content Area */}
          <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            {/* Content Library */}
            <div className="col-span-12 md:col-span-3 lg:col-span-2">
              <Card className="bg-card/90 shadow-sm border-muted/60 h-full">
              <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Book className="h-5 w-5 text-primary" />
                    <CardTitle>Content Library</CardTitle>
                  </div>
                <CardDescription>
                    Drag items to your schedule
                </CardDescription>
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="relative">
                  <Input
                    placeholder="Search content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-9 pl-8"
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                      </svg>
                    </div>
                  <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                      <SelectTrigger className="h-9">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="lesson">Lessons</SelectItem>
                      <SelectItem value="lab">Labs</SelectItem>
                      <SelectItem value="assessment">Assessments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
                <CardContent className="p-0 border-t">
                  <div className="flex items-center px-3 py-2 justify-between sticky top-0 z-10 bg-muted/30 border-b border-muted/60">
                    <div className="flex items-center gap-1.5">
                      <Book className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium">Available Items</h3>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm font-medium">
                        {filteredContent.length} {filteredContent.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>
                <Droppable droppableId="available-content">
                  {(provided, snapshot) => (
                      <ScrollArea className="h-[650px]">
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(
                            "p-3 space-y-2",
                            snapshot.isDraggingOver && "bg-muted/50 droppable-area active"
                        )}
                      >
                        {filteredContent.length > 0 ? (
                          filteredContent.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={cn(
                                      "p-3 bg-card/90 border rounded-md flex items-start gap-2 transition-all draggable-item",
                                      snapshot.isDragging && "shadow-lg border-primary dragging",
                                      item.type === "lab" && "border-blue-500/20 border-l-blue-500 border-l-4",
                                      item.type === "assessment" && "border-amber-500/20 border-l-amber-500 border-l-4",
                                      item.type === "lesson" && "border-emerald-500/20 border-l-emerald-500 border-l-4"
                                    )}
                                    data-type={item.type}
                                >
                                  <div 
                                    {...provided.dragHandleProps}
                                      className="mt-1 cursor-grab"
                                  >
                                    <GripHorizontal className="h-4 w-4 text-muted-foreground drag-handle" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1 mb-1.5">
                                      {getContentTypeIcon(item.type)}
                                      <span className="text-xs font-medium uppercase text-muted-foreground">{item.type}</span>
                                    </div>
                                      <h4 className="font-medium text-sm item-title">{item.title}</h4>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                            <div className="py-10 text-center text-muted-foreground">
                              <p>No content found</p>
                              <p className="text-xs mt-1">Try adjusting your filters</p>
                          </div>
                        )}
                        {provided.placeholder}
                      </div>
                    </ScrollArea>
                  )}
                </Droppable>
              </CardContent>
                <CardFooter className="flex justify-between border-t py-2 text-xs text-muted-foreground">
                  <div>Drag items to your schedule</div>
                  <div className="text-primary">
                    {filteredContent.length} available
                  </div>
                </CardFooter>
            </Card>
            </div>
            
            {/* Weekly Schedule Panel - LARGER */}
            <div className="col-span-12 md:col-span-9 lg:col-span-10">
              <Card className="bg-card/90 shadow-sm border-muted/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <CardTitle>Week {currentWeek} Schedule</CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="content-type-indicator lesson"></span>
                        <span className="text-xs">Lesson</span>
                            </div>
                      <div className="flex items-center gap-2">
                        <span className="content-type-indicator lab"></span>
                        <span className="text-xs">Lab</span>
                          </div>
                      <div className="flex items-center gap-2">
                        <span className="content-type-indicator assessment"></span>
                        <span className="text-xs">Assessment</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {currentWeekData ? (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-0 border-t h-full">
                      {currentWeekData.days.map((day, dayIndex) => (
                        <div key={day.id} className={cn(
                          "flex flex-col h-full", 
                          dayIndex > 0 && "md:border-l border-muted/60"
                        )}>
                          <div className="bg-muted/30 px-3 py-2 week-day-header sticky top-0 z-10 border-b border-muted/60">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <h3 className="text-sm font-medium">{formatDate(day.date)}</h3>
                              </div>
                              <div className="flex items-center">
                                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm font-medium">
                                  {day.items.length} {day.items.length === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Droppable droppableId={day.id}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={cn(
                                  "flex-1 p-3 min-h-[550px] droppable-area h-full",
                                  snapshot.isDraggingOver && "bg-primary/5 active can-drop"
                                )}
                              >
                                <div className="space-y-2">
                                  {day.items.map((item, index) => (
                                    <Draggable key={item.id} draggableId={item.id} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={cn(
                                            "p-3 bg-card/90 border rounded-md item-content draggable-item transition-all",
                                            snapshot.isDragging && "shadow-lg border-primary dragging",
                                            item.type === "lab" && "border-blue-500/20 border-l-blue-500 border-l-4",
                                            item.type === "assessment" && "border-amber-500/20 border-l-amber-500 border-l-4",
                                            item.type === "lesson" && "border-emerald-500/20 border-l-emerald-500 border-l-4"
                                          )}
                                          data-type={item.type}
                                        >
                                          <div className="flex items-start gap-2">
                                            <div
                                              {...provided.dragHandleProps}
                                              className="mt-1 cursor-grab"
                                            >
                                              <GripHorizontal className="h-4 w-4 text-muted-foreground drag-handle" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-1 mb-1.5">
                                                {getContentTypeIcon(item.type)}
                                                <span className="text-xs font-medium uppercase text-muted-foreground">{item.type}</span>
                                              </div>
                                              <h4 className="font-medium text-sm mb-1 item-title">{item.title}</h4>
                                              {item.duration && (
                                                <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground item-duration">
                                                  <Clock className="h-3 w-3" />
                                                  <span>{item.duration}</span>
                                                </div>
                                              )}
                                              {item.notes && (
                                                <div className="mt-1.5 text-xs text-muted-foreground line-clamp-2 item-notes">
                                                  {item.notes}
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex gap-1 item-actions">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => handleEditItem(day.id, item)}
                                                title="Edit item"
                                              >
                                                <Pencil className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => handleRemoveItem(day.id, item.id)}
                                                title="Remove item"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                                {day.items.length === 0 && (
                                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    <div className="text-center">
                                    <p>Drop items here</p>
                                      <p className="text-xs mt-1 text-muted-foreground/70">Drag content from library</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-36 text-center text-muted-foreground">
                      <p className="font-medium">No week data available</p>
                      <p className="text-sm mt-1">Select a different week or add a new one</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between border-t py-2 text-xs text-muted-foreground">
                  <div>Tip: Drag items from library to schedule them</div>
                  <div className="text-primary">
                    {weekStats && weekStats.totalItems > 0 
                      ? `${weekStats.totalItems} item${weekStats.totalItems !== 1 ? 's' : ''} scheduled` 
                      : 'No items scheduled'
                    }
                  </div>
                </CardFooter>
              </Card>
            </div>
          </DragDropContext>
        </div>
      </div>
      
      {/* Item Edit Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={(open) => {
        setIsItemDialogOpen(open);
        if (!open) setCurrentEditItem(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update details for this scheduled item
            </DialogDescription>
          </DialogHeader>
          {currentEditItem && (
            <div className="grid gap-4 py-4">
              <div className="flex gap-3 items-center">
                <div className={`w-2 h-full self-stretch bg-${currentEditItem.item.type === 'lesson' ? 'emerald' : currentEditItem.item.type === 'lab' ? 'blue' : 'amber'}-500 rounded-full`}></div>
              <div>
                <h3 className="font-medium">{currentEditItem.item.title}</h3>
                <p className="text-sm text-muted-foreground">{currentEditItem.item.type}</p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={currentEditItem.item.duration || ""}
                  onChange={(e) => setCurrentEditItem({
                    ...currentEditItem,
                    item: { ...currentEditItem.item, duration: e.target.value }
                  })}
                  placeholder="e.g. 1 hour"
                />
                <p className="text-xs text-muted-foreground">Specify how long this activity will take</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={currentEditItem.item.notes || ""}
                  onChange={(e) => setCurrentEditItem({
                    ...currentEditItem,
                    item: { ...currentEditItem.item, notes: e.target.value }
                  })}
                  placeholder="Add notes about this item..."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">Add any additional information or instructions</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveItem}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
} 