/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          300: '#FDBA74', // orange-300
          400: '#FB923C', // orange-400
          500: '#F97316'  // orange-500
        },
        secondary: {
          400: '#F59E0B', // amber-500
          500: '#B45309'  // orange-700 / warm brown accent
        },
        neutral: {
          100: '#FFFFFF',
          200: '#C1C2C5',
          300: '#909296',
          400: '#737373',
          500: '#5C5F66',
          600: '#373A40',
          700: '#2C2E33',
          800: '#25262B',
          900: '#1A1B1E'
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(249, 115, 22, 0.15)' // warm glow
      }
    },
  },
  plugins: [],
};