// Cores semânticas: os valores vêm das variáveis CSS em src/index.css (tema claro e escuro)
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: token('app'),
        surface: token('surface'),
        subtle: token('subtle'),
        hover: token('hover'),
        line: token('line'),
        ink: { DEFAULT: token('ink'), 2: token('ink-2'), 3: token('ink-3') },
        brand: { DEFAULT: token('brand'), hover: token('brand-hover'), soft: token('brand-soft'), ink: token('brand-ink') },
        topbar: token('topbar'),
        rail: token('rail'),
        danger: { DEFAULT: token('danger'), soft: token('danger-soft') },
        success: token('success'),
        warning: token('warning'),
        // Conversa (estilo WhatsApp)
        chat: {
          bg: token('chat-bg'),
          header: token('chat-header'),
          in: token('bubble-in'),
          out: token('bubble-out'),
          ink: token('bubble-ink'),
          meta: token('bubble-meta'),
          accent: token('chat-accent'),
          tick: token('tick-read'),
        },
      },
      fontFamily: {
        sans: ['Inter', '"Segoe UI"', '-apple-system', 'BlinkMacSystemFont', 'Roboto', '"Helvetica Neue"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.08), 0 0 1px rgb(0 0 0 / 0.08)',
        pop: '0 8px 16px rgb(0 0 0 / 0.14), 0 0 2px rgb(0 0 0 / 0.12)',
        bubble: '0 1px 0.5px rgb(11 20 26 / 0.13)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'pop-in': { from: { opacity: 0, transform: 'scale(.96) translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
        'slide-left': { from: { transform: 'translateX(100%)' }, to: { transform: 'none' } },
      },
      animation: {
        'fade-in': 'fade-in .15s ease-out',
        'pop-in': 'pop-in .14s ease-out',
        'slide-up': 'slide-up .18s ease-out',
        'slide-left': 'slide-left .2s ease-out',
      },
    },
  },
  plugins: [],
}
