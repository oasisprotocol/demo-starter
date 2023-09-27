/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#fff',
        secondary: '#3333C9',
        primaryDark: '#000',
        mediumDark: '#000',
        primaryMedium: '#000'
      },
    },
  },
  plugins: [],
};
