/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Season 04 Brutalist Palette
        canvas: '#E3E2DE',
        ink: '#1B0E0D',
        accent: '#C72A09',
        neon: '#31EF07',
        darkBrown: '#61220F',
        borderGrey: '#D9D9D9',
        // Legacy fallbacks
        concrete: '#E3E2DE',
        accentRed: '#C72A09',
      },
      fontFamily: {
        clash: ['"Clash Grotesk"', 'Anton', 'sans-serif'],
        general: ['"General Sans"', '"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        anton: ['Anton', '"Clash Grotesk"', 'sans-serif'],
        space: ['"Space Grotesk"', '"General Sans"', 'sans-serif'],
      },
      boxShadow: {
        brutalist: '4px 4px 0px #1B0E0D',
        'brutalist-lg': '8px 8px 0px #1B0E0D',
        'brutalist-accent': '4px 4px 0px #C72A09',
        'brutalist-neon': '4px 4px 0px #31EF07',
        sharp: '10px 10px 0px rgba(0, 0, 0, 0.1)',
        'sharp-sm': '4px 4px 0px rgba(0, 0, 0, 0.1)',
        'sharp-dark': '8px 8px 0px rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
}
