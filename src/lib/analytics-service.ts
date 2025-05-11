import {
  AnalyticsData,
  TimeRange,
  AnalyticsFilters,
  StudentEngagementData,
  ContentUsageData,
  AssessmentPerformanceData,
  ContentDistributionData
} from "@/types/analytics";
import { format, subDays, subMonths } from "date-fns";

// In-memory cache for real-time data
let analyticsCache: AnalyticsData | null = null;
let activeSubscriptions = 0;
let updateInterval: NodeJS.Timeout | null = null;

// Initial data for first load (to avoid a complete blank state)
const initialData: AnalyticsData = {
  studentEngagement: [
    { date: format(subDays(new Date(), 6), 'yyyy-MM-dd'), active: 145 },
    { date: format(subDays(new Date(), 5), 'yyyy-MM-dd'), active: 156 },
    { date: format(subDays(new Date(), 4), 'yyyy-MM-dd'), active: 162 },
    { date: format(subDays(new Date(), 3), 'yyyy-MM-dd'), active: 158 },
    { date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), active: 172 },
    { date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), active: 168 },
    { date: format(new Date(), 'yyyy-MM-dd'), active: 175 }
  ],
  contentUsage: [
    { name: 'Lessons', value: 42, percentage: 42 },
    { name: 'Assessments', value: 28, percentage: 28 },
    { name: 'Labs', value: 15, percentage: 15 },
    { name: 'Templates', value: 15, percentage: 15 },
  ],
  assessmentPerformance: [
    { subject: 'Math', score: 78 },
    { subject: 'Science', score: 82 },
    { subject: 'English', score: 85 },
    { subject: 'History', score: 76 },
    { subject: 'Art', score: 90 },
    { subject: 'Music', score: 88 },
  ],
  contentDistribution: [
    { name: 'Math', value: 30, percentage: 30 },
    { name: 'Science', value: 25, percentage: 25 },
    { name: 'English', value: 20, percentage: 20 },
    { name: 'History', value: 15, percentage: 15 },
    { name: 'Art', value: 10, percentage: 10 },
  ],
  metrics: {
    totalStudents: {
      title: "Total Students",
      value: 245,
      changePercentage: 12,
      icon: "Users",
      timeframe: "from last month"
    },
    avgEngagementTime: {
      title: "Avg. Engagement Time",
      value: "32.5 min",
      changePercentage: 4,
      icon: "Clock",
      timeframe: "from last week"
    },
    contentCreated: {
      title: "Content Created",
      value: 78,
      changePercentage: 18,
      icon: "BookOpen",
      timeframe: "from last month"
    },
    avgAssessmentScore: {
      title: "Avg. Assessment Score",
      value: "82%",
      changePercentage: 3,
      icon: "GraduationCap",
      timeframe: "from last week"
    }
  },
  lastUpdated: new Date().toISOString()
};

// Helper function to generate stable but realistic data variations
function getStableRandomVariation(baseValue: number, variationPercent = 0.05): number {
  const maxVariation = baseValue * variationPercent;
  // Use a consistent seed for stability
  const variation = Math.sin(Date.now() / 10000) * maxVariation;
  return Math.round(baseValue + variation);
}

