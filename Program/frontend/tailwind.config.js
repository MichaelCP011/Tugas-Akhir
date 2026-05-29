/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'panel-dark': 'rgba(15, 23, 42, 0.75)',
      }
    },
  },
  plugins: [],
}