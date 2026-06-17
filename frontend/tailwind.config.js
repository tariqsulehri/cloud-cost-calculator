/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        azure: '#2563EB',
        azureDark: '#1D4ED8',
        teal: '#0D9488',
        tealSoft: '#CCFBF1',
        navy: '#111827',
        ink: '#1F2937',
        mist: '#F6F8FB',
        panel: '#FFFFFF',
        line: '#D7DEE8',
        muted: '#64748B',
        success: '#047857',
        warning: '#C2410C',
        danger: '#B91C1C',
        violet: '#4F46E5',
        plum: '#6D28D9',
        graphite: '#334155',
        aws: '#B45309',
        gcp: '#166534'
      },
      boxShadow: {
        soft: '0 10px 24px rgba(15, 23, 42, 0.06)',
        card: '0 8px 22px rgba(15, 23, 42, 0.07)',
        command: '0 12px 30px rgba(15, 23, 42, 0.14)',
        glow: '0 10px 20px rgba(37, 99, 235, 0.16)'
      }
    }
  },
  plugins: []
};
