/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'chat-bg': "url('./Components/Assest/background.jpg')",
        'profile-img':"url('./Components/Assest/logo.jpg')",
      },
      keyframes: {
        ring: {
          '0%': { 'stroke-dasharray': '0 257 0 0 1 0 0 258' },
          '25%': { 'stroke-dasharray': '0 0 0 0 257 0 258 0' },
          '50%, 100%': { 'stroke-dasharray': '0 0 0 0 0 515 0 0' },
        },
        ball: {
          '0%, 50%': { 'stroke-dashoffset': '1', 'animation-timing-function': 'ease-in' },
          '64%': { 'stroke-dashoffset': '-109' },
          '78%': { 'stroke-dashoffset': '-145' },
          '92%': { 'stroke-dashoffset': '-157' },
          '57%, 71%, 85%, 99%, 100%': { 'stroke-dashoffset': '-163', 'animation-timing-function': 'ease-out' },
        },
      },
      animation: {
        ring: 'ring 2s ease-out infinite',
        ball: 'ball 2s ease-out infinite',
      },
      colors: {
        serverResponse: '#D1E7FF',  // Add your custom blue color here
      },
    },
  },
  plugins: [],
}
