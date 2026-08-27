import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        topbar: {
          1: '#ff9b44',
          2: '#fc6075',
        },
        sidebar: {
          DEFAULT: '#232838',
          active: '#1B2030',
          text: '#AEB2C2',
        },
        line: '#EDEDED',
        canvas: '#F4F5F7',
        ink: {
          DEFAULT: '#26293A',
          soft: '#8A8D9B',
        },
        ok: {
          DEFAULT: '#1F9254',
          bg: '#E7F6EE',
        },
        warn: {
          DEFAULT: '#B5790A',
          bg: '#FCF1DC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        sidebar: '210px',
        topbar: '48px',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
}
