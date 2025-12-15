import ThemeSwitcher from '@/app/components/ThemeSwitcher';

export default function ThemeDemo() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">Theme Switcher Demo</h1>
          <p className="text-lg text-muted-foreground">
            Try switching between different themes using the theme switcher button in the top-right corner!
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Primary Colors</h3>
            <p className="text-muted-foreground mb-4">
              This card uses primary colors that change with each theme.
            </p>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
              Primary Button
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-secondary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Secondary Colors</h3>
            <p className="text-muted-foreground mb-4">
              Secondary colors provide complementary styling across themes.
            </p>
            <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors">
              Secondary Button
            </button>
          </div>

          {/* Card 3 */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm md:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Accent Colors</h3>
            <p className="text-muted-foreground mb-4">
              Accent colors add subtle highlights and emphasis.
            </p>
            <button className="bg-accent text-accent-foreground px-4 py-2 rounded-md hover:bg-accent/90 transition-colors">
              Accent Button
            </button>
          </div>
        </div>

        {/* Theme Color Palette */}
        <div className="mt-12 bg-card border border-border rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-card-foreground mb-6">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="w-full h-16 bg-primary rounded-lg shadow-sm"></div>
              <p className="text-sm font-medium text-foreground">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-secondary rounded-lg shadow-sm"></div>
              <p className="text-sm font-medium text-foreground">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-accent rounded-lg shadow-sm"></div>
              <p className="text-sm font-medium text-foreground">Accent</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-muted rounded-lg shadow-sm"></div>
              <p className="text-sm font-medium text-foreground">Muted</p>
            </div>
          </div>
        </div>

        {/* Available Themes */}
        <div className="mt-12 bg-card border border-border rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-card-foreground mb-6">Available Themes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-aegold-500 via-aegreen-400 to-aegold-300"></div>
                <span className="font-medium">UAE Gold (Default)</span>
              </div>
              <p className="text-sm text-muted-foreground">Official UAE government colors</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 via-sky-300 to-blue-100"></div>
                <span className="font-medium">Ocean Blue</span>
              </div>
              <p className="text-sm text-muted-foreground">Calming blue tones</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-600 via-green-400 to-green-200"></div>
                <span className="font-medium">Nature Green</span>
              </div>
              <p className="text-sm text-muted-foreground">Fresh natural greens</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-600 via-purple-400 to-purple-200"></div>
                <span className="font-medium">Royal Purple</span>
              </div>
              <p className="text-sm text-muted-foreground">Elegant purple shades</p>
            </div>
            <div className="p-4 border border-border rounded-lg md:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-800 via-gray-600 to-gray-700"></div>
                <span className="font-medium">Dark Mode</span>
              </div>
              <p className="text-sm text-muted-foreground">Dark theme for low light</p>
            </div>
          </div>
        </div>
      </div>

      <ThemeSwitcher />
    </div>
  );
}