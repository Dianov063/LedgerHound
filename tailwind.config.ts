import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-manrope)', 'sans-serif'],
        // Editorial serif — headlines on the payment side only. Crypto keeps `display`.
        serif: ['var(--font-lora)', 'Georgia', 'serif'],
      },
      colors: {
        /* ── Payment product palette ──
         * A second, warmer scale that lives beside `brand` rather than replacing
         * it. Crypto pages keep the blue; the payment front door uses these. Two
         * products, two palettes, one brand — and no need to touch the ~1345
         * existing brand-* utilities to introduce it. */
        paper: '#F6F2EA',
        sand: '#EFE9DE',
        espresso: '#241A14',
        ink: {
          DEFAULT: '#2B2019',
          muted: '#6E6154',
          faint: '#9C8F82',
        },
        clay: {
          50: '#FBF1EC',
          100: '#F6E3DC',
          200: '#EBD6CB',
          300: '#E0916A',
          600: '#B4552F',
          700: '#9E4826',
          800: '#8E3A18',
        },
        brand: {
          50: '#eff8ff',
          100: '#dbeffe',
          200: '#bfe3fd',
          300: '#93d1fb',
          400: '#60b8f8',
          500: '#3b9bf4',
          600: '#1a7de9',
          700: '#1565d6',
          800: '#1751ad',
          900: '#194588',
          950: '#142b54',
        },
        slate: {
          950: '#0a0f1e',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
