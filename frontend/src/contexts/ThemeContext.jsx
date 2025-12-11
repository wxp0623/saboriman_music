import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// 定义所有可用的主题
export const themes = {
  light: {
    name: '明亮',
    icon: '☀️',
    variables: {
      '--bg-primary': '#f9fafb',
      '--bg-secondary': '#ffffff',
      '--bg-glass': 'rgba(255, 255, 255, 0.55)',
      '--text-primary': '#1f2937',
      '--text-secondary': '#6b7280',
      '--border-primary': '#e5e7eb',
      '--border-secondary': '#d1d5db',
      '--accent-primary': '#3b82f6',
      '--accent-secondary': '#1d4ed8',
    },
  },
  dark: {
    name: '暗黑',
    icon: '🌙',
    variables: {
      '--bg-primary': '#111827',
      '--bg-secondary': '#1f2937',
      '--bg-glass': 'rgba(31, 41, 55, 0.45)',
      '--text-primary': '#f9fafb',
      '--text-secondary': '#9ca3af',
      '--border-primary': '#374151',
      '--border-secondary': '#4b5563',
      '--accent-primary': '#60a5fa',
      '--accent-secondary': '#93c5fd',
    },
  },
  synthwave: {
    name: '赛博朋克',
    icon: '🌃',
    variables: {
      '--bg-primary': '#2d1b47',
      '--bg-secondary': '#1f1033',
      '--bg-glass': 'rgba(31, 16, 51, 0.5)',
      '--text-primary': '#f0abfc',
      '--text-secondary': '#a5b4fc',
      '--border-primary': '#4c1d95',
      '--border-secondary': '#5b21b6',
      '--accent-primary': '#f472b6',
      '--accent-secondary': '#ec4899',
    },
  },
  forest: {
    name: '绿野仙踪',
    icon: '🌲',
    variables: {
      '--bg-primary': '#f0fdf4',
      '--bg-secondary': '#dcfce7',
      '--bg-glass': 'rgba(220, 252, 231, 0.6)',
      '--text-primary': '#14532d',
      '--text-secondary': '#166534',
      '--border-primary': '#86efac',
      '--border-secondary': '#4ade80',
      '--accent-primary': '#22c55e',
      '--accent-secondary': '#16a34a',
    },
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // 优先从 localStorage 读取
    const savedTheme = localStorage.getItem('theme');
    return themes[savedTheme] ? savedTheme : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    // 先移除所有主题类
    Object.keys(themes).forEach(themeName => {
      root.classList.remove(themeName);
    });
    // 添加当前主题类
    root.classList.add(theme);
    // 设置 data-theme 属性
    root.setAttribute('data-theme', theme);
    // 将主题变量应用到 style
    const themeVariables = themes[theme].variables;
    for (const key in themeVariables) {
      root.style.setProperty(key, themeVariables[key]);
    }
    // 保存到 localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    availableThemes: themes,
    isDark: theme === 'dark' || theme === 'synthwave', // 兼容旧的 isDark 逻辑
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);