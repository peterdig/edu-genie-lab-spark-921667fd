import { LessonResult } from "@/types/lessons";

// Get saved lessons from localStorage
export const getSavedLessons = (): LessonResult[] => {
  try {
    return JSON.parse(localStorage.getItem("savedLessons") || "[]");
  } catch (e) {
    console.error("Failed to load saved lessons:", e);
    return [];
  }
};

// Save a lesson to localStorage
export const saveLesson = (lesson: LessonResult) => {
  try {
    const savedLessons = getSavedLessons();
    const existingIndex = savedLessons.findIndex(l => l.id === lesson.id);
    
    if (existingIndex >= 0) {
      savedLessons[existingIndex] = lesson;
    } else {
      savedLessons.push(lesson);
    }
    
    localStorage.setItem("savedLessons", JSON.stringify(savedLessons));
    return true;
  } catch (e) {
    console.error("Failed to save lesson:", e);
    return false;
  }
};

// Get recent lessons from localStorage
export const getRecentLessons = (): LessonResult[] => {
  try {
    const recentIds = JSON.parse(localStorage.getItem("recentLessons") || "[]");
    const savedLessons = getSavedLessons();
    const generatedLessons = JSON.parse(localStorage.getItem("generatedLessons") || "[]");
    
    // Combine all lessons
    const allLessons = [...savedLessons, ...generatedLessons];
    
    // Return lessons in order of recent access
    return recentIds
      .map(id => allLessons.find(l => l.id === id))
      .filter(Boolean);
  } catch (e) {
    console.error("Failed to load recent lessons:", e);
    return [];
  }
};

// Add a lesson to recent lessons
export const addRecentLesson = (lessonId: string) => {
  try {
    let recentLessons = JSON.parse(localStorage.getItem("recentLessons") || "[]");
    
    // Remove if already exists
    recentLessons = recentLessons.filter((id: string) => id !== lessonId);
    
    // Add to front of array
    recentLessons.unshift(lessonId);
    
    // Keep only last 10 lessons
    recentLessons = recentLessons.slice(0, 10);
    
    localStorage.setItem("recentLessons", JSON.stringify(recentLessons));
    return true;
  } catch (e) {
    console.error("Failed to add recent lesson:", e);
    return false;
  }
}; 