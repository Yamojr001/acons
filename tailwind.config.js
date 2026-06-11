/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{tsx,ts,jsx,js}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                display: ['"Bricolage Grotesque"', '"Plus Jakarta Sans"', 'sans-serif'],
                sans:    ['"Plus Jakarta Sans"', 'sans-serif'],
                mono:    ['"JetBrains Mono"', 'monospace'],
            },
            colors: {
                brand: {
                    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
                    500: '#3b82f6', 600: '#1d4ed8', 700: '#1e40af', 800: '#1e3a8a', 900: '#172554',
                },
                surface: {
                    50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8',
                    500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a',
                },
                danger: {
                    50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171',
                    500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d',
                },
                success: {
                    50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80',
                    500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d',
                },
                warning: {
                    50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24',
                    500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f',
                },
                primary:   { DEFAULT: 'var(--color-primary)',   light: 'var(--color-primary-light)' },
                secondary: { DEFAULT: 'var(--color-secondary)', light: 'var(--color-secondary-light)' },
                accent:    { DEFAULT: 'var(--color-accent)',    light: 'var(--color-accent-light)' },
                purple:    { DEFAULT: 'var(--color-purple)' },
                bg:        'var(--color-bg)',
                muted:     'var(--color-text-muted)',
                'border-color': 'var(--color-border)',
            },
            animation: {
                'slide-up':   'slideUp 0.4s ease-out',
                'slide-in':   'slideIn 0.3s ease-out',
                'fade-in':    'fadeIn 0.5s ease-out',
                'bounce-in':  'bounceIn 0.6s cubic-bezier(0.68,-0.55,0.27,1.55)',
                'shimmer':    'shimmer 1.5s infinite',
                'float':      'float 3s ease-in-out infinite',
                'pulse-ring': 'pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite',
                'count-up':   'fadeIn 1s ease-out',
                'spin-slow':  'spin 3s linear infinite',
            },
            keyframes: {
                slideUp:   { from: { opacity:'0', transform:'translateY(20px)' }, to: { opacity:'1', transform:'translateY(0)' } },
                slideIn:   { from: { opacity:'0', transform:'translateX(-20px)' }, to: { opacity:'1', transform:'translateX(0)' } },
                fadeIn:    { from: { opacity:'0' }, to: { opacity:'1' } },
                bounceIn:  { '0%': { opacity:'0', transform:'scale(0.5)' }, '60%': { transform:'scale(1.1)' }, '100%': { opacity:'1', transform:'scale(1)' } },
                shimmer:   { '0%': { backgroundPosition:'-200% 0' }, '100%': { backgroundPosition:'200% 0' } },
                float:     { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-8px)' } },
                pulseRing: { '0%,100%': { opacity:'1' }, '50%': { opacity:'.5' } },
            },
            boxShadow: {
                'card':    '0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.07)',
                'hover':   '0 4px 12px rgba(0,0,0,.08), 0 16px 32px rgba(0,0,0,.10)',
                'float':   '0 20px 60px -15px rgba(0,0,0,.18)',
                'dialog':  '0 25px 50px -12px rgba(0,0,0,.22)',
                'glow':    '0 0 20px -5px var(--color-primary)',
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
                '4xl': '2rem',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
}
