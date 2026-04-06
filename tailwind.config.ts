import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        dark: {
          50: '#F7F7F8',
          100: '#E0E1E1',
          200: '#B6BCBD',
          300: '#7C888A',
          400: '#4B5558',
          500: '#30373A',
          600: '#252B2D',
          700: '#1E2224',
          800: '#151819',
          900: '#0C0E0E',
        }
      }
    },
  },
  plugins: [],
}
export default config
