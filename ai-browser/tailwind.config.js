/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'browser-bg': '#1e1e2e',
        'browser-surface': '#313244',
        'browser-text': '#cdd6f4',
        'browser-subtext': '#a6adc8',
        'browser-accent': '#89b4fa',
        'browser-green': '#a6e3a1',
        'browser-red': '#f38ba8',
        'browser-yellow': '#f9e2af',
      }
    },
  },
  plugins: [],
}
