import { useState, useEffect } from 'react';
import { useSupabaseData } from './useSupabaseHook';
import { AccessibilitySetting } from '@/lib/supabase';

// Mock user for demo purposes
const CURRENT_USER_ID = 'current-user-id';

// Default accessibility settings
const DEFAULT_ACCESSIBILITY_SETTINGS = {
  fontSize: 'medium', // small, medium, large, x-large
  contrast: 'normal', // normal, high, low
  reducedMotion: false,
  textSpacing: 'normal', // normal, increased
  textAlign: 'left', // left, center, right, justify
  fontFamily: 'default', // default, dyslexic-friendly, sans-serif, serif, monospace
  lineHeight: 'normal', // normal, increased, double
  highlightLinks: false,
  readingRuler: false,
  screenReader: false,
  colorBlindMode: 'none', // none, protanopia, deuteranopia, tritanopia
  keyboardNavigation: false,
  focusIndicators: false,
  autoPlay: true,
  textToSpeech: false
};

// Default accessibility settings entry
const DEFAULT_SETTINGS: AccessibilitySetting[] = [
  {
    id: '1',
    user_id: CURRENT_USER_ID,
    settings: DEFAULT_ACCESSIBILITY_SETTINGS,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export function useAccessibilitySettings() {
  const {
    data: accessibilityData,
    loading,
    error,
    addItem,
    updateItem,
    isUsingFallback
  } = useSupabaseData<AccessibilitySetting>(
    'accessibility_settings', 
    'edgenie_accessibility_settings', 
    DEFAULT_SETTINGS
  );

  const [settings, setSettings] = useState(DEFAULT_ACCESSIBILITY_SETTINGS);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  // Load settings from data
  useEffect(() => {
    if (accessibilityData.length > 0) {
      const userSettings = accessibilityData.find(s => s.user_id === CURRENT_USER_ID);
      if (userSettings) {
        setSettings(userSettings.settings);
        setSettingsId(userSettings.id);
      }
    }
  }, [accessibilityData]);

  // Update settings
  const updateSettings = async (newSettings: Partial<typeof DEFAULT_ACCESSIBILITY_SETTINGS>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      if (settingsId) {
        // Update existing settings
        await updateItem(settingsId, {
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        });
      } else {
        // Create new settings
        const result = await addItem({
          user_id: CURRENT_USER_ID,
          settings: updatedSettings
        });
        if (result) {
          setSettingsId(result.id);
        }
      }

      // Apply settings to the document
      applySettingsToDocument(updatedSettings);

      return updatedSettings;
    } catch (err) {
      console.error('Error updating accessibility settings:', err);
      throw err;
    }
  };

  // Apply current settings to the document
  const applySettingsToDocument = (settingsToApply = settings) => {
    const root = document.documentElement;
    const body = document.body;

    // Font size
    switch (settingsToApply.fontSize) {
      case 'small':
        root.style.setProperty('--font-size-multiplier', '0.85');
        break;
      case 'medium':
        root.style.setProperty('--font-size-multiplier', '1');
        break;
      case 'large':
        root.style.setProperty('--font-size-multiplier', '1.15');
        break;
      case 'x-large':
        root.style.setProperty('--font-size-multiplier', '1.3');
        break;
      default:
        root.style.setProperty('--font-size-multiplier', '1');
    }

    // Contrast
    switch (settingsToApply.contrast) {
      case 'high':
        body.classList.add('high-contrast');
        body.classList.remove('low-contrast');
        break;
      case 'low':
        body.classList.add('low-contrast');
        body.classList.remove('high-contrast');
        break;
      default:
        body.classList.remove('high-contrast', 'low-contrast');
    }

    // Reduced motion
    if (settingsToApply.reducedMotion) {
      body.classList.add('reduced-motion');
    } else {
      body.classList.remove('reduced-motion');
    }

    // Text spacing
    if (settingsToApply.textSpacing === 'increased') {
      body.classList.add('increased-spacing');
    } else {
      body.classList.remove('increased-spacing');
    }

    // Text alignment
    body.style.textAlign = settingsToApply.textAlign;

    // Font family
    switch (settingsToApply.fontFamily) {
      case 'dyslexic-friendly':
        root.style.setProperty('--font-family', '"OpenDyslexic", sans-serif');
        break;
      case 'sans-serif':
        root.style.setProperty('--font-family', '"Arial", "Helvetica", sans-serif');
        break;
      case 'serif':
        root.style.setProperty('--font-family', '"Times New Roman", "Georgia", serif');
        break;
      case 'monospace':
        root.style.setProperty('--font-family', '"Courier New", monospace');
        break;
      default:
        root.style.setProperty('--font-family', 'var(--default-font-family)');
    }

    // Line height
    switch (settingsToApply.lineHeight) {
      case 'increased':
        root.style.setProperty('--line-height', '1.8');
        break;
      case 'double':
        root.style.setProperty('--line-height', '2.4');
        break;
      default:
        root.style.setProperty('--line-height', '1.5');
    }

    // Highlight links
    if (settingsToApply.highlightLinks) {
      body.classList.add('highlight-links');
    } else {
      body.classList.remove('highlight-links');
    }

    // Reading ruler
    if (settingsToApply.readingRuler) {
      // Add reading ruler if it doesn't exist
      if (!document.getElementById('reading-ruler')) {
        const ruler = document.createElement('div');
        ruler.id = 'reading-ruler';
        document.body.appendChild(ruler);
        
        document.addEventListener('mousemove', (e) => {
          ruler.style.top = `${e.clientY}px`;
        });
      }
    } else {
      // Remove reading ruler if it exists
      const ruler = document.getElementById('reading-ruler');
      if (ruler) {
        ruler.remove();
      }
    }

    // Color blind mode
    body.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
    if (settingsToApply.colorBlindMode !== 'none') {
      body.classList.add(settingsToApply.colorBlindMode);
    }

    // Focus indicators
    if (settingsToApply.focusIndicators) {
      body.classList.add('enhanced-focus');
    } else {
      body.classList.remove('enhanced-focus');
    }
  };

  // Reset settings to default
  const resetSettings = async () => {
    await updateSettings(DEFAULT_ACCESSIBILITY_SETTINGS);
    return DEFAULT_ACCESSIBILITY_SETTINGS;
  };

  // Export settings as JSON
  const exportSettings = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "edgenie-accessibility-settings.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Import settings from JSON file
  const importSettings = async (jsonString: string) => {
    try {
      const importedSettings = JSON.parse(jsonString);
      await updateSettings(importedSettings);
      return importedSettings;
    } catch (err) {
      console.error('Error importing settings:', err);
      throw new Error('Invalid settings file format');
    }
  };

  // Detect system preferences and update settings accordingly
  const detectSystemPreferences = async () => {
    const updatedSettings = { ...settings };
    
    // Detect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      updatedSettings.reducedMotion = true;
    }
    
    // Detect dark mode preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      updatedSettings.contrast = 'high';
    }
    
    // Apply and save detected settings
    await updateSettings(updatedSettings);
    return updatedSettings;
  };

  // Initialize settings when component mounts
  useEffect(() => {
    applySettingsToDocument();
  }, [settings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    detectSystemPreferences,
    isUsingFallback
  };
} 