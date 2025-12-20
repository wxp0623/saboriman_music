import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import LiquidGlass from '../ui/LiquidGlass';
import api from '../../services/api';
import { useUserStore } from "../../utils/store.js";
import { usePlayer } from '../../contexts/PlayerContext';
import { Role } from '../../const/enum.js';

const Header = () => {
  const { theme, setTheme, availableThemes } = useTheme();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [userMenuPosition, setUserMenuPosition] = useState({ top: 0, right: 0 });
  const themeMenuRef = useRef(null);
  const buttonRef = useRef(null);
  const userMenuRef = useRef(null);
  const userButtonRef = useRef(null);
  const navigate = useNavigate();
  const userStore = useUserStore();
  const role = userStore.getRole();
  const { clearPlaylist } = usePlayer();

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 sbrm-rounded-md text-sm font-medium sbrm-transition ${
      isActive
        ? 'sbrm-text-primary sbrm-bg-accent-alpha-20 sbrm-border-accent'
        : 'sbrm-text-primary-1 hover:sbrm-bg-hover hover:sbrm-text-primary'
    }`;

  // 加载用户信息
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // 计算主题菜单位置
  useEffect(() => {
    if (isThemeMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isThemeMenuOpen]);

  // 计算用户菜单位置
  useEffect(() => {
    if (isUserMenuOpen && userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect();
      setUserMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isUserMenuOpen]);

  // 点击外部关闭主题菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsThemeMenuOpen(false);
      }
    };

    if (isThemeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isThemeMenuOpen]);

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const handleThemeChange = (themeKey) => {
    setTheme(themeKey);
    setIsThemeMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      userStore.logout();
      clearPlaylist();
      setUser(null);
      setIsUserMenuOpen(false);
      navigate('/login');
    }
  };

  const getUserAvatar = () => {
    if (user?.avatar) {
      return user.avatar;
    }
    return user?.username?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <>
      <LiquidGlass
        as="header"
        radius={false}
        className="relative z-50 px-4"
      >
        <nav className="sbrm-flex-between">
          {/* 左侧：Logo + 导航菜单 */}
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0 sbrm-transition hover:scale-105">
              <span className="text-xl">🎵</span>
              <span className="font-bold sbrm-text-primary text-lg">Saboriman</span>
            </Link>

            {/* 导航菜单 */}
            <div className="hidden md:flex items-center space-x-2">
              {role === Role.ADMIN &&
                <>
                  <NavLink to="/musics" className={navLinkClass}>音乐管理</NavLink>
                  <NavLink to="/dashboard" className={navLinkClass}>仪表板</NavLink>
                  <NavLink to="/users" className={navLinkClass}>用户管理</NavLink>
                  <NavLink to="/playlists" className={navLinkClass}>播放列表</NavLink>
                  <NavLink to="/database" className={navLinkClass}>数据库</NavLink>
                  <NavLink to="/album" className={navLinkClass}>专辑</NavLink>
                </>
              }
            </div>
          </div>

          {/* 右侧：用户信息 + 主题选择器 */}
          <div className="flex items-center gap-3">
            {/* 用户菜单 */}
            {user && (
              <div className="relative">
                <button
                  ref={userButtonRef}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 sbrm-rounded-lg sbrm-bg-secondary hover:sbrm-bg-hover sbrm-transition group"
                  aria-label="用户菜单"
                >
                  <div className="w-8 h-8 sbrm-rounded-full sbrm-bg-gradient flex items-center justify-center font-semibold text-sm sbrm-shadow-md sbrm-text-on-accent">
                    {typeof getUserAvatar() === 'string' && getUserAvatar().length === 1 ? (
                      getUserAvatar()
                    ) : (
                      <img src={getUserAvatar()} alt="avatar" className="w-full h-full sbrm-rounded-full object-cover" />
                    )}
                  </div>
                  <span className="text-sm font-medium sbrm-text-primary hidden sm:inline max-w-[100px] truncate">
                    {user.username}
                  </span>
                  <i className={`fas fa-chevron-down text-xs sbrm-text-secondary sbrm-transition ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}></i>
                </button>
              </div>
            )}

            {/* 主题选择器 */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 sbrm-rounded-lg sbrm-bg-secondary hover:sbrm-bg-hover sbrm-transition hover:sbrm-border-hover group"
                aria-label="选择主题"
              >
                <span className="text-xl group-hover:scale-110 sbrm-transition">
                  {availableThemes[theme].icon}
                </span>
                <span className="text-sm font-medium sbrm-text-primary hidden sm:inline">
                  {availableThemes[theme].name}
                </span>
                <i className={`fas fa-chevron-down text-xs sbrm-text-secondary sbrm-transition ${
                  isThemeMenuOpen ? 'rotate-180' : ''
                }`}></i>
              </button>
            </div>
          </div>
        </nav>
      </LiquidGlass>

      {/* 主题菜单 Portal */}
      {isThemeMenuOpen && createPortal(
        <div
          ref={themeMenuRef}
          className="fixed w-56 z-[9999]"
          style={{
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
          }}
        >
          <LiquidGlass cornerRadius={12}>
            <div className="py-2 max-h-96 sbrm-scroll-y sbrm-shadow-2xl">
              <div className="px-3 py-2 text-xs font-semibold sbrm-text-secondary uppercase tracking-wider sbrm-border-b sbrm-border-divider">
                选择主题
              </div>
              {Object.entries(availableThemes).map(([key, { name, icon }]) => (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left sbrm-transition hover:sbrm-bg-hover ${
                    theme === key
                      ? 'sbrm-bg-accent-alpha-20 sbrm-text-primary'
                      : 'sbrm-text-primary-1'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <span className="text-sm font-medium flex-1">{name}</span>
                  {theme === key && (
                    <i className="fas fa-check sbrm-text-primary text-sm"></i>
                  )}
                </button>
              ))}
            </div>
          </LiquidGlass>
        </div>,
        document.body
      )}

      {/* 用户菜单 Portal */}
      {isUserMenuOpen && user && createPortal(
        <div
          ref={userMenuRef}
          className="fixed w-56 z-[9999]"
          style={{
            top: `${userMenuPosition.top}px`,
            right: `${userMenuPosition.right}px`,
          }}
        >
          <LiquidGlass>
            <div className="py-2 sbrm-shadow-2xl">
              {/* 用户信息头部 */}
              <div className="px-4 py-3 sbrm-border-b sbrm-border-divider">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sbrm-rounded-full sbrm-bg-gradient flex items-center justify-center font-semibold sbrm-shadow-md sbrm-text-on-accent">
                    {typeof getUserAvatar() === 'string' && getUserAvatar().length === 1 ? (
                      getUserAvatar()
                    ) : (
                      <img src={getUserAvatar()} alt="avatar" className="w-full h-full sbrm-rounded-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold sbrm-text-primary truncate">
                      {user.username}
                    </div>
                    <div className="text-xs sbrm-text-secondary truncate">
                      {user.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* 菜单项 */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left sbrm-transition hover:sbrm-bg-hover sbrm-text-primary"
                >
                  <i className="fas fa-user-circle w-4 text-center sbrm-text-secondary"></i>
                  <span className="text-sm font-medium">个人资料</span>
                </button>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left sbrm-transition hover:sbrm-bg-hover sbrm-text-primary"
                >
                  <i className="fas fa-cog w-4 text-center sbrm-text-secondary"></i>
                  <span className="text-sm font-medium">设置</span>
                </button>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/change-password');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left sbrm-transition hover:sbrm-bg-hover sbrm-text-primary"
                >
                  <i className="fas fa-key w-4 text-center sbrm-text-secondary"></i>
                  <span className="text-sm font-medium">修改密码</span>
                </button>
              </div>

              {/* 分隔线 */}
              <div className="sbrm-divider"></div>

              {/* 退出登录 */}
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left sbrm-transition sbrm-text-error hover:sbrm-bg-error"
                >
                  <i className="fas fa-sign-out-alt w-4 text-center"></i>
                  <span className="text-sm font-medium">退出登录</span>
                </button>
              </div>
            </div>
          </LiquidGlass>
        </div>,
        document.body
      )}
    </>
  );
};

export default Header;