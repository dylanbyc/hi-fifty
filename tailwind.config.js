/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'anz-blue': '#004165',
        'anz-light-blue': '#0074C1',
      },
    },
  },
  plugins: [],
}

