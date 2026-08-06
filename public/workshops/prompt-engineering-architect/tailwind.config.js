/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scan the HTML file(s) for class usage.
  // If you embed this page inside a larger portfolio, add the other HTML/JS paths here.
  content: ["./prompt_engineering_architect.html"],

  // Enable .dark class strategy (matches the existing setup).
  darkMode: 'class',

  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      // Custom theme colors used throughout the page.
      // primary / primaryDark are CSS variables, so theme switching (indigo/emerald/rose) keeps working.
      colors: {
        primary: 'var(--color-primary)',
        primaryDark: 'var(--color-primary-dark)',
        darkBg: '#0f172a',
        darkCard: '#1e293b',
      },
    },
  },

  // Safelist: keep these classes even if Tailwind's scanner can't find them
  // in source. The page builds many classNames dynamically in JavaScript
  // (quiz feedback, drop-zone highlights, medal gradients, header colors).
  // If you remove this, those runtime states will look unstyled.
  safelist: [
    // Quiz / feedback states (built via classList.add or className =)
    'bg-green-100', 'bg-green-50', 'text-green-700', 'text-green-800',
    'bg-green-900/40', 'bg-green-900/20', 'bg-green-900/30',
    'text-green-300', 'border-green-500',
    'bg-red-100', 'bg-red-50', 'text-red-700', 'text-red-800',
    'bg-red-900/40', 'bg-red-900/20', 'text-red-300', 'border-red-500',
    'bg-rose-50', 'bg-rose-900/20', 'text-rose-500', 'text-rose-700',
    'text-rose-300', 'text-rose-400', 'text-rose-600', 'border-rose-500',
    'bg-emerald-50', 'bg-emerald-900/20', 'text-emerald-500', 'text-emerald-700',
    'text-emerald-300', 'text-emerald-400', 'text-emerald-600', 'border-emerald-500',
    'bg-amber-50', 'bg-amber-900/20', 'bg-amber-900/30',
    'text-amber-700', 'text-amber-300', 'border-amber-500',
    'bg-blue-50', 'bg-blue-900/20', 'text-blue-700', 'text-blue-300',
    'border-blue-500',

    // Medal gradients (assembled at runtime in renderAnalytics)
    'from-amber-400', 'to-orange-500',
    'from-slate-300', 'to-slate-500',
    'from-amber-700', 'to-amber-900',

    // Misc runtime hooks
    'scale-110', 'fade-in', 'medal-pop',
  ],

  plugins: [
    require('@tailwindcss/typography'), // for the `prose` / `dark:prose-invert` blocks
  ],
}
