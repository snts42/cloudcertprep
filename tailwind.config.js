/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      boxShadow: {
        'card': 'var(--card-shadow)',
      },
      colors: {
        'aws-orange': 'rgb(var(--color-aws-orange) / <alpha-value>)',
        'bg-dark': 'rgb(var(--color-bg-dark) / <alpha-value>)',
        'bg-card': 'rgb(var(--color-bg-card) / <alpha-value>)',
        'bg-card-hover': 'rgb(var(--color-bg-card-hover) / <alpha-value>)',
        'success': 'rgb(var(--color-success) / <alpha-value>)',
        'danger': 'rgb(var(--color-danger) / <alpha-value>)',
        'warning': 'rgb(var(--color-warning) / <alpha-value>)',
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
