# Theme System Documentation

## Overview

The Parent Portal now includes a comprehensive theme system with 4 different themes plus a dark mode, allowing users to customize their experience based on their preferences.

## Available Themes

### 1. UAE Gold (Default)
- **Primary Color**: UAE Gold (#92722a)
- **Secondary Color**: UAE Green (#6fb97f)
- **Description**: Official UAE government design system colors
- **Best for**: Default professional look aligned with UAE branding

### 2. Ocean Blue
- **Primary Color**: Blue (#0080ff)
- **Secondary Color**: Light Blue (#7dd3fc)
- **Description**: Calming blue tones inspired by ocean colors
- **Best for**: Users who prefer cooler, calming colors

### 3. Nature Green
- **Primary Color**: Emerald Green (#059669)
- **Secondary Color**: Green (#4ade80)
- **Description**: Fresh natural green shades
- **Best for**: Users who prefer natural, eco-friendly colors

### 4. Royal Purple
- **Primary Color**: Purple (#9333ea)
- **Secondary Color**: Light Purple (#c084fc)
- **Description**: Elegant purple shades for a premium feel
- **Best for**: Users who prefer sophisticated, royal colors

### 5. Dark Mode
- **Primary Color**: Light Gold (#d7bc6d)
- **Secondary Color**: Green (#4ade80)
- **Description**: Dark theme optimized for low-light environments
- **Best for**: Nighttime use, reducing eye strain, saving battery on OLED screens

## How to Use

### Theme Switcher Button
- **Location**: Fixed button in the top-right corner of the screen
- **Icon**: Star icon that rotates on hover
- **Click**: Opens the theme selection modal

### Keyboard Shortcuts
- **Open Theme Switcher**: `Ctrl + Shift + T` (Windows) or `Cmd + Shift + T` (Mac)
- **Close Modal**: `Escape` key

### Theme Selection Modal
1. Click on any theme option to apply it immediately
2. The current theme is highlighted with a checkmark
3. Color previews show the main colors for each theme
4. Theme preferences are automatically saved to localStorage

## Technical Implementation

### CSS Variables
Each theme uses CSS custom properties (variables) that are dynamically applied:

```css
:root {
  --primary: [hsl values];
  --secondary: [hsl values];
  --background: [hsl values];
  /* ... other color variables */
}
```

### Theme Classes
- Default: No additional class (uses `:root` variables)
- Blue: `.theme-blue`
- Green: `.theme-green`
- Purple: `.theme-purple`
- Dark: `.dark`

### Auto-Detection Features
- **System Preference**: Automatically detects if user prefers dark mode
- **Persistence**: Remembers user's theme choice across sessions
- **Responsive**: Listens for system theme changes

## Accessibility Features

### Keyboard Navigation
- Full keyboard support for theme switching
- Focus management within the modal
- Escape key to close modal

### Screen Reader Support
- Proper ARIA labels on buttons
- Descriptive text for theme options
- Status indicators for current theme

### Color Contrast
- All themes meet WCAG AA contrast requirements
- Dark mode optimized for low-light conditions
- High contrast mode compatible

## Usage in Components

### Using Theme Colors in JSX
```tsx
// These classes automatically adapt to the current theme
<div className="bg-primary text-primary-foreground">
  Primary colored element
</div>

<div className="bg-secondary text-secondary-foreground">
  Secondary colored element
</div>

<div className="bg-card border-border">
  Card with theme-aware colors
</div>
```

### Common Theme-Aware Classes
- `bg-background` / `text-foreground` - Main background and text
- `bg-card` / `text-card-foreground` - Card backgrounds
- `bg-primary` / `text-primary-foreground` - Primary actions
- `bg-secondary` / `text-secondary-foreground` - Secondary actions
- `bg-muted` / `text-muted-foreground` - Muted/subtle elements
- `border-border` - Theme-aware borders

## Testing the Themes

Visit `/theme-demo` to see a comprehensive demonstration of how all colors and components look across different themes.

## Customization

### Adding New Themes
1. Add theme definition to `globals.css`:
   ```css
   .theme-custom {
     --primary: [your values];
     --secondary: [your values];
     /* ... other variables */
   }
   ```

2. Update the themes array in `ThemeSwitcher.tsx`:
   ```tsx
   {
     name: 'custom',
     label: 'Custom Theme',
     colors: { /* preview colors */ },
     preview: 'bg-gradient-to-r from-custom-500 to-custom-300'
   }
   ```

### Modifying Existing Themes
Edit the CSS custom properties in `globals.css` for any theme class.

## Browser Support

- **Modern Browsers**: Full support (Chrome 49+, Firefox 31+, Safari 9.1+)
- **CSS Custom Properties**: Required for theme switching
- **LocalStorage**: Used for persistence
- **matchMedia**: Used for system preference detection

## Performance

- **No Runtime Cost**: Themes use CSS variables, no JavaScript calculations
- **Instant Switching**: Themes apply immediately via CSS class changes
- **Lightweight**: Only adds ~2KB to CSS bundle
- **Optimized**: Uses CSS-in-JS for dynamic theme generation

## Future Enhancements

- [ ] High contrast theme option
- [ ] Custom color picker for user-defined themes
- [ ] Theme scheduling (auto dark mode at night)
- [ ] Per-page theme preferences
- [ ] Theme animation transitions