/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        concrete: '#f2f2f2',
        ink: '#0a0a0a',
        accentRed: '#dc2626',
      },
      fontFamily: {
        anton: ['Anton', 'sans-serif'],
        space: ['"Space Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        sharp: '10px 10px 0px rgba(0, 0, 0, 0.1)',
        'sharp-sm': '4px 4px 0px rgba(0, 0, 0, 0.1)',
        'sharp-dark': '8px 8px 0px rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
}
