/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        submitted: "#3b82f6", // blue
        acknowledged: "#d97706", // amber
        inprogress: "#f97316", // orange
        resolved: "#22c55e", // green
      }
    },
  },
  plugins: [],
}
