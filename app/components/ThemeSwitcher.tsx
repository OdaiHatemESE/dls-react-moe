"use client";

import React, { useState } from "react";
import { useTheme } from "@/lib/hooks/useTheme";

type Theme = 'light' | 'blue' | 'green' | 'purple' | 'dark';

interface ThemeOption {
  name: Theme;
  label: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  preview: string;
}

const themes: ThemeOption[] = [
  {
    name: 'light',
    label: 'UAE Gold',
    colors: {
      primary: '#92722a',
      secondary: '#6fb97f', 
      accent: '#d7bc6d'
    },
    preview: 'bg-gradient-to-r from-aegold-500 via-aegreen-400 to-aegold-300'
  },
  {
    name: 'blue',
    label: 'Ocean Blue',
    colors: {
      primary: '#0080ff',
      secondary: '#7dd3fc',
      accent: '#dbeafe'
    },
    preview: 'bg-gradient-to-r from-blue-500 via-sky-300 to-blue-100'
  },
  {
    name: 'green',
    label: 'Nature Green',
    colors: {
      primary: '#059669',
      secondary: '#4ade80',
      accent: '#bbf7d0'
    },
    preview: 'bg-gradient-to-r from-emerald-600 via-green-400 to-green-200'
  },
  {
    name: 'purple',
    label: 'Royal Purple',
    colors: {
      primary: '#9333ea',
      secondary: '#c084fc',
      accent: '#e9d5ff'
    },
    preview: 'bg-gradient-to-r from-purple-600 via-purple-400 to-purple-200'
  },
  {
    name: 'dark',
    label: 'Dark Mode',
    colors: {
      primary: '#d7bc6d',
      secondary: '#4ade80',
      accent: '#374151'
    },
    preview: 'bg-gradient-to-r from-gray-800 via-gray-600 to-gray-700'
  }
];

export default function ThemeSwitcher() {
  const { theme: currentTheme, switchTheme: changeTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard shortcut: Ctrl/Cmd + Shift + T
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const switchTheme = (theme: Theme) => {
    console.log('Switching to theme:', theme);
    changeTheme(theme);
    setIsOpen(false);
  };

  const currentThemeData = themes.find(t => t.name === currentTheme) || themes[0];

  return (
    <>
      {/* Floating Theme Switcher Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-4 z-40 w-12 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group border-2 border-white/20"
        title="Switch Theme (Ctrl+Shift+T)"
        aria-label="Switch Theme"
      >
        <svg className="w-5 h-5 transition-transform group-hover:rotate-180 duration-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </button>

      {/* Theme Switcher Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Choose Theme</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Current: {currentThemeData.label}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Theme Options */}
              <div className="p-6 space-y-3">
                {themes.map((theme) => {
                  const isActive = currentTheme === theme.name;
                  
                  return (
                    <button
                      key={theme.name}
                      onClick={() => switchTheme(theme.name)}
                      className={`w-full p-4 rounded-xl transition-all duration-200 flex items-center space-x-4 group ${
                        isActive
                          ? 'bg-primary/10 border-2 border-primary/20 shadow-md'
                          : 'hover:bg-muted border-2 border-transparent hover:border-border'
                      }`}
                    >
                      {/* Theme Preview */}
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-xl ${theme.preview} shadow-sm ring-2 ring-white/50`}>
                          {theme.name === 'dark' && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 flex items-center justify-center">
                              <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        {isActive && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-sm">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Theme Info */}
                      <div className="flex-1 text-left">
                        <h3 className={`font-semibold ${
                          isActive ? 'text-primary' : 'text-foreground'
                        }`}>
                          {theme.label}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <div 
                            className="w-3 h-3 rounded-full border border-white/50 shadow-sm" 
                            style={{ backgroundColor: theme.colors.primary }}
                          />
                          <div 
                            className="w-3 h-3 rounded-full border border-white/50 shadow-sm" 
                            style={{ backgroundColor: theme.colors.secondary }}
                          />
                          <div 
                            className="w-3 h-3 rounded-full border border-white/50 shadow-sm" 
                            style={{ backgroundColor: theme.colors.accent }}
                          />
                        </div>
                      </div>

                      {/* Selection Arrow */}
                      <div className={`transition-all duration-200 ${
                        isActive ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-75 group-hover:opacity-50'
                      }`}>
                        <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-muted/50 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Theme preferences are saved locally • Press Escape to close
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}