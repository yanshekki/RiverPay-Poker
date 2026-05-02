/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rp: {
          bg: '#0a0a0a',
          cyan: '#00B4D8',
          blue: '#023E8A',
          light: '#90E0EF',
          navy: '#03045E',
          felt: '#0d2818',
          card: '#1a1a2e',
        }
      },
      fontFamily: {
        display: ['system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SF Mono', 'Consolas', 'monospace'],
        number: ['ui-monospace', 'SF Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
        'deal': 'deal 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
        'timer-bar': 'shrinkBar linear forwards',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0,180,216,0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(0,180,216,0.6), 0 0 50px rgba(0,180,216,0.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(10deg)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        deal: {
          '0%': { transform: 'translateY(-100px) translateX(-50px) rotate(-20deg) scale(0.5)', opacity: '0' },
          '60%': { transform: 'translateY(5px) rotate(2deg) scale(1.02)', opacity: '1' },
          '100%': { transform: 'translateY(0) rotate(0deg) scale(1)', opacity: '1' },
        },
        shrinkBar: {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        },
      },
    },
  },
  plugins: [],
}
