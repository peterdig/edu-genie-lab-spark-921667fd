import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabaseData } from './useSupabaseData';
import { Analytics } from '@/lib/supabase';
import { format, subDays, parseISO, isAfter, isBefore, isEqual } from 'date-fns';

// Mock user for demo purposes
const CURRENT_USER_ID = 'current-user-id';

// Generate sample analytics data
const generateSampleData = (): Analytics[] => {
  const actions = ['view', 'edit', 'create', 'delete', 'share', 'download', 'print', 'comment'];
  const contentTypes = ['lesson', 'assessment', 'lab', 'rubric', 'template'];
  const result: Analytics[] = [];

  // Generate data for last 60 days
  for (let i = 0; i < 60; i++) {
    const date = subDays(new Date(), i);
    
    // More events for recent days, fewer for older days
    const numEvents = Math.max(1, Math.floor(Math.random() * (20 - i * 0.3)));
    
    for (let j = 0; j < numEvents; j++) {
      const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const contentId = `${contentType}-${Math.floor(Math.random() * 100) + 1}`;
      
      // Time spent for view actions (in seconds)
      let timeSpent = 0;
      if (action === 'view') {
        timeSpent = Math.floor(Math.random() * 600) + 30; // 30 seconds to 10 minutes
      }
      
      // Success rate for assessments (in percent)
      let successRate = 0;
      if (contentType === 'assessment' && action === 'view') {
        successRate = Math.floor(Math.random() * 101); // 0 to 100
      }
      
      result.push({
        id: `analytics-${result.length + 1}`,
        user_id: CURRENT_USER_ID,
        content_id: contentId,
        content_type: contentType,
        action: action,
        metadata: {
          timeSpent: timeSpent,
          successRate: successRate,
          browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
          device: ['Desktop', 'Mobile', 'Tablet'][Math.floor(Math.random() * 3)],
          os: ['Windows', 'MacOS', 'iOS', 'Android', 'Linux'][Math.floor(Math.random() * 5)]
        },
        created_at: date.toISOString()
      });
    }
  }
  
  return result;
};

const DEFAULT_ANALYTICS = generateSampleData();

export type AnalyticsFilters = {
  startDate?: Date;
  endDate?: Date;
  contentType?: string[];
  action?: string[];
  searchTerm?: string;
};

export type TimeRange = '7d' | '30d' | '90d' | 'all' | 'custom';

