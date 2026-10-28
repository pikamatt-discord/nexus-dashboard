/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: "#030712",
          900: "#0b0f19",
          850: "#111827",
          800: "#172236",
          750: "#1f2d47",
          700: "#273859",
          600: "#384f7a",
        },
        nexus: {
          purple: "#8b5cf6",
          purpleDark: "#6d28d9",
          blue: "#3b82f6",
          blueDark: "#1d4ed8",
          emerald: "#10b981",
          rose: "#f43f5e",
          amber: "#f59e0b",
          cyan: "#06b6d4",
          violet: "#a855f7",
          indigo: "#6366f1",
        }
      },
      boxShadow: {
        'glow-purple': '0 0 35px -5px rgba(139, 92, 246, 0.45)',
        'glow-blue': '0 0 35px -5px rgba(59, 130, 246, 0.45)',
        'glow-emerald': '0 0 35px -5px rgba(16, 185, 129, 0.45)',
        'glow-rose': '0 0 35px -5px rgba(244, 63, 94, 0.45)',
        'glow-cyan': '0 0 35px -5px rgba(6, 182, 212, 0.45)',
        'glow-amber': '0 0 35px -5px rgba(245, 158, 11, 0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 15s linear infinite',
      }
    },
  },
  plugins: [],
}
