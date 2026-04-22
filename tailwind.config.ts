import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        sidebar: {
          DEFAULT: '#1a1a1a',
          foreground: '#a3a3a3',
          active: '#262626',
        },
        card: {
          DEFAULT: '#121212',
          border: '#262626',
        }
      },
    },
  },
  plugins: [],
} satisfies Config;
