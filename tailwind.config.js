/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        deep: "#070101",
        surface: "#120303",
        elevated: "#1B0606",
        crimson: "#D42B2B",
        gold: "#F5C518",
      },
    },
  },
  plugins: [],
}
