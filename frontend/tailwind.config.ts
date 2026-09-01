import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: "#C8A951",
        "gold-dark": "#a8892f",
        dark: "#1a1a1a",
        "dark-2": "#2d2d2d",
        "dark-3": "#3d3d3d",
      },
      fontFamily: { sans: ["Inter", "sans-serif"] },
      boxShadow: { gold: "0 0 20px rgba(200,169,81,0.3)" },
      keyframes: {
        'bell-ring': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '10%':      { transform: 'rotate(14deg)' },
          '20%':      { transform: 'rotate(-10deg)' },
          '30%':      { transform: 'rotate(10deg)' },
          '40%':      { transform: 'rotate(-8deg)' },
          '50%':      { transform: 'rotate(6deg)' },
          '60%':      { transform: 'rotate(-4deg)' },
          '70%':      { transform: 'rotate(2deg)' },
          '80%':      { transform: 'rotate(0deg)' },
        },
        'ping-slow': {
          '0%':   { transform: 'scale(1)', opacity: '0.8' },
          '70%':  { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        'bell-ring': 'bell-ring 2.5s ease-in-out infinite',
        'ping-slow': 'ping-slow 2s cubic-bezier(0,0,0.2,1) infinite',
      },
    },
  },
  plugins: [],
};
export default config;
