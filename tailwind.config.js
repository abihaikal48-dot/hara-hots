/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
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
      borderColor: {
        redTrans: "rgba(212, 43, 43, 0.12)",
      },
    },
  },
  plugins: [],
}
