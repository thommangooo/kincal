import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'kin-red': '#dc2626',
        'kin-red-light': '#fef2f2',
        'kin-red-dark': '#991b1b',
      },
    },
  },
  plugins: [],
}

export default config