function generateAnalyticsUpdate(timeRange: TimeRange, prevData: AnalyticsData): AnalyticsData {
  // Generate new data based on previous data to ensure stability and natural transitions
  const newData = { ...prevData };
  
  // Update last updated timestamp
  newData.lastUpdated = new Date().toISOString();
  
  // Update student engagement with smooth trends rather than random jumps
  const newEngagement = [...newData.studentEngagement];
  const latestEngagement = newEngagement[newEngagement.length - 1];
  const newActiveValue = getStableRandomVariation(latestEngagement.active, 0.03);
  
  // Only add a new data point if it's a new day
  const today = format(new Date(), 'yyyy-MM-dd');
  if (latestEngagement.date !== today) {
    newEngagement.push({
      date: today,
      active: newActiveValue,
      previousActive: latestEngagement.active
    });
    
    // Remove oldest entry if exceeding time range
    if (timeRange === '7d' && newEngagement.length > 7) {
      newEngagement.shift();
    } else if (timeRange === '30d' && newEngagement.length > 30) {
      newEngagement.shift();
    }
  } else {
    // Update today's value with a slight variation
    newEngagement[newEngagement.length - 1] = {
      ...latestEngagement,
      active: newActiveValue
    };
  }
  
  newData.studentEngagement = newEngagement;
  
  // Update content metrics with slight variations
  newData.contentUsage = newData.contentUsage.map(item => {
    const newValue = getStableRandomVariation(item.value, 0.02);
    return {
      ...item,
      value: newValue,
      percentage: Math.round(newValue)
    };
  });
  
  // Recalculate percentages for content usage
  const totalUsage = newData.contentUsage.reduce((sum, item) => sum + item.value, 0);
  newData.contentUsage = newData.contentUsage.map(item => ({
    ...item,
    percentage: Math.round((item.value / totalUsage) * 100)
  }));
  
  // Update assessment performance with gentle variations
  newData.assessmentPerformance = newData.assessmentPerformance.map(item => {
    const oldScore = typeof item.score === 'number' ? item.score : parseFloat(item.score.toString());
    const newScore = Math.min(100, Math.max(0, getStableRandomVariation(oldScore, 0.01)));
    return {
      ...item,
      previousScore: oldScore,
      score: newScore,
      change: newScore - oldScore
    };
  });
  
  // Update content distribution with slight variations
  newData.contentDistribution = newData.contentDistribution.map(item => {
    const newValue = getStableRandomVariation(item.value, 0.02);
    return {
      ...item,
      value: newValue
    };
  });
  
  // Recalculate percentages for content distribution
  const totalDistribution = newData.contentDistribution.reduce((sum, item) => sum + item.value, 0);
  newData.contentDistribution = newData.contentDistribution.map(item => ({
    ...item,
    percentage: Math.round((item.value / totalDistribution) * 100)
  }));
  
  // Update metrics with slight variations
  const totalStudentsValue = typeof newData.metrics.totalStudents.value === 'number' 
    ? newData.metrics.totalStudents.value 
    : parseInt(newData.metrics.totalStudents.value.toString());
    
  const contentCreatedValue = typeof newData.metrics.contentCreated.value === 'number'
    ? newData.metrics.contentCreated.value
    : parseInt(newData.metrics.contentCreated.value.toString());
    
  const avgTimeMatch = typeof newData.metrics.avgEngagementTime.value === 'string' 
    ? newData.metrics.avgEngagementTime.value.match(/^([\d.]+)/)
    : null;
  const avgTimeValue = avgTimeMatch ? parseFloat(avgTimeMatch[1]) : 32.5;
  
  const scoreMatch = typeof newData.metrics.avgAssessmentScore.value === 'string'
    ? newData.metrics.avgAssessmentScore.value.match(/^([\d.]+)/)
    : null;
  const scoreValue = scoreMatch ? parseFloat(scoreMatch[1]) : 82;
  
  newData.metrics = {
    totalStudents: {
      ...newData.metrics.totalStudents,
      value: getStableRandomVariation(totalStudentsValue, 0.01),
      changePercentage: getStableRandomVariation(newData.metrics.totalStudents.changePercentage, 0.05)
    },
    avgEngagementTime: {
      ...newData.metrics.avgEngagementTime,
      value: `${getStableRandomVariation(avgTimeValue, 0.02).toFixed(1)} min`,
      changePercentage: getStableRandomVariation(newData.metrics.avgEngagementTime.changePercentage, 0.05)
    },
    contentCreated: {
      ...newData.metrics.contentCreated,
      value: getStableRandomVariation(contentCreatedValue, 0.02),
      changePercentage: getStableRandomVariation(newData.metrics.contentCreated.changePercentage, 0.05)
    },
    avgAssessmentScore: {
      ...newData.metrics.avgAssessmentScore,
      value: `${getStableRandomVariation(scoreValue, 0.01).toFixed(0)}%`,
      changePercentage: getStableRandomVariation(newData.metrics.avgAssessmentScore.changePercentage, 0.05)
    }
  };
  
  return newData;
}

// Get data for the specified time range from cache or generate new
export async function fetchAnalyticsData(filters: AnalyticsFilters): Promise<AnalyticsData> {
  try {
    // Only simulate a small delay on first fetch to mimic API
    if (!analyticsCache) {
      await new Promise(resolve => setTimeout(resolve, 300));
      analyticsCache = initialData;
    }
    
    // If we already have cached data, just transform it for the requested time range
    const data = analyticsCache 
      ? generateAnalyticsUpdate(filters.timeRange, analyticsCache)
      : initialData;
      
    // Update cache
    analyticsCache = data;
    
    return data;
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    throw error;
  }
}