export function useAnalytics() {
  const {
    data: analyticsData,
    loading,
    error,
    addItem: trackEvent,
    isUsingFallback
  } = useSupabaseData<Analytics>(
    'analytics', 
    'edgenie_analytics', 
    DEFAULT_ANALYTICS
  );
  
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: subDays(new Date(), 30),
    endDate: new Date()
  });
  
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Apply date filter based on time range selection
  useEffect(() => {
    if (timeRange === 'custom') return; // Don't override custom date range
    
    const endDate = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '7d':
        startDate = subDays(endDate, 7);
        break;
      case '30d':
        startDate = subDays(endDate, 30);
        break;
      case '90d':
        startDate = subDays(endDate, 90);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate = subDays(endDate, 30);
    }
    
    setFilters(prev => ({
      ...prev,
      startDate,
      endDate
    }));
  }, [timeRange]);

  // Filter analytics data based on current filters
  const filteredData = useMemo(() => {
    return analyticsData.filter(item => {
      const itemDate = parseISO(item.created_at);
      
      // Date filter
      if (filters.startDate && isBefore(itemDate, filters.startDate) && !isEqual(itemDate, filters.startDate)) {
        return false;
      }
      
      if (filters.endDate && isAfter(itemDate, filters.endDate) && !isEqual(itemDate, filters.endDate)) {
        return false;
      }
      
      // Content type filter
      if (filters.contentType && filters.contentType.length > 0) {
        if (!filters.contentType.includes(item.content_type)) {
          return false;
        }
      }
      
      // Action filter
      if (filters.action && filters.action.length > 0) {
        if (!filters.action.includes(item.action)) {
          return false;
        }
      }
      
      // Search term (searches in content_id)
      if (filters.searchTerm && filters.searchTerm.trim()) {
        const searchLower = filters.searchTerm.toLowerCase();
        return item.content_id.toLowerCase().includes(searchLower);
      }
      
      return true;
    });
  }, [analyticsData, filters]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    
    // If setting custom date range, update time range to custom
    if (newFilters.startDate || newFilters.endDate) {
      setTimeRange('custom');
    }
  }, []);

  // Track a new analytics event
  const trackAnalyticsEvent = useCallback(async (
    contentId: string,
    contentType: string,
    action: string,
    metadata: Record<string, any> = {}
  ) => {
    return await trackEvent({
      user_id: CURRENT_USER_ID,
      content_id: contentId,
      content_type: contentType,
      action,
      metadata
    });
  }, [trackEvent]);

  // Get unique content types from data
  const getContentTypes = useMemo(() => {
    const types = new Set<string>();
    analyticsData.forEach(item => types.add(item.content_type));
    return Array.from(types);
  }, [analyticsData]);

  // Get unique actions from data
  const getActions = useMemo(() => {
    const actions = new Set<string>();
    analyticsData.forEach(item => actions.add(item.action));
    return Array.from(actions);
  }, [analyticsData]);

  // Get data grouped by date for charts
  const getDataByDate = useMemo(() => {
    const groupedData: Record<string, number> = {};
    
    filteredData.forEach(item => {
      const date = format(parseISO(item.created_at), 'yyyy-MM-dd');
      groupedData[date] = (groupedData[date] || 0) + 1;
    });
    
    // Convert to array for charts
    return Object.entries(groupedData).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData]);

  // Get data grouped by content type for charts
  const getDataByContentType = useMemo(() => {
    const groupedData: Record<string, number> = {};
    
    filteredData.forEach(item => {
      groupedData[item.content_type] = (groupedData[item.content_type] || 0) + 1;
    });
    
    // Convert to array for charts
    return Object.entries(groupedData).map(([type, count]) => ({
      name: type,
      value: count
    }));
  }, [filteredData]);

  // Get data grouped by action for charts
  const getDataByAction = useMemo(() => {
    const groupedData: Record<string, number> = {};
    
    filteredData.forEach(item => {
      groupedData[item.action] = (groupedData[item.action] || 0) + 1;
    });
    
    // Convert to array for charts
    return Object.entries(groupedData).map(([action, count]) => ({
      name: action,
      value: count
    }));
  }, [filteredData]);

  // Get most active content items
  const getMostActiveContent = useMemo(() => {
    const groupedData: Record<string, number> = {};
    
    filteredData.forEach(item => {
      groupedData[item.content_id] = (groupedData[item.content_id] || 0) + 1;
    });
    
    // Convert to array and sort by count
    return Object.entries(groupedData)
      .map(([contentId, count]) => ({
        contentId,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
  }, [filteredData]);

  // Get device distribution
  const getDeviceDistribution = useMemo(() => {
    const groupedData: Record<string, number> = {};
    
    filteredData.forEach(item => {
      if (item.metadata && item.metadata.device) {
        groupedData[item.metadata.device] = (groupedData[item.metadata.device] || 0) + 1;
      }
    });
    
    return Object.entries(groupedData).map(([device, count]) => ({
      name: device,
      value: count
    }));
  }, [filteredData]);

  // Get total engagement time (for view actions)
  const getTotalEngagementTime = useMemo(() => {
    return filteredData.reduce((total, item) => {
      if (item.action === 'view' && item.metadata && item.metadata.timeSpent) {
        return total + item.metadata.timeSpent;
      }
      return total;
    }, 0);
  }, [filteredData]);

  // Get average success rate (for assessments)
  const getAverageSuccessRate = useMemo(() => {
    let totalRate = 0;
    let count = 0;
    
    filteredData.forEach(item => {
      if (
        item.content_type === 'assessment' && 
        item.metadata && 
        typeof item.metadata.successRate === 'number'
      ) {
        totalRate += item.metadata.successRate;
        count++;
      }
    });
    
    return count > 0 ? Math.round(totalRate / count) : 0;
  }, [filteredData]);

  return {
    data: analyticsData,
    filteredData,
    loading,
    error,
    filters,
    timeRange,
    setTimeRange,
    updateFilters,
    trackAnalyticsEvent,
    contentTypes: getContentTypes,
    actions: getActions,
    dataByDate: getDataByDate,
    dataByContentType: getDataByContentType,
    dataByAction: getDataByAction,
    mostActiveContent: getMostActiveContent,
    deviceDistribution: getDeviceDistribution,
    totalEngagementTime: getTotalEngagementTime,
    averageSuccessRate: getAverageSuccessRate,
    isUsingFallback
  };
} 