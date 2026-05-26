/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        azure: '#2563EB',
        azureDark: '#1D4ED8',
        teal: '#0F766E',
        tealSoft: '#99F6E4',
        navy: '#101828',
        ink: '#243041',
        mist: '#EEF2F7',
        panel: '#FFFFFF',
        line: '#D8E0EA',
        muted: '#667085',
        success: '#067647',
        warning: '#B54708',
        danger: '#B42318',
        violet: '#6D5BD0',
        plum: '#6938EF',
        graphite: '#344054'
      },
      boxShadow: {
        soft: '0 18px 42px rgba(16, 24, 40, 0.08)',
        card: '0 14px 34px rgba(16, 24, 40, 0.09)',
        command: '0 20px 45px rgba(16, 24, 40, 0.18)',
        glow: '0 14px 26px rgba(37, 99, 235, 0.20)'
      }
    }
  },
  plugins: []
};
