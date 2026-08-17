/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          blue: '#0F2C59',
          navy: '#061727',
          gold: '#D4AF37',
          dark: '#0B1320',
          card: '#132238',
          border: '#1E3454',
          accent: '#2563EB',
          alert: '#EF4444',
          warn: '#F59E0B',
          success: '#10B981',
        }
      }
    },
  },
  plugins: [],
}
