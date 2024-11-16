/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#19191c",
        secondary: {
          DEFAULT: "#121212",
          100: "#2a2a2a",
        },
        accent: "#fd356d",
      },
    },
  },
  plugins: [],
};
