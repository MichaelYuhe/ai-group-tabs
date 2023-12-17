/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6300FF",
      },
      opacity: {
        lg: "0.87",
        md: "0.6",
        sm: "0.38",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
