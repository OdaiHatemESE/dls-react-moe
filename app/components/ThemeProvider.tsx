"use client";

import React, { useEffect, useLayoutEffect } from "react";

type Theme = 'light' | 'blue' | 'green' | 'purple' | 'dark';

// Use a script to prevent flash of wrong theme
const themeScript = `
  (function() {
    function applyTheme(theme) {
      const root = document.documentElement;
      const body = document.body;
      
      // Remove all theme classes
      root.classList.remove('dark', 'theme-blue', 'theme-green', 'theme-purple');
      body.classList.remove('dark', 'theme-blue', 'theme-green', 'theme-purple');
      
      // Apply the selected theme
      if (theme === 'dark') {
        root.classList.add('dark');
        body.classList.add('dark');
      } else if (theme !== 'light') {
        root.classList.add('theme-' + theme);
        body.classList.add('theme-' + theme);
      }
    }

    try {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      let theme = 'light';
      
      if (savedTheme) {
        theme = savedTheme;
      } else if (prefersDark) {
        theme = 'dark';
      }
      
      applyTheme(theme);
    } catch (e) {
      // Fallback to light theme if anything fails
      applyTheme('light');
    }
  })();
`;

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Use useLayoutEffect for immediate execution before paint
  useLayoutEffect(() => {
    const initializeTheme = () => {
      const savedTheme = localStorage.getItem('theme') as Theme;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      let theme: Theme = 'light';
      
      if (savedTheme) {
        theme = savedTheme;
      } else if (prefersDark) {
        theme = 'dark';
      }
      
      applyTheme(theme);
    };

    const applyTheme = (theme: Theme) => {
      const root = document.documentElement;
      const body = document.body;
      
      // Remove all theme classes
      root.classList.remove('dark', 'theme-blue', 'theme-green', 'theme-purple');
      body.classList.remove('dark', 'theme-blue', 'theme-green', 'theme-purple');
      
      // Apply the selected theme
      if (theme === 'dark') {
        root.classList.add('dark');
        body.classList.add('dark');
      } else if (theme !== 'light') {
        root.classList.add(`theme-${theme}`);
        body.classList.add(`theme-${theme}`);
      }
      
      console.log('Theme applied in ThemeProvider:', theme, {
        htmlClasses: Array.from(root.classList),
        bodyClasses: Array.from(body.classList)
      });
    };

    // Initialize immediately
    initializeTheme();
  }, []);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {children}
    </>
  );
}