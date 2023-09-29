/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#33c',
        secondary: '#3898ec',
        primaryDark: '#000062',
        mediumDark: '#565b61',
        primaryMedium: '#3333c4'
      },
    },
  },
  plugins: [],
};
