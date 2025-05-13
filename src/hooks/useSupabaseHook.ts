import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, useLocalStorageFallback, checkConnectivity } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/lib/AuthContext.jsx';
import { useIsOnline } from '@/contexts/OnlineContext';
import { debounce } from 'lodash';

// Cache to minimize redundant fetch requests
const fetchCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache TTL

// Store tables with errors to avoid repeated attempts
const ERROR_TABLES = new Set<string>();

// Global connection state
let isConnected = true;
let lastConnectivityCheck = 0;
const CONNECTIVITY_CHECK_INTERVAL = 30000; // 30 seconds

// Generic hook for CRUD operations with Supabase with localStorage fallback
export function useSupabaseData<T extends { id: string }>(
  tableName: string,
  localStorageKey: string,
  defaultData: T[] = [],
  forceFallback = false
) {
  const [data, setData] = useState<T[]>(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [internalForceFallback, setInternalForceFallback] = useState(forceFallback);
  const baseFallback = useLocalStorageFallback();
  const fetchingRef = useRef(false);
  const isMountedRef = useRef(true);
  const { isAuthenticated, session } = useAuth();
  const isOnline = useIsOnline();
  const dataRef = useRef<T[]>(defaultData);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Use fallback if either base condition, external force, or internal force is true
  const useFallback = baseFallback || internalForceFallback || forceFallback || !isOnline || ERROR_TABLES.has(tableName);

  // Initialize localStorage with default data if needed
  useEffect(() => {
    if (useFallback) {
      const storedData = localStorage.getItem(localStorageKey);
      if (!storedData) {
        localStorage.setItem(localStorageKey, JSON.stringify(defaultData));
      }
    }
  }, [useFallback, localStorageKey, defaultData]);

  // More efficient connectivity check
  const checkConnectivityOptimized = useCallback(async () => {
    const now = Date.now();
    
    // Don't check connectivity too frequently
    if (now - lastConnectivityCheck < CONNECTIVITY_CHECK_INTERVAL) {
      return isConnected;
    }
    
    lastConnectivityCheck = now;
    try {
      const result = await checkConnectivity();
      isConnected = result;
      return result;
    } catch (err) {
      isConnected = false;
      return false;
    }
  }, []);

  // Create a debounced setter for local storage
  const debouncedUpdateLocalStorage = useCallback(
    debounce((items: T[]) => {
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(items));
      } catch (e) {
        console.error(`Error saving to localStorage: ${e}`);
      }
    }, 1000),
    [localStorageKey]
  );

  // Load data on mount
  useEffect(() => {
    // Define fetchData here as a local function that uses the closure variables
    const fetchData = async () => {
      if (!isAuthenticated || !session) {
        setLoading(false);
        return;
      }

      // Use localStorage fallback if offline or if forced
      const localUseFallback = forceFallback || internalForceFallback || !isOnline || ERROR_TABLES.has(tableName);
      
      if (localUseFallback) {
        try {
          const storedData = localStorage.getItem(localStorageKey);
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            setData(parsedData);
            dataRef.current = parsedData;
          }
        } catch (e) {
          console.error(`Error loading from localStorage: ${e}`);
        }
        setLoading(false);
        return;
      }

      // Check cache first
      const cacheKey = `${tableName}-${session?.user?.id || 'anonymous'}`;
      const cachedData = fetchCache.get(cacheKey);
      
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
        setData(cachedData.data);
        dataRef.current = cachedData.data;
        setLoading(false);
        return;
      }

      // Fetch from Supabase
      try {
        const { data: fetchedData, error: fetchError } = await supabase
          .from(tableName)
          .select('*');

        // Handle database errors
        if (fetchError) {
          console.error(`Error fetching from ${tableName}:`, fetchError);
          
          // If we get a policy error (infinite recursion), mark the table for fallback
          if (fetchError.code === '42P17') {
            console.warn(`Policy recursion detected for ${tableName}, switching to fallback`);
            ERROR_TABLES.add(tableName);
            setInternalForceFallback(true);
          }
          
          // If the table doesn't exist, mark it for fallback
          if (fetchError.code === '42P01') {
            console.warn(`Table ${tableName} doesn't exist, switching to fallback`);
            ERROR_TABLES.add(tableName);
            setInternalForceFallback(true);
          }
          
          setError(new Error(fetchError.message));
          
          // Fall back to localStorage if available
          try {
            const storedData = localStorage.getItem(localStorageKey);
            if (storedData) {
              const parsedData = JSON.parse(storedData);
              setData(parsedData);
              dataRef.current = parsedData;
            }
          } catch (e) {
            console.error(`Error loading from localStorage: ${e}`);
          }
          
          setLoading(false);
          return;
        }

        // Update state and cache with fetched data
        setData(fetchedData as T[]);
        dataRef.current = fetchedData as T[];
        setError(null);
        
        // Store in cache
        fetchCache.set(cacheKey, {
          data: fetchedData,
          timestamp: Date.now()
        });
        
        // Update localStorage as backup
        debouncedUpdateLocalStorage(fetchedData as T[]);
      } catch (error) {
        console.error(`Unexpected error fetching from ${tableName}:`, error);
        setError(error instanceof Error ? error : new Error('Unknown error'));
        
        // Try to use localStorage
        try {
          const storedData = localStorage.getItem(localStorageKey);
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            setData(parsedData);
            dataRef.current = parsedData;
          }
        } catch (e) {
          console.error(`Error loading from localStorage: ${e}`);
        }
      } finally {
        setLoading(false);
      }
    };

    // Call the function
    fetchData();
  }, [isAuthenticated, session, localStorageKey, tableName, forceFallback, internalForceFallback, isOnline, debouncedUpdateLocalStorage]);

  // Add new item
  const addItem = async (item: Omit<T, 'id' | 'created_at'>) => {
    try {
      const newItem = {
        ...item,
        id: uuidv4(),
        created_at: new Date().toISOString(),
      } as unknown as T;

      if (useFallback) {
        // Use localStorage
        const updatedData = [...data, newItem];
        setData(updatedData);
        
        // Ensure localStorage is updated
        localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
        
        return newItem;
      } else {
        // Use Supabase
        try {
          // Use type assertion to bypass TypeScript errors
          const { data: insertedData, error } = await (supabase
            .from(tableName) as any)
            .insert(newItem)
            .select();

          if (error) {
            if (error.code === '401' || error.code === 'PGRST301') {
              setInternalForceFallback(true);
            }
            
            // Fall back to localStorage for this operation
            const updatedData = [...data, newItem];
            setData(updatedData);
            localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
            
            // Update cache
            const cacheKey = `${tableName}`;
            fetchCache.set(cacheKey, {
              data: updatedData,
              timestamp: Date.now()
            });
            
            return newItem;
          }
          
          if (insertedData && insertedData.length > 0) {
            const updatedData = [...data, insertedData[0] as T];
            setData(updatedData);
            
            // Update cache
            const cacheKey = `${tableName}`;
            fetchCache.set(cacheKey, {
              data: updatedData,
              timestamp: Date.now()
            });
            
            return insertedData[0] as T;
          } else {
            // If no data was returned but no error either, use the original new item
            const updatedData = [...data, newItem];
            setData(updatedData);
            
            // Update cache
            const cacheKey = `${tableName}`;
            fetchCache.set(cacheKey, {
              data: updatedData,
              timestamp: Date.now()
            });
            
            return newItem;
          }
        } catch (innerError) {
          setInternalForceFallback(true);
          throw innerError;
        }
      }
    } catch (err) {
      console.error(`Error adding item to ${tableName}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // In case of error, try localStorage as last resort
      try {
        const newItem = {
          ...item,
          id: uuidv4(),
          created_at: new Date().toISOString(),
        } as unknown as T;
        const updatedData = [...data, newItem];
        setData(updatedData);
        localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
        return newItem;
      } catch (fallbackErr) {
        console.error(`Even fallback failed for ${tableName}:`, fallbackErr);
        throw err; // Throw the original error
      }
    }
  };

  // Helper function to directly save to localStorage
  const forceLocalStorageSave = () => {
    if (data.length > 0) {
      console.log(`Force-saving ${tableName} data to localStorage:`, data);
      localStorage.setItem(localStorageKey, JSON.stringify(data));
      
      // Verify localStorage update
      const verifyData = localStorage.getItem(localStorageKey);
      const parsedData = verifyData ? JSON.parse(verifyData) : [];
      console.log(`Verified force-save to localStorage for ${tableName}:`, parsedData);
      return true;
    }
    return false;
  };

  // Update existing item
  const updateItem = async (id: string, updates: Partial<T>) => {
    try {
      if (useFallback) {
        // Use localStorage
        const updatedData = data.map(item => 
          item.id === id 
            ? { ...item, ...updates, updated_at: new Date().toISOString() } 
            : item
        );
        setData(updatedData);
        localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
        return updatedData.find(item => item.id === id);
      } else {
        // Use Supabase
        try {
          // Use type assertion to bypass TypeScript errors
          const { data: updatedData, error } = await (supabase
            .from(tableName) as any)
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select();

          if (error) {
            console.error(`Error updating ${tableName}:`, error);
            setInternalForceFallback(true);
            
            // Fall back to localStorage for this operation
            const updatedLocalData = data.map(item => 
              item.id === id 
                ? { ...item, ...updates, updated_at: new Date().toISOString() } 
                : item
            );
            setData(updatedLocalData);
            localStorage.setItem(localStorageKey, JSON.stringify(updatedLocalData));
            return updatedLocalData.find(item => item.id === id);
          }
          
          if (updatedData && updatedData.length > 0) {
            setData(prev => prev.map(item => 
              item.id === id ? { ...item, ...updatedData[0] } as T : item
            ));
            return updatedData[0] as T;
          } else {
            // If no data was returned but no error either
            const updatedLocalData = data.map(item => 
              item.id === id 
                ? { ...item, ...updates, updated_at: new Date().toISOString() } 
                : item
            );
            setData(updatedLocalData);
            return updatedLocalData.find(item => item.id === id);
          }
        } catch (innerError) {
          console.error(`Error during Supabase update for ${tableName}:`, innerError);
          setInternalForceFallback(true);
          throw innerError;
        }
      }
    } catch (err) {
      console.error(`Error updating item in ${tableName}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Last resort fallback
      try {
        const updatedData = data.map(item => 
          item.id === id 
            ? { ...item, ...updates, updated_at: new Date().toISOString() } 
            : item
        );
        setData(updatedData);
        localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
        console.log(`Fallback: Successfully updated item in localStorage for ${tableName}`);
        return updatedData.find(item => item.id === id);
      } catch (fallbackErr) {
        console.error(`Even fallback failed for ${tableName}:`, fallbackErr);
        throw err; // Throw the original error
      }
    }
  };

  // Delete item
  const deleteItem = async (id: string) => {
    try {
      if (useFallback) {
        // Use localStorage
        const updatedData = data.filter(item => item.id !== id);
        setData(updatedData);
        localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
      } else {
        // Use Supabase
        try {
          // Use type assertion to bypass TypeScript errors
          const { error } = await (supabase
            .from(tableName) as any)
            .delete()
            .eq('id', id);

          if (error) {
            console.error(`Error deleting from ${tableName}:`, error);
            setInternalForceFallback(true);
            
            // Fall back to localStorage for this operation
            const updatedData = data.filter(item => item.id !== id);
            setData(updatedData);
            localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
            return;
          }
          
          setData(prev => prev.filter(item => item.id !== id));
        } catch (innerError) {
          console.error(`Error during Supabase delete for ${tableName}:`, innerError);
          setInternalForceFallback(true);
          throw innerError;
        }
      }
    } catch (err) {
      console.error(`Error deleting item from ${tableName}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Last resort fallback
      try {
        const updatedData = data.filter(item => item.id !== id);
        setData(updatedData);
        localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
        console.log(`Fallback: Successfully deleted item from localStorage for ${tableName}`);
      } catch (fallbackErr) {
        console.error(`Even fallback failed for ${tableName}:`, fallbackErr);
        throw err; // Throw the original error
      }
    }
  };

  // Query documents by field - used for relations
  const queryByField = async (field: keyof T, value: any) => {
    try {
      // Add a safety check for empty or undefined values
      if (value === undefined || value === null) {
        console.warn(`queryByField called with empty/undefined value for ${String(field)}`);
        return [];
      }
      
      if (useFallback) {
        // Use localStorage
        console.log(`Using localStorage to query ${tableName} by ${String(field)}=${value}`);
        const filteredData = data.filter(item => item[field] === value);
        return filteredData;
      } else {
        // Use Supabase
        try {
          // Use type assertion to bypass TypeScript errors
          const { data: queryData, error } = await (supabase
            .from(tableName) as any)
            .select('*')
            .eq(field as string, value);

          if (error) throw error;
            
          return queryData as T[];
        } catch (innerError) {
          console.error(`Error querying ${tableName} by field in Supabase:`, innerError);
          setInternalForceFallback(true);
          
          // Fallback to localStorage
          const filteredData = data.filter(item => item[field] === value);
          return filteredData;
        }
      }
    } catch (err) {
      console.error(`Error querying ${tableName} by field:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Try to use data from state as last resort
      return data.filter(item => item[field] === value);
    }
  };

  return { 
    data, 
    loading, 
    error, 
    addItem, 
    updateItem, 
    deleteItem, 
    queryByField,
    isUsingFallback: useFallback,
    forceLocalStorageSave
  };
} 