/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f6ff',
          100: '#ebedff',
          200: '#d7dbff',
          300: '#b4b9ff',
          400: '#8b94ff',
          500: '#6673ff',
          600: '#4c57e6',
          700: '#3b45b4',
          800: '#303991',
          900: '#2b3277',
        },
      },
    },
  },
  plugins: [],
};

