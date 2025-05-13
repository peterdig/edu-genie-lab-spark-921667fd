import { useState, useEffect, useRef } from 'react';
import { supabase, useLocalStorageFallback, checkConnectivity } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Cache to minimize redundant fetch requests
const fetchCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache TTL

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
  
  // Use fallback if either base condition, external force, or internal force is true
  const useFallback = baseFallback || internalForceFallback || forceFallback;

  // Initialize localStorage with default data if needed
  useEffect(() => {
    if (useFallback) {
      const storedData = localStorage.getItem(localStorageKey);
      if (!storedData) {
        localStorage.setItem(localStorageKey, JSON.stringify(defaultData));
      }
    }
  }, [useFallback, localStorageKey, defaultData]);

  // Load data from Supabase or localStorage
  useEffect(() => {
    // Skip if already fetching to prevent duplicate requests
    if (fetchingRef.current) return;
    
    const fetchData = async () => {
      fetchingRef.current = true;
      
      try {
        if (useFallback) {
          // Use localStorage fallback
          const storedData = localStorage.getItem(localStorageKey);
          if (storedData) {
            setData(JSON.parse(storedData));
          } else {
            // Initialize with default data if nothing found
            setData(defaultData);
            localStorage.setItem(localStorageKey, JSON.stringify(defaultData));
          }
        } else {
          // Check cache first
          const cacheKey = `${tableName}`;
          const cachedData = fetchCache.get(cacheKey);
          
          if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
            // Use cached data if it exists and is fresh
            setData(cachedData.data);
            setLoading(false);
            fetchingRef.current = false;
            return;
          }
          
          // Check connectivity only if not using cache
          const isConnected = await checkConnectivity();
          if (!isConnected) {
            setInternalForceFallback(true);
            
            // Load from localStorage
            const storedData = localStorage.getItem(localStorageKey);
            if (storedData) {
              setData(JSON.parse(storedData));
            } else {
              setData(defaultData);
              localStorage.setItem(localStorageKey, JSON.stringify(defaultData));
            }
            return;
          }
          
          // Use Supabase
          try {
            const { data: supabaseData, error } = await supabase
              .from(tableName)
              .select('*');

            if (error) {
              if (error.code === '401' || error.code === 'PGRST301' || error.code === '500') {
                setInternalForceFallback(true);
              }
              
              throw error;
            }
            
            // If we got empty data but have defaults, use them
            if (!supabaseData || supabaseData.length === 0) {
              setData(defaultData);
              
              // Save defaults to localStorage as backup
              localStorage.setItem(localStorageKey, JSON.stringify(defaultData));
              
              // Update cache
              fetchCache.set(cacheKey, {
                data: defaultData,
                timestamp: Date.now()
              });
            } else {
              setData(supabaseData);
              
              // Save to localStorage as backup
              localStorage.setItem(localStorageKey, JSON.stringify(supabaseData));
              
              // Update cache
              fetchCache.set(cacheKey, {
                data: supabaseData,
                timestamp: Date.now()
              });
            }
          } catch (innerError) {
            setInternalForceFallback(true);
            throw innerError;
          }
        }
      } catch (err) {
        console.error(`Error fetching ${tableName}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
        
        // Fallback to localStorage on error
        const storedData = localStorage.getItem(localStorageKey);
        if (storedData) {
          setData(JSON.parse(storedData));
        } else {
          setData(defaultData);
          localStorage.setItem(localStorageKey, JSON.stringify(defaultData));
        }
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchData();
  }, [tableName, localStorageKey, useFallback, defaultData]);

  // Add new item
  const addItem = async (item: Omit<T, 'id' | 'created_at'>) => {
    try {
      const newItem = {
        ...item,
        id: uuidv4(),
        created_at: new Date().toISOString(),
      } as T;

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
          const { data: insertedData, error } = await supabase
            .from(tableName)
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
        } as T;
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
          const { data: updatedData, error } = await supabase
            .from(tableName)
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
          const { error } = await supabase
            .from(tableName)
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
          const { data: queryData, error } = await supabase
            .from(tableName)
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