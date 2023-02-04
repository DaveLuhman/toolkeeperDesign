/** @type {import('tailwindcss').Config} */
const content = ['./src/views/**/*.{hbs,js}']
const daisyui = {
  themes: [
    {
      mytheme: {
        primary: '#ddbc75',
        secondary: '#158084',
        accent: '#143ccc',
        neutral: '#1D1523',
        'base-100': '#453E47',
        info: '#206DE9',
        success: '#189A90',
        warning: '#8E6010',
        error: '#ED7573',
        blueSteel: 'bg-gradient-to-t from-gray-400 via-gray-600 to-blue-800'
      }
    }
  ]
}
const theme = {
  fontFamily: {
    sans: ['Roboto', 'sans-serif'],
    serif: ['Merriweather', 'serif']
  },
  screens: {
    sm: '576px',
    md: '960px',
    lg: '1440px'
  },
  extend: {}
}
const variants = { display: ['responsive', 'dropdown'] }
const plugins = [require('@tailwindcss/typography'), require('daisyui'), require('rippleui')]

module.exports = { content, daisyui, theme, plugins, variants }
