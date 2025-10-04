"use client";

import { useEffect, useState } from "react";

type Theme = 'light' | 'blue' | 'green' | 'purple' | 'dark';

// Direct theme application function
const applyThemeToDOM = (theme: Theme) => {
  const root = document.documentElement;
  const body = document.body;
  
  // Remove all theme classes first
  const themeClasses = ['dark', 'theme-blue', 'theme-green', 'theme-purple'];
  root.classList.remove(...themeClasses);
  body.classList.remove(...themeClasses);
  
  // Apply new theme
  if (theme === 'dark') {
    root.classList.add('dark');
    body.classList.add('dark');
  } else if (theme !== 'light') {
    const themeClass = `theme-${theme}`;
    root.classList.add(themeClass);
    body.classList.add(themeClass);
  }
  
  // Force a style recalculation
  document.body.offsetHeight;
};

export default function ThemeDebugger() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');
  const [cssVariables, setCssVariables] = useState<Record<string, string>>({});

  const themes: Theme[] = ['light', 'blue', 'green', 'purple', 'dark'];

  const updateCssVariables = () => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    const variables = {
      '--background': computedStyle.getPropertyValue('--background').trim(),
      '--foreground': computedStyle.getPropertyValue('--foreground').trim(),
      '--primary': computedStyle.getPropertyValue('--primary').trim(),
      '--secondary': computedStyle.getPropertyValue('--secondary').trim(),
      '--accent': computedStyle.getPropertyValue('--accent').trim(),
    };
    
    setCssVariables(variables);
  };

  const switchTheme = (theme: Theme) => {
    console.log('=== Theme Switch Debug ===');
    console.log('Switching to:', theme);
    
    // Apply theme immediately
    applyThemeToDOM(theme);
    
    // Update state
    setCurrentTheme(theme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Log current state
    setTimeout(() => {
      console.log('HTML classes:', Array.from(document.documentElement.classList));
      console.log('Body classes:', Array.from(document.body.classList));
      updateCssVariables();
    }, 100);
  };

  useEffect(() => {
    // Initialize theme
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'light';
    setCurrentTheme(savedTheme);
    applyThemeToDOM(savedTheme);
    updateCssVariables();
  }, []);

  useEffect(() => {
    updateCssVariables();
  }, [currentTheme]);

  return (
    <div className="p-8 space-y-6 min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Theme Debugger</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme Switcher */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Current Theme: {currentTheme}</h2>
            <div className="grid grid-cols-1 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => switchTheme(theme)}
                  className={`p-3 rounded border-2 transition-all text-left ${
                    currentTheme === theme
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50 bg-card text-card-foreground'
                  }`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)} Theme
                </button>
              ))}
            </div>
          </div>

          {/* CSS Variables Display */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">CSS Variables</h2>
            <div className="bg-muted p-4 rounded space-y-2 font-mono text-sm">
              {Object.entries(cssVariables).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground">{key}:</span>
                  <span>{value || 'undefined'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Test */}
        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold">Visual Test</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-primary text-primary-foreground rounded">
              Primary Color
            </div>
            <div className="p-4 bg-secondary text-secondary-foreground rounded">
              Secondary Color
            </div>
            <div className="p-4 bg-accent text-accent-foreground rounded">
              Accent Color
            </div>
            <div className="p-4 bg-muted text-muted-foreground rounded">
              Muted Color
            </div>
          </div>
          
          <div className="p-6 bg-card text-card-foreground border border-border rounded-lg">
            <h3 className="font-semibold mb-2">Card Component</h3>
            <p className="text-muted-foreground">
              This card should adapt to the selected theme. The background, text, and border colors should change.
            </p>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-muted rounded">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <div className="space-y-1 text-sm font-mono">
            <div>HTML Classes: {document?.documentElement?.className || 'Loading...'}</div>
            <div>Body Classes: {document?.body?.className || 'Loading...'}</div>
            <div>Saved Theme: {typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}