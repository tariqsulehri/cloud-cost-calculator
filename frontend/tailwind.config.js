/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif']
      },
      colors: {
        azure: '#2563EB',
        azureDark: '#1D4ED8',
        azureLight: '#60A5FA',
        teal: '#0D9488',
        tealSoft: '#CCFBF1',
        navy: '#0B1220',
        navySoft: '#16213A',
        ink: '#1F2937',
        mist: '#F3F6FC',
        panel: '#FFFFFF',
        line: '#E2E8F2',
        lineSoft: '#EDF1F8',
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
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 28px -8px rgba(15, 23, 42, 0.10)',
        cardHover: '0 1px 2px rgba(15, 23, 42, 0.04), 0 20px 36px -12px rgba(15, 23, 42, 0.16)',
        command: '0 1px 0 rgba(255,255,255,0.06) inset, 0 20px 45px -10px rgba(2, 6, 23, 0.55)',
        glow: '0 10px 24px -4px rgba(37, 99, 235, 0.35)',
        glowTeal: '0 10px 24px -4px rgba(13, 148, 136, 0.35)',
        inset: 'inset 0 1px 0 0 rgba(255,255,255,0.5)'
      },
      backgroundImage: {
        'brand-header': 'radial-gradient(120% 140% at 0% 0%, #1B2A4A 0%, #0B1220 55%, #050810 100%)',
        'brand-accent': 'linear-gradient(135deg, #2563EB 0%, #0D9488 100%)',
        'brand-violet': 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        'sheen': 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 60%)'
      },
      animation: {
        'fade-up': 'fadeUp 0.35s ease-out'
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
};
