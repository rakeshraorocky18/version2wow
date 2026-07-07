/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        romantic: {
          blush: '#FFB6C1',
          rose: '#FF5C8D',
          lavender: '#C8A2C8',
          champagne: '#D4AF37',
          peach: '#FFDAB9',
          cream: '#FFF9F5',
        },
        wow: {
          bg: '#FAF8FB',
          card: '#FFFFFF',
          primary: '#B76E79',
          'primary-light': '#D69BA6',
          secondary: '#E7C6D0',
          success: '#8BC48A',
          warning: '#F4C95D',
          text: '#2C2630',
          muted: '#6B6670',
        },
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
};
