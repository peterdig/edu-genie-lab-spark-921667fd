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
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const dataRef = useRef<AnalyticsData | null>(null);
  const notificationDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Update data reference - used to avoid synchronization issues
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Fetch analytics data with optimized loading states
  const fetchData = useCallback(async (newFilters?: Partial<AnalyticsFilters>, showLoadingState = true) => {
    // Only show loading indicator for initial loads or major filter changes
    if (showLoadingState) {
      setLoading(true);
    }
    
    setError(null);
    
    const currentFilters = { ...filters, ...newFilters };
    setFilters(currentFilters);
    
    try {
      const analyticsData = await fetchAnalyticsData(currentFilters);
      setData(analyticsData);
      dataRef.current = analyticsData;
      
      // Generate insights
      const newInsights = getAnalyticsInsights(analyticsData);
      setInsights(newInsights);
      
      return analyticsData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch analytics data');
      setError(error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  }, [filters, toast]);

  // Update time range filter - this is a major change, so show loading state
  const setTimeRange = useCallback((timeRange: TimeRange) => {
    fetchData({ timeRange }, true);
  }, [fetchData]);

  // Update date filter - less disruptive, don't show loading state
  const setDate = useCallback((date: Date) => {
    fetchData({ date }, false);
  }, [fetchData]);

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
    setData(newData);
    dataRef.current = newData;
    
    // Update insights
    const newInsights = getAnalyticsInsights(newData);
    setInsights(newInsights);
    
    // Debounce notifications to prevent too many toasts
    if (notificationDebounceRef.current) {
      clearTimeout(notificationDebounceRef.current);
    }
    
    notificationDebounceRef.current = setTimeout(() => {
      toast({
        title: 'Analytics Updated',
        description: 'Real-time analytics data has been refreshed',
      });
      notificationDebounceRef.current = null;
    }, 5000); // Only show notification every 5 seconds at most
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
      toast({
        title: 'Real-time Mode Enabled',
        description: 'Analytics data will update automatically',
      });
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
    };
  }, [isRealTimeEnabled, filters, handleDataUpdate, toast]);

  // Initial data fetch - only on mount
  useEffect(() => {
    fetchData();
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