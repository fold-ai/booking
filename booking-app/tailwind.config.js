/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      colors: {
        ink: {
          50: '#F7F7F4',
          100: '#EDEDE7',
          200: '#D6D6CC',
          300: '#A8A89B',
          400: '#6B6B5E',
          500: '#3F3F37',
          600: '#2A2A24',
          700: '#1C1C18',
          800: '#121210',
          900: '#0A0A09',
        },
        amber: {
          DEFAULT: '#F4A93C',
          soft: '#FBE4B6',
          deep: '#B97A1D',
        },
        moss: {
          DEFAULT: '#3F6B4A',
          soft: '#D9E5DC',
          deep: '#1F3A26',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,20,17,0.04), 0 8px 24px -8px rgba(20,20,17,0.08)',
        pop: '0 4px 12px rgba(20,20,17,0.10), 0 24px 48px -16px rgba(20,20,17,0.18)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [],
}
