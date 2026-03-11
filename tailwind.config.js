/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#e01600",
        "accent-neon": "#39ff14",
        "background-light": "#f8f6f6",
        "background-dark": "#0a0a0a",
        "surface-dark": "#1a1a1a",
        "border-dark": "#2d2d2d",
      },
      fontFamily: {
        "display": ["Space Grotesk", "Public Sans", "sans-serif"],
        "mono": ["Space Mono", "monospace"]
      },
      borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
