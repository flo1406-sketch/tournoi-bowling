/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bowling: {
          dark: '#0a0f1c',
          panel: '#141e35',
          line: '#2a3c63',
          neon: '#00f3ff',
          pink: '#ff007a',
        }
      }
    },
  },
  plugins: [],
}