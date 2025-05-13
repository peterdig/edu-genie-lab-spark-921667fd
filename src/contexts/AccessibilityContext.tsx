import React, { createContext, useState, useContext, useEffect } from 'react';

interface AccessibilitySettings {
  textToSpeechEnabled: boolean;
  highContrastMode: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  fontSize: number;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  textToSpeechEnabled: true,
  highContrastMode: false,
  largeText: false,
  reducedMotion: false,
  fontSize: 1, // 1 is normal, 1.2 is large, 1.5 is x-large
};

const AccessibilityContext = createContext<AccessibilityContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  resetSettings: () => {},
});

export const useAccessibility = () => useContext(AccessibilityContext);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load settings from localStorage or use defaults
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const savedSettings = localStorage.getItem('accessibility-settings');
      return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
      return defaultSettings;
    }
  });

  // Update CSS variables when settings change
  useEffect(() => {
    const root = document.documentElement;
    
    // Font size
    root.style.setProperty('--font-size-multiplier', settings.fontSize.toString());
    
    // High contrast mode
    if (settings.highContrastMode) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Large text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    // Save to localStorage
    try {
      localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  }, [settings]);

  // Update settings
  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  // Reset to defaults
  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider 
      value={{ 
        settings, 
        updateSettings, 
        resetSettings 
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityProvider; 