/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        azure: '#1D4ED8',
        azureDark: '#1E40AF',
        teal: '#0D9488',
        tealSoft: '#CCFBF1',
        navy: '#0B1220',
        ink: '#1F2937',
        mist: '#F3F6FB',
        panel: '#FFFFFF',
        line: '#CBD5E1',
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
        soft: '0 18px 42px rgba(15, 23, 42, 0.08)',
        card: '0 14px 34px rgba(15, 23, 42, 0.10)',
        command: '0 20px 45px rgba(15, 23, 42, 0.18)',
        glow: '0 14px 26px rgba(29, 78, 216, 0.20)'
      }
    }
  },
  plugins: []
};
