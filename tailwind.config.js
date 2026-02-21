/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",             // Busca en archivos de la raíz (App.tsx, index.tsx)
    "./features/**/*.{js,ts,jsx,tsx}", // Busca en features
    "./pages/**/*.{js,ts,jsx,tsx}",    // Busca en pages
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#5848e8",
        "primary-hover": "#4538c2",
        "background-light": "#f3f4f6",
        "background-dark": "#020412",
        "card-dark": "#0f1325",
        "card-light": "#ffffff",
        "text-secondary-dark": "#94a3b8",
        "text-secondary-light": "#64748b",
        "accent-success": "#10b981",
        "accent-warning": "#f59e0b",
        gray: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        }
      },
      borderRadius: {
        DEFAULT: "12px",
        "xl": "16px",
        "2xl": "20px",
      },
    },
  },
  plugins: [],
}
