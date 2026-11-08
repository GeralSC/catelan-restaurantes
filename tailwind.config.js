/** @type {import('tailwindcss').Config} */
// Tokens de cor centralizados: para trocar a identidade visual, mude só aqui.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#B91C1C', dark: '#991B1B', light: '#FEE2E2', soft: '#FEF2F2' },
        surface: { DEFAULT: '#FAFAF9', card: '#FFFFFF', line: '#E7E5E4' },
        ink: { DEFAULT: '#1C1917', soft: '#44403C' },
        muted: { DEFAULT: '#78716C', light: '#F5F5F4' },
        success: { DEFAULT: '#15803D', light: '#DCFCE7' },
        warning: { DEFAULT: '#B45309', light: '#FEF3C7', strong: '#F59E0B' },
        danger: { DEFAULT: '#DC2626', light: '#FEE2E2', dark: '#7F1D1D' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card: '0 1px 2px rgba(28,25,23,.04), 0 2px 8px rgba(28,25,23,.05)',
        float: '0 8px 30px rgba(28,25,23,.18)',
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem' },
      keyframes: {
        'slide-up': { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'none', opacity: '1' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        pop: { '0%': { transform: 'scale(.6)', opacity: '0' }, '70%': { transform: 'scale(1.08)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        flash: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.55' } },
      },
      animation: {
        'slide-up': 'slide-up .25s ease-out',
        'fade-in': 'fade-in .2s ease-out',
        pop: 'pop .45s cubic-bezier(.2,.9,.3,1.2)',
        flash: 'flash 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
