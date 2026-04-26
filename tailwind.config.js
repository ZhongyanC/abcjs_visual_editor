/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        toolbar: '#2c2c2c',
        'toolbar-hover': '#3a3a3a',
        'toolbar-active': '#0078d4',
        panel: '#f3f3f3',
        'panel-border': '#d0d0d0',
        score: '#ffffff',
      },
    },
  },
  plugins: [],
}
