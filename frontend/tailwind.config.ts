import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        surface: '#131313',
        'surface-container': '#1F1F1F',
        'on-surface': '#e5e2e1',
        primary: '#3B82F6', // 'Electric Blue' for active energy flow
        secondary: '#00a572', // 'Emerald Green' for nominal stability
        tertiary: '#ca8100', // Amber
        error: '#ffb4ab',
        emergency: '#93000a',
        outline: '#8c909f',
        'outline-variant': 'rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        roboto: ['var(--font-roboto-flex)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      backdropBlur: {
        glass: '12px',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem', // 8px
        md: '0.75rem',
        lg: '1rem', // 16px
        xl: '1.5rem',
        full: '9999px',
      }
    },
  },
  plugins: [],
};
export default config;
