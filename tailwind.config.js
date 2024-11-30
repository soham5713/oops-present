/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Make sure your HTML is being scanned
    "./src/**/*.{js,jsx,ts,tsx,css}", // Add all relevant JS, JSX, TS, TSX, and CSS files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
