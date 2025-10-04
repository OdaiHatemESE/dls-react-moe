"use client";

import { useTheme } from "@/lib/hooks/useTheme";

export default function ThemeTestPage() {
  const { theme, switchTheme } = useTheme();

  const testThemes = ['light', 'blue', 'green', 'purple', 'dark'] as const;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Theme Test Page</h1>
      
      <div className="space-y-4">
        <p className="text-muted-foreground">Current theme: <strong>{theme}</strong></p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {testThemes.map((testTheme) => (
            <button
              key={testTheme}
              onClick={() => {
                console.log('Testing theme switch to:', testTheme);
                switchTheme(testTheme);
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                theme === testTheme
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 bg-card text-card-foreground hover:bg-muted'
              }`}
            >
              {testTheme.charAt(0).toUpperCase() + testTheme.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Color Test</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-primary text-primary-foreground rounded">Primary</div>
            <div className="p-4 bg-secondary text-secondary-foreground rounded">Secondary</div>
            <div className="p-4 bg-accent text-accent-foreground rounded">Accent</div>
            <div className="p-4 bg-muted text-muted-foreground rounded">Muted</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Card Test</h2>
          <div className="p-6 bg-card text-card-foreground border border-border rounded-lg shadow-sm">
            <h3 className="font-semibold mb-2">Card Content</h3>
            <p className="text-muted-foreground">This is a card with proper theming.</p>
          </div>
        </div>
        
        <button
          onClick={() => {
            console.log('HTML classes:', document.documentElement.className);
            console.log('Body classes:', document.body.className);
            console.log('Computed styles:', {
              background: getComputedStyle(document.documentElement).getPropertyValue('--background'),
              foreground: getComputedStyle(document.documentElement).getPropertyValue('--foreground'),
              primary: getComputedStyle(document.documentElement).getPropertyValue('--primary')
            });
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Debug Theme State
        </button>
      </div>
    </div>
  );
}