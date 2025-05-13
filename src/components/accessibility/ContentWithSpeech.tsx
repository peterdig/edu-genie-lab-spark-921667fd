import React from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { TextToSpeech } from './TextToSpeech';

interface ContentWithSpeechProps {
  children: React.ReactNode;
  text?: string;
  className?: string;
}

/**
 * A wrapper component that adds text-to-speech functionality to any content
 * It can either use the provided text or extract text from children (if they are string)
 */
export function ContentWithSpeech({ 
  children, 
  text,
  className = '' 
}: ContentWithSpeechProps) {
  const { settings } = useAccessibility();
  
  // If text-to-speech is disabled in settings, just render children
  if (!settings.textToSpeechEnabled) {
    return <div className={className}>{children}</div>;
  }
  
  // Determine what text to read
  const contentText = text || 
    (typeof children === 'string' ? children : '');
    
  if (!contentText) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <div className={`relative ${className}`}>
      <div>{children}</div>
      <div className="absolute top-2 right-2">
        <TextToSpeech text={contentText} compact />
      </div>
    </div>
  );
}

interface TextContentWithSpeechProps {
  heading?: string;
  content: string;
  className?: string;
}

/**
 * A component specifically for text content with a heading and content
 * Formats the content and adds text-to-speech functionality
 */
export function TextContentWithSpeech({
  heading,
  content,
  className = ''
}: TextContentWithSpeechProps) {
  const { settings } = useAccessibility();
  
  // If text-to-speech is disabled in settings, just render the content
  if (!settings.textToSpeechEnabled) {
    return (
      <div className={className}>
        {heading && <h2 className="text-xl font-semibold mb-2">{heading}</h2>}
        <p>{content}</p>
      </div>
    );
  }
  
  // The text to be read includes both the heading and content
  const textToRead = heading ? `${heading}. ${content}` : content;
  
  return (
    <div className={`relative p-4 border rounded-lg ${className}`}>
      <div>
        {heading && <h2 className="text-xl font-semibold mb-2">{heading}</h2>}
        <p>{content}</p>
      </div>
      <div className="absolute top-2 right-2">
        <TextToSpeech text={textToRead} compact />
      </div>
    </div>
  );
} 