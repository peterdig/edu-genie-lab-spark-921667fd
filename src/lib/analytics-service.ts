import {
  AnalyticsData,
  TimeRange,
  AnalyticsFilters,
  StudentEngagementData,
  ContentUsageData,
  AssessmentPerformanceData,
  ContentDistributionData
} from "@/types/analytics";
import { format, subDays, subMonths, parseISO } from "date-fns";
import { supabase } from "./supabase";

// Cache mechanism to prevent excessive fetches
let cachedAnalyticsData: AnalyticsData | null = null;
let lastFetchTime = 0;
let fetchErrors = 0;
const CACHE_EXPIRY_MS = 60000; // 1 minute cache
const MAX_CONSECUTIVE_ERRORS = 5; // After this many errors, fallback completely
const ERROR_COOLDOWN_MS = 10000; // Wait at least this long after errors

// Maintain lightweight subscription management
let activeSubscriptions = 0;
let subscribers: ((data: AnalyticsData) => void)[] = [];

// Function to generate mock data structure (not actual mock data, just the structure)
function createEmptyAnalyticsData(): AnalyticsData {
  return {
    studentEngagement: [],
    contentUsage: [],
    assessmentPerformance: [],
    contentDistribution: [],
  metrics: {
    totalStudents: {
      title: "Total Students",
        value: 0,
        changePercentage: 0,
      icon: "Users",
      timeframe: "from last month"
    },
    avgEngagementTime: {
      title: "Avg. Engagement Time",
        value: "0 min",
        changePercentage: 0,
      icon: "Clock",
      timeframe: "from last week"
    },
    contentCreated: {
      title: "Content Created",
        value: 0,
        changePercentage: 0,
      icon: "BookOpen",
      timeframe: "from last month"
    },
    avgAssessmentScore: {
      title: "Avg. Assessment Score",
        value: "0%",
        changePercentage: 0,
      icon: "GraduationCap",
      timeframe: "from last week"
    }
  },
  lastUpdated: new Date().toISOString()
};
}

