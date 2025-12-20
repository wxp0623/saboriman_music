/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // 禁用 Tailwind 的暗黑模式，我们用自己的 CSS 变量
  darkMode: 'class', // 使用 class 模式，但我们通过 JS 控制根元素的 class
  theme: {
    extend: {
      // 定义语义化颜色，值为 CSS 变量
      // colors: {
      //   // 背景色系
      //   'bg-primary': 'var(--bg-primary)',
      //   'bg-secondary': 'var(--bg-secondary)',
      //   'bg-tertiary': 'var(--bg-tertiary)',
      //   'bg-hover': 'var(--bg-hover)',
      //   'bg-active': 'var(--bg-active)',
      //   'bg-glass': 'var(--bg-glass)',
        
      //   // 文字色系
      //   'text-primary': 'var(--text-primary)',
      //   'text-secondary': 'var(--text-secondary)',
      //   'text-tertiary': 'var(--text-tertiary)',
      //   'text-disabled': 'var(--text-disabled)',
      //   'text-placeholder': 'var(--text-placeholder)',
        
      //   // 边框色系
      //   'border-primary': 'var(--border-primary)',
      //   'border-secondary': 'var(--border-secondary)',
      //   'border-tertiary': 'var(--border-tertiary)',
      //   'border-hover': 'var(--border-hover)',
      //   'border-focus': 'var(--border-focus)',
        
      //   // 强调色系
      //   'accent-primary': 'var(--accent-primary)',
      //   'accent-secondary': 'var(--accent-secondary)',
      //   'accent-tertiary': 'var(--accent-tertiary)',
      //   'accent-hover': 'var(--accent-hover)',
      //   'accent-active': 'var(--accent-active)',
      // },
      borderRadius: {
        'theme': 'var(--border-radius)',
      },
      boxShadow: {
        'sm-theme': 'var(--shadow-sm)',
        'md-theme': 'var(--shadow-md)',
        'lg-theme': 'var(--shadow-lg)',
      },
      // 保持 LiquidGlass 的 backdrop-filter
      backdropBlur: {
        glass: '24px',
      },
      animation: {
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
      },
    },
  },
  plugins: [],
};
