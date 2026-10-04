/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          dark: '#1B5E20',       // Deep Forest Green
          primary: '#2E7D32',    // Balanced Agri Green
          leaf: '#4CAF50',       // Leaf Green
          light: '#E8F5E9',      // Soft Green Tint
          gold: '#F9A825',       // Agricultural Gold / Harvest Amber
          goldlight: '#FFF9C4',  // Light Amber
          bg: '#F7FAF7',         // Crisp clean neutral background
          surface: '#FFFFFF',    // White card background
          text: '#1F2937',       // Charcoal primary text
          muted: '#6B7280',      // Muted slate gray
          border: '#E2E8F0',     // Subtle border
          accent: '#0284C7',     // Water/Rainfall Blue
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        marathi: ['Noto Sans Devanagari', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
