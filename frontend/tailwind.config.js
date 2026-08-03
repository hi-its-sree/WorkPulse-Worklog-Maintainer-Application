export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ECF3FF',
          100: '#D8E6FF',
          200: '#B7D0FF',
          400: '#6791FF',
          500: '#2F65F8',
          600: '#1F4CD1',
          800: '#152749',
          900: '#0D1730'
        },
        secondary: {
          50: '#EDF7F3',
          100: '#D7EFDE',
          200: '#B7E4C7',
          500: '#0F766E',
          600: '#14532D'
        }
      },
      boxShadow: {
        soft: '18px 18px 48px rgba(14, 77, 255, 0.08), -14px -14px 42px rgba(255, 255, 255, 0.9)',
        glow: '0 18px 50px rgba(59, 130, 246, 0.18)'
      },
      borderRadius: {
        xl: '2rem',
        '2xl': '2.5rem'
      }
    }
  },
  plugins: []
};
