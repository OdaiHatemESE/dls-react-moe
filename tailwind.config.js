/* your tailwind.config.js file */

module.exports = {
 content: [
  './node_modules/@aegov/design-system-react/**/*.{js,jsx,ts,tsx}',
  './src/**/*.{js,jsx,ts,tsx}',
],
  future: {
    hoverOnlyWhenSupported: false,
  },
  theme: {
    extend: {},
  },
  plugins: [
    require('@aegov/design-system'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')
  ],
}
