/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hotsDeep: '#070101',
        hotsSurface: '#120303',
        hotsElevated: '#1B0606',
        hotsCrimson: '#D42B2B',
        hotsGold: '#F5C518',
        piketHijau: '#064E3B',
        piketCyan: '#083344',
        piketLavender: '#2E1065',
        piketBiru: '#1E3A8A',
        piketOrange: '#7C2D12',
        piketGray: '#1F2937',
      }
    },
  },
  plugins: [],
}
