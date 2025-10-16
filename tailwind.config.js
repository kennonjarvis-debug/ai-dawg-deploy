/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        'daw-bg': '#0f0f0f',
        bg: {
          base: 'var(--color-bg-base)',
          surface: 'var(--color-bg-surface)',
          'surface-2': 'var(--color-bg-surface-2)',
          hover: 'var(--color-bg-surface-hover)',
        },
        border: {
          base: 'var(--color-border-base)',
          strong: 'var(--color-border-strong)',
        },
        text: {
          base: 'var(--color-text-base)',
          muted: 'var(--color-text-muted)',
          dim: 'var(--color-text-dim)',
        },
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        secondary: 'var(--color-secondary)',
      },
      fontFamily: {
        sans: ['var(--font-family-sans)'],
        mono: ['var(--font-family-mono)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
