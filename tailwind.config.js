/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CAP Brand Colors
        chalk: '#FFFFF9',
        ivory: '#F2F3E5',
        eggshell: '#E1E1CC',
        battleship: '#7E7C6E',
        'night-green': '#303029',
        smoke: '#17150B',
        olive: '#9B9879',
        // Primary color mapped to Night Green for compatibility
        primary: {
          50: '#F2F3E5',
          100: '#E1E1CC',
          200: '#C5C5B0',
          300: '#9B9879',
          400: '#7E7C6E',
          500: '#303029',
          600: '#303029',
          700: '#17150B',
          800: '#17150B',
          900: '#17150B',
        },
        // Station Colors
        'station-run': '#E85D04',    // Burnt orange
        'station-row': '#0077B6',    // Ocean blue
        'station-bike': '#7B2CBF',   // Deep purple
        'station-ski': '#2D6A4F',    // Forest green
        // Status Colors
        success: '#059669',
        warning: '#F59E0B',
        error: '#DC2626',
      },
      fontFamily: {
        mono: ['Azeret Mono', 'ui-monospace', 'monospace'],
        sans: ['Aktiv Grotesk', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
