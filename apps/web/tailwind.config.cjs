/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--c-primary) / <alpha-value>)',
        primary2: 'rgb(var(--c-primary2) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        page: 'rgb(var(--c-page) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        soft: 'rgb(var(--c-soft) / <alpha-value>)',
      },
      fontFamily: { sans: ['Nunito', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
