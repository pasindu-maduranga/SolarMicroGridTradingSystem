module.exports = {
  content: [
    './public/index.html',
    './src/**/*.{js,jsx}'
  ],
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      colors: {
        solar: {
          green: '#2E7D32',
          'green-dark': '#1B5E20',
          amber: '#F5A623',
          sky: '#4FC3F7'
        },
        sg: {
          'panel-1': '#1d4a30',
          'panel-2': '#2f6b45',
          sun: '#e8a53a',
          'sun-soft': '#f0c580',
          sky: '#7fb8d8',
          ink: '#22201a',
          'ink-soft': '#726a58',
          'field-bg': '#f4f1e8',
          line: '#e6ddc4',
          error: '#c0392b',
          'error-bg': '#fbe9e7'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Fraunces', 'serif'],
        'sg-sans': ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        'sg-serif': ['Fraunces', 'Georgia', 'serif'],
        'sg-mono': ['IBM Plex Mono', 'monospace']
      },
      keyframes: {
        'sg-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.4)' }
        },
        'sg-spin': {
          to: { transform: 'rotate(360deg)' }
        },
        'sg-glow': {
          '0%, 100%': { transform: 'scale(1)', opacity: 1 },
          '50%': { transform: 'scale(1.08)', opacity: 0.85 }
        },
        'sg-dash': {
          to: { strokeDashoffset: '-24' }
        },
        'sg-sweep': {
          '0%, 15%': { transform: 'translateX(-30px)', opacity: 0 },
          '30%': { opacity: 0.8 },
          '55%, 100%': { transform: 'translateX(70px)', opacity: 0 }
        },
        'sg-ring': {
          '0%': { transform: 'scale(.7)', opacity: 0.7 },
          '100%': { transform: 'scale(1.9)', opacity: 0 }
        }
      },
      animation: {
        'sg-pulse': 'sg-pulse 2.2s infinite',
        'sg-spin': 'sg-spin 22s linear infinite',
        'sg-glow': 'sg-glow 3.2s ease-in-out infinite',
        'sg-dash': 'sg-dash 1.1s linear infinite',
        'sg-sweep': 'sg-sweep 3.6s ease-in-out infinite',
        'sg-ring': 'sg-ring 2.4s ease-out infinite'
      }
    }
  },
  plugins: []
};
