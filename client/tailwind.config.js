/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        'large': '20px',   // For cards and modals
        'medium': '10px',  // For buttons and inputs
      },
    },
  },
  plugins: [],
}
