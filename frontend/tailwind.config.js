/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spotter: {
          dark: '#0f172a',
          primary: '#2563eb',
          accent: '#f59e0b',
          success: '#10b981',
          danger: '#ef4444',
          surface: '#1e293b',
          muted: '#64748b',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
