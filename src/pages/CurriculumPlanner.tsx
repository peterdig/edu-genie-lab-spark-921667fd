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
    setAvailableContent(mockContentItems);
    
    // Create initial week
    const initialWeek = createWeek(1);
    setWeeks([initialWeek]);
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
      
      const newWeeks = [...weeks];
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
    
    const newWeeks = [...weeks];
    const weekIndex = newWeeks.findIndex(week => week.weekNumber === currentWeek);
    
    // Moving within the same day
    if (source.droppableId === destination.droppableId) {
      const dayIndex = newWeeks[weekIndex].days.findIndex(day => day.id === source.droppableId);
      const dayItems = Array.from(newWeeks[weekIndex].days[dayIndex].items);
      const [reorderedItem] = dayItems.splice(source.index, 1);
      dayItems.splice(destination.index, 0, reorderedItem);
      newWeeks[weekIndex].days[dayIndex].items = dayItems;
      
      setWeeks(newWeeks);
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
      toast.success(`Moved item to ${formatDate(newWeeks[weekIndex].days[destDayIndex].date)}`);
    }
  };
  
  // Remove an item from a day
  const handleRemoveItem = (dayId: string, itemId: string) => {
    const currentWeekData = weeks.find(week => week.weekNumber === currentWeek);
    if (!currentWeekData) return;
    
    const dayIndex = currentWeekData.days.findIndex(day => day.id === dayId);
    if (dayIndex === -1) return;
    
    const newWeeks = [...weeks];
    const weekIndex = newWeeks.findIndex(week => week.weekNumber === currentWeek);
    
    const removedItem = newWeeks[weekIndex].days[dayIndex].items.find(item => item.id === itemId);
    if (!removedItem) return;
    
    // Remove the item from the day
    newWeeks[weekIndex].days[dayIndex].items = newWeeks[weekIndex].days[dayIndex].items.filter(item => item.id !== itemId);
    
    // Add the original content back to available content
    const originalContent = mockContentItems.find(item => item.contentId === removedItem.contentId);
    if (originalContent) {
      setAvailableContent([...availableContent, originalContent]);
    }
    
    setWeeks(newWeeks);
    toast.success("Item removed from schedule");
  };
  
  // Open edit dialog for an item
  const handleEditItem = (dayId: string, item: PlannerItem) => {
    setCurrentEditItem({ dayId, item });
    setIsItemDialogOpen(true);
  };
  
  // Save edited item
  const handleSaveItem = () => {
    if (!currentEditItem) return;
    
    const { dayId, item } = currentEditItem;
    
    const currentWeekData = weeks.find(week => week.weekNumber === currentWeek);
    if (!currentWeekData) return;
    
    const dayIndex = currentWeekData.days.findIndex(day => day.id === dayId);
    if (dayIndex === -1) return;
    
    const newWeeks = [...weeks];
    const weekIndex = newWeeks.findIndex(week => week.weekNumber === currentWeek);
    
    const itemIndex = newWeeks[weekIndex].days[dayIndex].items.findIndex(i => i.id === item.id);
    if (itemIndex === -1) return;
    
    // Update the item
    newWeeks[weekIndex].days[dayIndex].items[itemIndex] = item;
    
    setWeeks(newWeeks);
    setIsItemDialogOpen(false);
    setCurrentEditItem(null);
    toast.success("Item updated");
  };
  
  // Save the curriculum plan
  const handleSavePlan = () => {
    // In a real app, this would save to a database
    localStorage.setItem('curriculumPlan', JSON.stringify({
      weeks,
      currentWeek
    }));
    toast.success("Curriculum plan saved");
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
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Curriculum Planner</h1>
            <p className="text-muted-foreground">Plan your curriculum by dragging and dropping content into the schedule</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportPlan}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleSavePlan}>
              <Save className="h-4 w-4 mr-2" />
              Save Plan
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-12 gap-6">
          {/* Wrap everything in a single DragDropContext */}
          <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            {/* Available Content Sidebar */}
            <Card className="col-span-12 md:col-span-3 glass-card">
              <CardHeader className="pb-3">
                <CardTitle>Available Content</CardTitle>
                <CardDescription>
                  Drag items to add to your schedule
                </CardDescription>
                <div className="flex flex-col gap-2 mt-2">
                  <Input
                    placeholder="Search content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                  <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                    <SelectTrigger>
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
              <CardContent>
                <Droppable droppableId="available-content">
                  {(provided, snapshot) => (
                    <ScrollArea className="h-[300px] md:h-[500px]">
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(
                          "space-y-2 p-1",
                          snapshot.isDraggingOver && "bg-muted/50 rounded-md p-2 droppable-area active"
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
                                    "p-3 bg-card border rounded-md flex items-start gap-3 hover:border-primary/50 transition-colors draggable-item",
                                    snapshot.isDragging && "shadow-lg border-primary ring-2 ring-primary/20 dragging"
                                  )}
                                >
                                  <div 
                                    {...provided.dragHandleProps}
                                    className="mt-0.5 cursor-grab"
                                  >
                                    <GripHorizontal className="h-4 w-4 text-muted-foreground drag-handle" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      {getContentTypeIcon(item.type)}
                                      <span className="text-xs font-medium uppercase text-muted-foreground">{item.type}</span>
                                    </div>
                                    <h4 className="font-medium text-sm truncate">{item.title}</h4>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <div className="py-8 text-center text-muted-foreground">
                            <p>No content available</p>
                          </div>
                        )}
                        {provided.placeholder}
                      </div>
                    </ScrollArea>
                  )}
                </Droppable>
              </CardContent>
            </Card>
            
            {/* Weekly Schedule */}
            <div className="col-span-12 md:col-span-9">
              <Card className="glass-card">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Weekly Schedule</CardTitle>
                      <CardDescription>
                        Drag and drop content to plan your week
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Select value={currentWeek.toString()} onValueChange={(value) => setCurrentWeek(parseInt(value))}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Select week" />
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
                          <Button variant="outline" size="icon">
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
                  </div>
                </CardHeader>
                <CardContent>
                  {currentWeekData ? (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {currentWeekData.days.map((day) => (
                        <div key={day.id} className="flex flex-col h-full">
                          <div className="bg-muted/50 p-2 rounded-t-md border border-border week-day-header">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <h3 className="text-sm font-medium">{formatDate(day.date)}</h3>
                              </div>
                            </div>
                          </div>
                          <Droppable droppableId={day.id}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={cn(
                                  "flex-1 p-2 border border-t-0 border-border rounded-b-md bg-background/50 min-h-[250px] md:min-h-[400px] droppable-area",
                                  snapshot.isDraggingOver && "bg-primary/5 border-primary/30 active can-drop"
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
                                            "p-2 bg-card border rounded-md item-content draggable-item",
                                            snapshot.isDragging && "shadow-lg border-primary ring-2 ring-primary/20 dragging"
                                          )}
                                        >
                                          <div className="flex items-start gap-2">
                                            <div
                                              {...provided.dragHandleProps}
                                              className="mt-1 cursor-grab"
                                            >
                                              <GripHorizontal className="h-4 w-4 text-muted-foreground drag-handle" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-1">
                                                {getContentTypeIcon(item.type)}
                                                <span className="text-xs font-medium uppercase text-muted-foreground">{item.type}</span>
                                              </div>
                                              <h4 className="font-medium text-sm truncate item-title">{item.title}</h4>
                                              {item.duration && (
                                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground item-duration">
                                                  <Clock className="h-3 w-3" />
                                                  <span>{item.duration}</span>
                                                </div>
                                              )}
                                              {item.notes && (
                                                <div className="mt-1 text-xs text-muted-foreground line-clamp-1 item-notes">
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
                                              >
                                                <Pencil className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => handleRemoveItem(day.id, item.id)}
                                              >
                                                <X className="h-3 w-3" />
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
                                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm drop-placeholder">
                                    <p>Drop items here</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      <p>No week data available</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    Tip: Drag items from the sidebar to add them to your schedule
                  </p>
                </CardFooter>
              </Card>
            </div>
          </DragDropContext>
        </div>
      </div>
      
      {/* Weekly Summary */}
      {currentWeekData && weekStats && (
        <div className="container mx-auto max-w-7xl mt-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Week {currentWeek} Summary</CardTitle>
              <CardDescription>
                Overview of your curriculum plan for this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Content Distribution</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Book className="h-4 w-4 text-primary" />
                        <span>Lessons</span>
                      </div>
                      <span className="font-medium">{weekStats.typeCount.lesson}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Beaker className="h-4 w-4 text-primary" />
                        <span>Labs</span>
                      </div>
                      <span className="font-medium">{weekStats.typeCount.lab}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-primary" />
                        <span>Assessments</span>
                      </div>
                      <span className="font-medium">{weekStats.typeCount.assessment}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Daily Workload</h3>
                  <div className="flex items-end h-[100px] gap-2">
                    {weekStats.dailyCount.map((count, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-primary/80 rounded-t-sm transition-all duration-500"
                          style={{ 
                            height: `${count ? Math.max(20, (count / Math.max(1, weekStats.maxWorkloadDay)) * 100) : 0}px` 
                          }}
                        />
                        <span className="text-xs mt-1">{currentWeekData.days[index].date.split('-')[2]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Week at a Glance</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Items</span>
                      <span className="font-medium">{weekStats.totalItems}</span>
                    </div>
                    {weekStats.itemsWithDuration > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Estimated Time</span>
                        <span className="font-medium">{Math.round(weekStats.totalDurationMinutes / 60)} hours</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Most Active Day</span>
                      <span className="font-medium">
                        {weekStats.maxWorkloadDay > 0 
                          ? `${currentWeekData.days[weekStats.dailyCount.indexOf(weekStats.maxWorkloadDay)].date.split('-')[2]} (${weekStats.maxWorkloadDay} items)` 
                          : 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
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
              <div>
                <h3 className="font-medium">{currentEditItem.item.title}</h3>
                <p className="text-sm text-muted-foreground">{currentEditItem.item.type}</p>
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