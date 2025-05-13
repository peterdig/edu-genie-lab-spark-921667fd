import { memo, useRef, useEffect, useCallback } from 'react';
import { Textarea } from "@/components/ui/textarea";

interface DocumentEditorProps {
  content: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

// Optimized document editor with memoization to prevent unnecessary re-renders
function DocumentEditor({ content, onChange }: DocumentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastContentRef = useRef<string>(content);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function to clear any pending debounced calls
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Only update the textarea value when content actually changes
  useEffect(() => {
    if (textareaRef.current && content !== lastContentRef.current) {
      // Store for comparison
      lastContentRef.current = content;
      
      // Check if the textarea doesn't have focus before updating to prevent
      // cursor jumping during editing
      if (document.activeElement !== textareaRef.current) {
        textareaRef.current.value = content;
      }
    }
  }, [content]);

  // Debounced onChange handler to prevent excessive state updates
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Store the value (React synthetic events may be nullified)
    const value = e.target.value;
    
    // Create a new debounced call
    timeoutRef.current = setTimeout(() => {
      // Create a synthetic event with the stored value
      const syntheticEvent = {
        target: { value },
        currentTarget: { value }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      
      onChange(syntheticEvent);
    }, 300); // 300ms debounce time
  }, [onChange]);

  return (
    <Textarea
      ref={textareaRef}
      className="w-full h-full rounded-none border-0 resize-none p-4 font-mono text-sm"
      defaultValue={content}
      onChange={handleChange}
      placeholder="Start typing your document content..."
    />
  );
}

// Wrap in memo to prevent unnecessary re-renders
export default memo(DocumentEditor); 