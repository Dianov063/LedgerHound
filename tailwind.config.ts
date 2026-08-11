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
        /* ── One palette for the whole site ──
         *
         * `brand` and `slate` are remapped in place rather than replaced at the
         * call site. Every existing utility — roughly 1345 brand-* and 3387
         * slate-* across 104 files — turns warm without a single one of them
         * being edited, and any page written before this change inherits it.
         *
         * That means the ramps have to stay complete and monotonic: pages use
         * brand-50 tints, brand-600 fills, brand-200 text on brand-800 panels
         * and 600→800 gradients, so every step has to keep working in the role
         * its blue counterpart played. */
        paper: '#F6F2EA',
        sand: '#EFE9DE',
        espresso: '#241A14',
        ink: {
          DEFAULT: '#2B2019',
          muted: '#6E6154',
          faint: '#9C8F82',
        },
        // Terracotta, the single accent. `clay` and `brand` are the same ramp —
        // `clay` reads clearer in new code, `brand` keeps the old code working.
        clay: {
          50: '#FBF1EC',
          100: '#F6E3DC',
          200: '#EBD6CB',
          300: '#E0916A',
          400: '#CE7048',
          500: '#C05F35',
          600: '#B4552F',
          700: '#9E4826',
          800: '#8E3A18',
          900: '#6F2E14',
          950: '#40190B',
        },
        brand: {
          50: '#FBF1EC',
          100: '#F6E3DC',
          200: '#EBD6CB',
          300: '#E0916A',
          400: '#CE7048',
          500: '#C05F35',
          600: '#B4552F',
          700: '#9E4826',
          800: '#8E3A18',
          900: '#6F2E14',
          950: '#40190B',
        },
        // Warm neutrals in place of Tailwind's blue-grey slate. Without this the
        // accent would be terracotta while every paragraph stayed cold.
        slate: {
          50: '#FAF7F2',
          100: '#F3EEE6',
          200: '#E7DFD3',
          300: '#D5C9B9',
          400: '#A99B8A',
          500: '#857868',
          600: '#6E6154',
          700: '#574C41',
          800: '#3D352C',
          900: '#2B2019',
          950: '#1A130E',
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
