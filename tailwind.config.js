/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB", // 💙 Azul intenso
          foreground: "#FFFFFF",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
