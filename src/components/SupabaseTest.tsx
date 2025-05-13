import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

type TestItem = {
  id: string;
  content: string;
  created_at: string;
};

export default function SupabaseTest() {
  const [items, setItems] = useState<TestItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('test_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log('Fetched data:', data);
      setItems(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }

  async function addItem() {
    if (!newItem.trim()) return;
    
    try {
      setLoading(true);
      const item = {
        content: newItem,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('test_items')
        .insert([item])
        .select();
      
      if (error) throw error;
      
      console.log('Added item:', data);
      setItems(prev => [data[0], ...prev]);
      setNewItem('');
      setSuccess('Item added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error adding item:', err);
      setError(err instanceof Error ? err.message : 'Failed to add item');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(id: string) {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('test_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setItems(prev => prev.filter(item => item.id !== id));
      setSuccess('Item deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto my-8">
      <CardHeader>
        <CardTitle>Supabase Storage Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Enter a test item"
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <Button 
            onClick={addItem} 
            disabled={loading || !newItem.trim()}
          >
            Add Item
          </Button>
        </div>
        
        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-100 text-green-800 rounded-md">
            {success}
          </div>
        )}
        
        <div className="mt-4">
          <h3 className="font-medium mb-2">Stored Items:</h3>
          {loading ? (
            <p>Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-gray-500">No items found. Add your first item!</p>
          ) : (
            <ul className="space-y-2">
              {items.map(item => (
                <li key={item.id} className="flex justify-between items-center p-2 border-b">
                  <span>{item.content}</span>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => deleteItem(item.id)}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-sm text-gray-500">
        {loading ? 'Processing...' : 'Last updated: ' + new Date().toLocaleTimeString()}
      </CardFooter>
    </Card>
  );
} 