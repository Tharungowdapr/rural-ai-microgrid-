import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'deep-blue': '#050a14',
                'darker-blue': '#0a0f1e',
                'cyan': '#00d4ff',
                'neon-green': '#00ff41',
                'amber': '#ffa500',
                'critical-red': '#ff0040',
                'ai-purple': '#b500ff',
            },
            fontFamily: {
                orbitron: ['Orbitron', 'sans-serif'],
                inter: ['Inter', 'sans-serif'],
            },
            animation: {
                pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                glow: 'glow 2s ease-in-out infinite',
            },
            keyframes: {
                glow: {
                    '0%, 100%': { textShadow: '0 0 10px rgba(0, 212, 255, 0.5)' },
                    '50%': { textShadow: '0 0 20px rgba(0, 212, 255, 1)' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
