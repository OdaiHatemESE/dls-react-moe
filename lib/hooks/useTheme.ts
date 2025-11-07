"use client";

import { useState, useEffect } from 'react';

type Theme = 'light' | 'blue' | 'green' | 'purple' | 'dark';

export function useTheme() {
  // Initialize with a function to get the correct initial state
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) {
        return savedTheme;
      }
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    // Sync state with what should be applied
    const savedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let currentTheme: Theme = 'light';
    
    if (savedTheme) {
      currentTheme = savedTheme;
    } else if (prefersDark) {
      currentTheme = 'dark';
    }
    
    // Ensure state and DOM are in sync
    if (theme !== currentTheme) {
      setTheme(currentTheme);
    }
    applyTheme(currentTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    const body = document.body;
    
    // Remove all theme classes from both html and body
    root.classList.remove('dark', 'theme-blue', 'theme-green', 'theme-purple');
    body.classList.remove('dark', 'theme-blue', 'theme-green', 'theme-purple');
    
    // Apply the selected theme to both html and body
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else if (theme !== 'light') {
      root.classList.add(`theme-${theme}`);
      body.classList.add(`theme-${theme}`);
    }
  };

  const switchTheme = (newTheme: Theme) => {
    
    // Update state
    setTheme(newTheme);
    
    // Apply theme to DOM
    applyTheme(newTheme);
    
    // Save to localStorage
    try {
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
    }
  };

  return { theme, switchTheme };
}