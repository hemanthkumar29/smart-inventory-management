/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#edf6f9",
          100: "#d6eef2",
          200: "#a9dfe6",
          300: "#7acdd6",
          400: "#4ab9c6",
          500: "#1899ad",
          600: "#0f7e92",
          700: "#0f6474",
          800: "#124f5b",
          900: "#153f49"
        },
        sand: {
          50: "#fffaf2",
          100: "#fff2df",
          200: "#ffe4bc",
          300: "#ffd291",
          400: "#fbb55f",
          500: "#f28d2f",
          600: "#de6e20",
          700: "#b8521c",
          800: "#92411f",
          900: "#76371e"
        }
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Manrope", "sans-serif"]
      },
      boxShadow: {
        panel: "0 20px 40px rgba(15, 100, 116, 0.08)",
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        floatIn: "floatIn 0.45s ease-out",
      },
    },
  },
  plugins: [],
};
