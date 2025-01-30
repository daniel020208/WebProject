/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e1e1e',
        secondary: '#2d2d2d',
        accent: '#4a90e2',
        'text-primary': '#e0e0e0',
        'text-secondary': '#a0a0a0',
        background: '#121212',
        success: '#4caf50',
        error: '#f44336',
      },
    },
  },
  plugins: [],
}