// Function to handle real-time updates more efficiently
export function subscribeToAnalyticsUpdates(
  callback: (data: AnalyticsData) => void,
  filters: AnalyticsFilters
): () => void {
  activeSubscriptions++;
  
  // Initial data fetch (guaranteed to be immediate if cache exists)
  if (analyticsCache) {
    // Use setTimeout to avoid React state update conflicts
    setTimeout(() => callback(analyticsCache), 0);
  } else {
    fetchAnalyticsData(filters).then(callback);
  }
  
  // Start update interval if not already running
  if (!updateInterval && activeSubscriptions > 0) {
    updateInterval = setInterval(async () => {
      if (activeSubscriptions === 0) return;
      
      try {
        if (analyticsCache) {
          const updatedData = generateAnalyticsUpdate(filters.timeRange, analyticsCache);
          analyticsCache = updatedData;
          
          // Notify all subscribers
          subscribers.forEach(subscriber => subscriber(updatedData));
        }
      } catch (error) {
        console.error("Error updating analytics data:", error);
      }
    }, 10000); // Update every 10 seconds for smoother real-time experience
  }
  
  // Add to subscribers list
  const subscriberFunction = (data: AnalyticsData) => callback(data);
  subscribers.push(subscriberFunction);
  
  // Return unsubscribe function
  return () => {
    activeSubscriptions = Math.max(0, activeSubscriptions - 1);
    subscribers = subscribers.filter(sub => sub !== subscriberFunction);
    
    // Clear interval if no more subscribers
    if (activeSubscriptions === 0 && updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  };
}

// Subscriber management
let subscribers: ((data: AnalyticsData) => void)[] = [];

// Function to export analytics data
export function exportAnalyticsData(data: AnalyticsData, format: 'csv' | 'json' = 'csv'): string {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }
  
  // CSV export for current data - include all relevant data
  const csvData: string[] = [];
  
  // Student engagement data
  csvData.push('# Student Engagement');
  csvData.push('date,active,previousActive');
  data.studentEngagement.forEach(item => {
    csvData.push(`${item.date},${item.active},${item.previousActive || ''}`);
  });
  
  // Add separator
  csvData.push('');
  
  // Content usage data
  csvData.push('# Content Usage');
  csvData.push('name,value,percentage');
  data.contentUsage.forEach(item => {
    csvData.push(`${item.name},${item.value},${item.percentage || ''}`);
  });
  
  // Add separator
  csvData.push('');
  
  // Assessment performance data
  csvData.push('# Assessment Performance');
  csvData.push('subject,score,previousScore,change');
  data.assessmentPerformance.forEach(item => {
    csvData.push(`${item.subject},${item.score},${item.previousScore || ''},${item.change || ''}`);
  });
  
  // Last updated timestamp
  csvData.push('');
  csvData.push(`# Last Updated: ${new Date(data.lastUpdated).toLocaleString()}`);
  
  return csvData.join('\n');
}

// Function to get analytics insights
export function getAnalyticsInsights(data: AnalyticsData): string[] {
  const insights: string[] = [];
  
  // Student engagement insights
  const engagement = data.studentEngagement;
  if (engagement.length > 1) {
    const lastDay = engagement[engagement.length - 1];
    const prevDay = engagement[engagement.length - 2];
    
    if (lastDay.active > prevDay.active) {
      insights.push(`Student engagement increased by ${lastDay.active - prevDay.active} students compared to previous day.`);
    } else if (lastDay.active < prevDay.active) {
      insights.push(`Student engagement decreased by ${prevDay.active - lastDay.active} students compared to previous day.`);
    } else {
      insights.push(`Student engagement remained stable at ${lastDay.active} students.`);
    }
  }
  
  // Assessment performance insights
  const highestSubject = data.assessmentPerformance.reduce(
    (prev, current) => (prev.score > current.score) ? prev : current
  );
  
  const lowestSubject = data.assessmentPerformance.reduce(
    (prev, current) => (prev.score < current.score) ? prev : current
  );
  
  insights.push(`${highestSubject.subject} has the highest assessment score at ${highestSubject.score}%.`);
  insights.push(`${lowestSubject.subject} has the lowest assessment score at ${lowestSubject.score}%.`);
  
  // Look for subjects with improvement
  const improvingSubjects = data.assessmentPerformance
    .filter(subject => subject.change && subject.change > 0)
    .sort((a, b) => (b.change || 0) - (a.change || 0));
    
  if (improvingSubjects.length > 0) {
    insights.push(`${improvingSubjects[0].subject} shows the most improvement with a ${improvingSubjects[0].change}% increase.`);
  }
  
  // Content usage insights
  const mostUsedContent = data.contentUsage.reduce(
    (prev, current) => (prev.value > current.value) ? prev : current
  );
  
  insights.push(`${mostUsedContent.name} is the most used content type at ${mostUsedContent.percentage}% of total usage.`);
  
  // Add insight about the distribution
  const subjectDistribution = data.contentDistribution.sort((a, b) => b.value - a.value);
  if (subjectDistribution.length >= 2) {
    insights.push(`${subjectDistribution[0].name} and ${subjectDistribution[1].name} make up over ${
      (subjectDistribution[0].percentage || 0) + (subjectDistribution[1].percentage || 0)
    }% of all content.`);
  }
  
  return insights;
} 