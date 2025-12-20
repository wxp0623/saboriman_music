import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// 定义所有可用的主题
export const themes = {
  light: {
    name: '书香古色',
    icon: '☀️',
  },
  dark: {
    name: '暗夜幽光',
    icon: '🌙',
  },
  synthwave: {
    name: '文艺复古',
    icon: '🌃',
  },
  forest: {
    name: '绿野仙踪',
    icon: '🌲',
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
    
    // 移除所有主题类
    Object.keys(themes).forEach(themeName => {
      root.classList.remove(themeName);
    });
    
    // 添加当前主题类
    root.classList.add(theme);
    
    // 设置 data-theme 属性（可选，方便调试）
    root.setAttribute('data-theme', theme);
    
    // 保存到 localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    availableThemes: themes,
    currentThemeName: themes[theme]?.name,
    currentThemeIcon: themes[theme]?.icon,
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};