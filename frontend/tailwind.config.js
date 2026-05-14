/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Claude's signature purples
        purple: {
          50:  '#F3F0FF',
          100: '#E8E4FF',
          200: '#D4CCFF',
          300: '#B8ADFF',
          400: '#9B8FF0',
          500: '#8B7FE8',
          600: '#6B4CE6',
          700: '#5A3ACC',
          800: '#4A2BAD',
          900: '#2D1A7A',
        },
        // Warm grays (slightly purple-tinted)
        warm: {
          50:  '#FAFAF9',
          100: '#F5F4F2',
          200: '#EDECEA',
          300: '#D8D6D2',
          400: '#A8A5A0',
          500: '#787470',
          600: '#5C5956',
          700: '#3D3B38',
          800: '#28261F',
          900: '#1A1814',
        },
        // Lavender tints
        lavender: {
          50:  '#F8F6FF',
          100: '#F0ECFF',
          200: '#E2DAFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft':   '0 2px 8px 0 rgba(107,76,230,0.08)',
        'medium': '0 4px 16px 0 rgba(107,76,230,0.12)',
        'lifted': '0 8px 32px 0 rgba(107,76,230,0.16)',
      },
      backgroundImage: {
        'purple-gradient': 'linear-gradient(135deg, #6B4CE6 0%, #8B7FE8 100%)',
        'lavender-gradient': 'linear-gradient(135deg, #F3F0FF 0%, #E8E4FF 100%)',
        'sidebar-gradient': 'linear-gradient(180deg, #FAFAF9 0%, #F5F4F2 100%)',
      },
    },
  },
  plugins: [],
}
