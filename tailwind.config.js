/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.html",
    "./js/**/*.js",
    "./src/**/*.js",
    "./src/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        olive: '#84A93C',
        'olive-dark': '#6B8A31',
        earth: '#5C4D3A',
        brand: {
          green: '#84A93C',
          emerald: '#10B981',
          amber: '#F59E0B',
          orange: '#F97316',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
