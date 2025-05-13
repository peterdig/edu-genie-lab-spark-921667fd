import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AnalyticsData, 
  AnalyticsFilters, 
  TimeRange 
} from '@/types/analytics';
import { 
  fetchAnalyticsData, 
  subscribeToAnalyticsUpdates, 
  exportAnalyticsData,
  getAnalyticsInsights
} from '@/lib/analytics-service';
import { useToast } from '@/hooks/use-toast';
import { debounce } from '@/lib/utils';

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeRange: '7d',
    date: new Date(),
  });
  const [insights, setInsights] = useState<string[]>([]);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState<boolean>(false);
  
  // References to prevent issues with stale closures and preserve values between renders
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const dataRef = useRef<AnalyticsData | null>(null);
  const notificationDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  
  const { toast } = useToast();

  // Update data reference - used to avoid synchronization issues
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Cleanup function to prevent setting state after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Debounced loading state - only show loading indicator after 300ms
  // This prevents flickering for fast responses
  const setLoadingDebounced = useCallback((isLoading: boolean) => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }

    if (isLoading) {
      // Delay showing loading state to prevent flickering
      loadingTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setLoading(true);
        }
      }, 300);
    } else {
      // When finishing loading, clear any pending timers and update state immediately
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch analytics data with optimized loading states
  const fetchData = useCallback(async (newFilters?: Partial<AnalyticsFilters>, showLoadingState = true) => {
    // Only show loading indicator for initial loads or major filter changes
    if (showLoadingState) {
      setLoadingDebounced(true);
    }
    
    // Clear any errors
    if (isMountedRef.current) {
      setError(null);
    }
    
    // Update filters
    const currentFilters = { ...filters, ...newFilters };
    if (isMountedRef.current) {
      setFilters(currentFilters);
    }
    
    try {
      // Fetch data from API
      const analyticsData = await fetchAnalyticsData(currentFilters);
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setData(analyticsData);
        
        // Generate insights
        const newInsights = getAnalyticsInsights(analyticsData);
        setInsights(newInsights);
      }
      
      // Update ref regardless of mounted state (for exportData function)
      dataRef.current = analyticsData;
      
      return analyticsData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch analytics data');
      
      if (isMountedRef.current) {
        setError(error);
        
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
      
      return null;
    } finally {
      if (showLoadingState) {
        setLoadingDebounced(false);
      }
    }
  }, [filters, toast, setLoadingDebounced]);

  // Debounced version of setTimeRange to prevent rapid refetching
  const debouncedSetTimeRange = useCallback(
    debounce((timeRange: TimeRange) => {
      fetchData({ timeRange }, true);
    }, 300),
    [fetchData]
  );

  // Update time range filter - this is a major change, so show loading state
  const setTimeRange = useCallback((timeRange: TimeRange) => {
    // Update filters immediately for UI consistency
    setFilters(prev => ({ ...prev, timeRange }));
    
    // Then debounce the actual data fetching
    debouncedSetTimeRange(timeRange);
  }, [debouncedSetTimeRange]);

  // Debounced version of setDate to prevent rapid refetching
  const debouncedSetDate = useCallback(
    debounce((date: Date) => {
      fetchData({ date }, false);
    }, 300),
    [fetchData]
  );

  // Update date filter - less disruptive, don't show loading state
  const setDate = useCallback((date: Date) => {
    // Update filters immediately for UI consistency
    setFilters(prev => ({ ...prev, date }));
    
    // Then debounce the actual data fetching
    debouncedSetDate(date);
  }, [debouncedSetDate]);

  // Toggle real-time updates - optimized to reduce flickering
  const toggleRealTime = useCallback(() => {
    setIsRealTimeEnabled(prev => !prev);
  }, []);

  // Export analytics data
  const exportData = useCallback((format: 'csv' | 'json' = 'csv') => {
    // Use dataRef to ensure we have the latest data
    const currentData = dataRef.current;
    if (!currentData) return null;
    
    try {
      const exportedData = exportAnalyticsData(currentData, format);
      
      // Create downloadable file
      const blob = new Blob([exportedData], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url); // Clean up to avoid memory leaks
      
      toast({
        title: 'Success',
        description: `Analytics data exported as ${format.toUpperCase()}`,
      });
      
      return exportedData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to export analytics data');
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Handle real-time data update
  const handleDataUpdate = useCallback((newData: AnalyticsData) => {
    // Update data without triggering loading state
    if (isMountedRef.current) {
      setData((prevData) => {
        // Only update if data has actually changed
        if (JSON.stringify(prevData) !== JSON.stringify(newData)) {
          // Update insights
          const newInsights = getAnalyticsInsights(newData);
          setInsights(newInsights);
          
          // Debounce notifications to prevent too many toasts
          if (notificationDebounceRef.current) {
            clearTimeout(notificationDebounceRef.current);
          }
          
          notificationDebounceRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              toast({
                title: 'Analytics Updated',
                description: 'Real-time analytics data has been refreshed',
              });
            }
            notificationDebounceRef.current = null;
          }, 5000); // Only show notification every 5 seconds at most
          
          return newData;
        }
        return prevData;
      });
    }
    
    // Update ref regardless of mounted state
    dataRef.current = newData;
  }, [toast]);

  // Set up or tear down real-time updates
  useEffect(() => {
    if (isRealTimeEnabled) {
      // Clean up any existing subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      // Set up new subscription
      const unsubscribe = subscribeToAnalyticsUpdates(handleDataUpdate, filters);
      unsubscribeRef.current = unsubscribe;
      
      // Notify user
      if (isMountedRef.current) {
        toast({
          title: 'Real-time Mode Enabled',
          description: 'Analytics data will update automatically',
        });
      }
    } else if (unsubscribeRef.current) {
      // Tear down subscription if real-time is disabled
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      
      if (notificationDebounceRef.current) {
        clearTimeout(notificationDebounceRef.current);
        notificationDebounceRef.current = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      if (notificationDebounceRef.current) {
        clearTimeout(notificationDebounceRef.current);
      }
      
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [isRealTimeEnabled, filters, handleDataUpdate, toast]);

  // Initial data fetch - only on mount
  useEffect(() => {
    fetchData();
    
    // Cleanup on unmount
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    filters,
    insights,
    isRealTimeEnabled,
    setTimeRange,
    setDate,
    fetchData,
    toggleRealTime,
    exportData,
  };
} 