// Function to fetch real analytics data from Supabase with error handling and caching
export async function fetchAnalyticsData(filters: AnalyticsFilters): Promise<AnalyticsData> {
  const now = Date.now();
  
  // If we have cached data that's still fresh, return it
  if (cachedAnalyticsData && now - lastFetchTime < CACHE_EXPIRY_MS) {
    return cachedAnalyticsData;
  }
  
  // If we've had too many errors, wait for cooldown period
  if (fetchErrors >= MAX_CONSECUTIVE_ERRORS && now - lastFetchTime < ERROR_COOLDOWN_MS) {
    console.log(`Too many fetch errors (${fetchErrors}), using cached data during cooldown`);
    return cachedAnalyticsData || createEmptyAnalyticsData();
  }
  
  try {
    // Create an empty data structure
    const emptyData = createEmptyAnalyticsData();

    // Fetch real analytics data from Supabase - use a simpler query that doesn't involve auth.users
    const { data: analyticsData, error } = await supabase
      .from('analytics')
      .select('*');

    if (error) {
      console.error("Error fetching analytics data:", error);
      fetchErrors++;
      lastFetchTime = now;
      
      // If we have cached data, return it instead of error
      if (cachedAnalyticsData) {
        return cachedAnalyticsData;
      }
      
      return emptyData;
    }

    // Reset error counter on success
    fetchErrors = 0;
    
    // Process analytics data to fill the required structure
    if (analyticsData && analyticsData.length > 0) {
      // Process data for insights
      // This is a simplified example - in a real app, you'd process the data more thoroughly
      
      // Group by date for student engagement
      const dateGroups = new Map();
      analyticsData.forEach(item => {
        const date = item.created_at.split('T')[0]; // YYYY-MM-DD
        dateGroups.set(date, (dateGroups.get(date) || 0) + 1);
      });
      
      const studentEngagement = Array.from(dateGroups)
        .map(([date, active]) => ({ date, active }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      // Group by content type
      const contentTypeGroups = new Map();
      analyticsData.forEach(item => {
        contentTypeGroups.set(
          item.content_type, 
          (contentTypeGroups.get(item.content_type) || 0) + 1
        );
      });
      
      const contentUsage = Array.from(contentTypeGroups)
        .map(([name, value]) => ({ name, value }));
      
      // Calculate percentages
      const totalUsage = contentUsage.reduce((sum, item) => sum + Number(item.value), 0);
      const contentUsageWithPercentage = contentUsage.map(item => ({
    ...item,
        percentage: totalUsage ? Math.round((Number(item.value) / totalUsage) * 100) : 0
      }));
      
      // Simple metrics - count unique user_ids without referencing auth table
      const uniqueUserIds = new Set(analyticsData.map(item => item.user_id)).size;
      
      const metrics = {
    totalStudents: {
          title: "Total Students",
          value: uniqueUserIds,
          changePercentage: 0,
          icon: "Users",
          timeframe: "current users"
    },
    avgEngagementTime: {
          title: "Avg. Engagement Time",
          value: "0 min", // Would need specific timing data
          changePercentage: 0,
          icon: "Clock",
          timeframe: "current session"
    },
    contentCreated: {
          title: "Content Created",
          value: analyticsData.filter(item => item.action === 'create').length,
          changePercentage: 0,
          icon: "BookOpen",
          timeframe: "total"
    },
    avgAssessmentScore: {
          title: "Avg. Assessment Score",
          value: "N/A", // Would need specific score data
          changePercentage: 0,
          icon: "GraduationCap",
          timeframe: "unavailable"
        }
      };
      
      const result = {
        studentEngagement,
        contentUsage: contentUsageWithPercentage,
        contentDistribution: contentUsageWithPercentage, // Reuse for simplicity
        assessmentPerformance: [], // Would need specific data
        metrics,
        lastUpdated: new Date().toISOString()
      };
      
      // Cache the result
      cachedAnalyticsData = result;
      lastFetchTime = now;
      
      return result;
    }
    
    // If no data, return empty data structure but still update cache time
    cachedAnalyticsData = emptyData;
    lastFetchTime = now;
    return emptyData;
  } catch (error) {
    console.error("Error in fetchAnalyticsData:", error);
    fetchErrors++;
    lastFetchTime = now;
    
    // If we have cached data, return it instead of error
    if (cachedAnalyticsData) {
      return cachedAnalyticsData;
    }
    
    return createEmptyAnalyticsData();
  }
}

// Function to handle real-time updates with error handling
export function subscribeToAnalyticsUpdates(
  callback: (data: AnalyticsData) => void,
  filters: AnalyticsFilters
): () => void {
  try {
  activeSubscriptions++;
  
    // Use cached data if available for immediate response
    if (cachedAnalyticsData) {
      setTimeout(() => callback(cachedAnalyticsData!), 0);
  } else {
      // Initial data fetch (wrapped in try/catch to prevent unhandled rejections)
      fetchAnalyticsData(filters)
        .then(callback)
        .catch(err => {
          console.error("Error in initial analytics fetch:", err);
          callback(createEmptyAnalyticsData());
        });
  }
  
  // Add to subscribers list
  const subscriberFunction = (data: AnalyticsData) => callback(data);
  subscribers.push(subscriberFunction);
  
  // Return unsubscribe function
  return () => {
    activeSubscriptions = Math.max(0, activeSubscriptions - 1);
    subscribers = subscribers.filter(sub => sub !== subscriberFunction);
    };
  } catch (err) {
    console.error("Error setting up analytics subscription:", err);
    return () => {}; // Empty cleanup function
  }
}

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
  
  // Content usage insights
  if (data.contentUsage.length > 0) {
  const mostUsedContent = data.contentUsage.reduce(
      (prev, current) => {
        const prevValue = typeof prev.value === 'string' ? parseInt(prev.value, 10) : prev.value;
        const currValue = typeof current.value === 'string' ? parseInt(current.value, 10) : current.value;
        return (prevValue > currValue) ? prev : current;
      }
  );
  
  insights.push(`${mostUsedContent.name} is the most used content type at ${mostUsedContent.percentage}% of total usage.`);
  } else {
    insights.push("No content usage data available yet.");
  }
  
  // Add basic user metrics
  insights.push(`There are currently ${data.metrics.totalStudents.value} users on the platform.`);
  
  // Check if content created is greater than zero
  const contentCreatedValue = Number(data.metrics.contentCreated.value);
  if (contentCreatedValue > 0) {
    insights.push(`${data.metrics.contentCreated.value} content items have been created so far.`);
  }
  
  return insights;
} 