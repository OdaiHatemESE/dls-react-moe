import defaultTheme from 'tailwindcss/defaultTheme'
import animate from 'tailwindcss-animate'
import plugin from 'tailwindcss/plugin'

/** @type {import('tailwindcss').Config} */
const config = {
    darkMode: ["class"],
    content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
     './node_modules/@aegov/design-system-react/**/*.{js,jsx,ts,tsx}',
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
  			transparent: 'transparent',
  			current: 'currentColor',
  			// UAE Government Design System Colors
  			aegold: {
  				'50': '#f9f7ed',
  				'100': '#f2eccf',
  				'200': '#e6d7a2',
  				'300': '#d7bc6d',
  				'400': '#cba344',
  				'500': '#b68a35',
  				'600': '#92722a', // Primary gold
  				'700': '#b68a35',
  				'800': '#6c4527',
  				'900': '#5d3b26',
  				'950': '#361e12'
  			},
  			aered: {
  				'50': '#fef2f2',
  				'100': '#fde4e3',
  				'200': '#fdcdcb',
  				'300': '#faaaa7',
  				'400': '#f47a75',
  				'500': '#ea4f49',
  				'600': '#d83731',
  				'700': '#b52520',
  				'800': '#95231f',
  				'900': '#7c2320',
  				'950': '#430e0c'
  			},
  			aegreen: {
  				'50': '#f3faf4',
  				'100': '#e4f4e7',
  				'200': '#cae8cf',
  				'300': '#a0d5ab',
  				'400': '#6fb97f',
  				'500': '#4a9d5c',
  				'600': '#3f8e50',
  				'700': '#2f663c',
  				'800': '#2a5133',
  				'900': '#24432b',
  				'950': '#0f2415'
  			},
  			gray: {
  				'50': '#f9fafb',
  				'100': '#f3f4f6',
  				'200': '#e5e7eb',
  				'300': '#d1d5db',
  				'400': '#9ca3af',
  				'500': '#6b7280',
  				'600': '#4b5563',
  				'700': '#374151',
  				'800': '#1f2937',
  				'900': '#111827'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			shimmer: {
  				'0%': { transform: 'translateX(-100%)' },
  				'100%': { transform: 'translateX(100%)' }
  			}
  		},
  		animation: {
  			shimmer: 'shimmer 2s infinite'
  		}
  	}
  },
	plugins: [
		function ({ addUtilities }) {
      addUtilities({
        '.direction-rtl': { direction: 'rtl',textAlign: 'right' },
        '.direction-ltr': { direction: 'ltr' },
      })
    },
		plugin(function ({ matchUtilities, theme }) {
			// Logical margins: margin-inline-start/end (ms-*, me-*)
			matchUtilities(
				{
					ms: (value) => ({ marginInlineStart: value }),
					me: (value) => ({ marginInlineEnd: value }),
				},
				{ values: theme('margin'), supportsNegativeValues: true }
			)

			// Logical paddings: padding-inline-start/end (ps-*, pe-*)
			matchUtilities(
				{
					ps: (value) => ({ paddingInlineStart: value }),
					pe: (value) => ({ paddingInlineEnd: value }),
				},
				{ values: theme('spacing') }
			)

			// Logical inset for positioning badges, etc. (is-*, ie-*)
			matchUtilities(
				{
					is: (value) => ({ insetInlineStart: value }),
					ie: (value) => ({ insetInlineEnd: value }),
				},
				{ values: theme('inset'), supportsNegativeValues: true }
			)
		}),
			animate
],
}

export default config
