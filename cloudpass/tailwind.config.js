/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'aws-orange': '#FF9900',
        'bg-dark': '#0F1923',
        'bg-card': '#1A2332',
        'bg-card-hover': '#1E2A3A',
        'success': '#22C55E',
        'danger': '#EF4444',
        'warning': '#F59E0B',
        'text-primary': '#F8FAFC',
        'text-muted': '#94A3B8',
      },
    },
  },
  plugins: [],
}
