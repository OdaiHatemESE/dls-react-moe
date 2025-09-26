const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  future: {
    hoverOnlyWhenSupported: false,
  },
  theme: {
    extend: {
      colors: {
        ...defaultTheme.colors,
        white: '#ffffff',
        black: '#000000',
        odai: '#ccc',
        transparent: 'transparent',
        current: 'currentColor',
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        },
      },
    },
  },
  plugins: [
    require("@aegov/design-system"),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    function ({ addUtilities }) {
      addUtilities({
        '.direction-rtl': { direction: 'rtl' },
        '.direction-ltr': { direction: 'ltr' },
      })
    },
  ],
}
