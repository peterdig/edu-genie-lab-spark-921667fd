import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSupabaseData } from './useSupabaseHook';
import { Analytics } from '@/lib/supabase';
import { format, subDays, parseISO, isAfter, isBefore, isEqual } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { createRealtimeSubscription } from './use-analytics-utils';

// Rate limiter settings
const EVENT_THROTTLE_MS = 1000; // Minimum 1 second between same events
const MAX_EVENTS_PER_MINUTE = 60; // Maximum events per minute
const RETRY_INTERVAL = 30000; // 30 seconds between retry attempts for missing table

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
    'edgenie_analytics'
  );
  
  const [realtimeData, setRealtimeData] = useState<Analytics[]>([]);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: subDays(new Date(), 30),
    endDate: new Date()
  });
  
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [errorState, setErrorState] = useState<boolean>(false);
  
  // Rate limiting state
  const eventThrottleMap = useRef<Record<string, number>>({});
  const eventCountRef = useRef<number>(0);
  const lastMinuteResetRef = useRef<number>(Date.now());
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastErrorTime = useRef<number>(0);
  const errorCount = useRef<number>(0);

  // Subscribe to realtime analytics updates - with error handling
  useEffect(() => {
    // Skip subscription if we've seen multiple errors
    if (errorCount.current > 3) {
      console.log('Skipping realtime subscription due to previous errors');
      return () => {};
    }
    
    try {
      // Use our utility to create a safe subscription
      const { unsubscribe } = createRealtimeSubscription(
        'analytics-changes',
        'analytics',
        'INSERT',
        'public',
        (payload) => {
          // Add new analytics event to our realtime data
          const newData = payload.new as Analytics;
          if (newData) {
            setRealtimeData(prev => [...prev, newData]);
          }
        }
      );
      
      // Store unsubscribe function for cleanup
      unsubscribeRef.current = unsubscribe;

      // Cleanup subscription on unmount  
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (err) {
      console.error('Error setting up realtime subscription:', err);
      errorCount.current++;
      lastErrorTime.current = Date.now();
      setErrorState(true);
      return () => {}; // Empty cleanup
    }
  }, []);

  // Handle errors gracefully
  useEffect(() => {
    if (error) {
      // Increment error counter
      errorCount.current++;
      lastErrorTime.current = Date.now(); 
      
      // Set error state to trigger UI changes if needed
      setErrorState(true);
      
      // Log error (once, not repeatedly)
      if (errorCount.current === 1 || errorCount.current % 5 === 0) {
        console.warn(`Analytics error (${errorCount.current} occurrences):`, error);
      }
    }
  }, [error]);

  // Combine database data with realtime data
  const combinedData = useMemo(() => {
    // If there's a table error, return empty data to avoid flickering
    if (errorState && errorCount.current > 3) {
      return [];
    }
    
    // De-duplicate by ID
    const idMap = new Map<string, Analytics>();
    
    // Add all database records
    analyticsData.forEach(item => {
      idMap.set(item.id, item);
    });
    
    // Add all realtime records (overriding duplicates)
    realtimeData.forEach(item => {
      idMap.set(item.id, item);
    });
    
    return Array.from(idMap.values());
  }, [analyticsData, realtimeData, errorState]);

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
    return combinedData.filter(item => {
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
  }, [combinedData, filters]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    
    // If setting custom date range, update time range to custom
    if (newFilters.startDate || newFilters.endDate) {
      setTimeRange('custom');
    }
  }, []);

  // Rate-limited track analytics event
  const trackAnalyticsEvent = useCallback(async (
    contentId: string,
    contentType: string,
    action: string,
    metadata: Record<string, any> = {},
    userId?: string
  ) => {
    // Don't attempt to track if we've seen multiple table errors
    if (errorState && errorCount.current > 3) {
      console.log('Skipping analytics tracking due to server errors');
      return null;
    }
    
    // Create a unique key for this event type
    const eventKey = `${contentId}-${contentType}-${action}`;
    const now = Date.now();
    
    // Check for throttling of this specific event type
    if (eventThrottleMap.current[eventKey] && 
        (now - eventThrottleMap.current[eventKey]) < EVENT_THROTTLE_MS) {
      console.log(`Throttled event: ${eventKey}`);
      return null;
    }
    
    // Check for overall rate limiting
    if (now - lastMinuteResetRef.current > 60000) {
      // Reset counter if it's been more than a minute
      eventCountRef.current = 0;
      lastMinuteResetRef.current = now;
    }
    
    if (eventCountRef.current >= MAX_EVENTS_PER_MINUTE) {
      console.warn(`Rate limit exceeded: ${MAX_EVENTS_PER_MINUTE} events per minute`);
      return null;
    }
    
    // Update throttle map and counter
    eventThrottleMap.current[eventKey] = now;
    eventCountRef.current += 1;
    
    // Get current user ID or use provided one
    let currentUserId = userId || 'anonymous';
    
    try {
      // Try to get user from Supabase if available and no userId provided
      if (!userId && typeof supabase.auth.getUser === 'function') {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          currentUserId = data.user.id;
        }
      }
    } catch (err) {
      console.warn("Could not get current user, analytics will be anonymous");
    }
    
    try {
      // Track the event
      const result = await trackEvent({
        user_id: currentUserId,
      content_id: contentId,
      content_type: contentType,
      action,
        metadata: {
          ...metadata,
          timestamp: now,
          clientTime: new Date().toISOString()
        }
      });
      
      // Check for errors in the response
      if (result && 'error' in result && result.error) {
        // Update error count if we get a error
        errorCount.current++;
        lastErrorTime.current = Date.now();
        
        // Check for specific error code indicating missing table
        const errorCode = (result.error as any)?.code;
        if (errorCode === '42P01') { // Table doesn't exist
          setErrorState(true);
        }
      }
      
      return result;
    } catch (err) {
      console.error('Error tracking analytics event:', err);
      errorCount.current++;
      lastErrorTime.current = Date.now();
      return null;
    }
  }, [trackEvent, errorState]);

  // Get unique content types from data
  const getContentTypes = useMemo(() => {
    const types = new Set<string>();
    combinedData.forEach(item => types.add(item.content_type));
    return Array.from(types);
  }, [combinedData]);

  // Get unique actions from data
  const getActions = useMemo(() => {
    const actions = new Set<string>();
    combinedData.forEach(item => actions.add(item.action));
    return Array.from(actions);
  }, [combinedData]);

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
      .slice(0, 10); // Get top 10
  }, [filteredData]);

  return {
    analyticsData: filteredData,
    loading,
    error: error || errorState ? { message: "Analytics data unavailable" } : null,
    filters,
    updateFilters,
    trackEvent: trackAnalyticsEvent,
    timeRange,
    setTimeRange,
    getContentTypes,
    getActions,
    getDataByDate,
    getDataByContentType,
    getDataByAction,
    getMostActiveContent,
    isUsingFallback: isUsingFallback || errorState
  };
} 