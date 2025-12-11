import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 用户状态 Store
export const useUserStore = create(
  persist(
    (set, get) => ({
      // 状态
      user: null,
      token: null,
      isAuthenticated: false,

      // 设置用户信息
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      // 设置 Token
      setToken: (token) => {
        set({ token, isAuthenticated: !!token });
        if (token) {
          localStorage.setItem('token', token);
        } else {
          localStorage.removeItem('token');
        }
      },

      // 登录
      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      },

      // 登出
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },

      // 更新用户信息
      updateUser: (updates) => {
        const newUser = { ...get().user, ...updates };
        set({ user: newUser });
        localStorage.setItem('user', JSON.stringify(newUser));
      },

      // 获取用户角色
      getRole: () => {
        return get().user?.role || 'guest';
      },

      // 检查是否为管理员
      isAdmin: () => {
        return get().user?.role === 'admin';
      },

      // 检查是否已登录
      checkAuth: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ user, token, isAuthenticated: true });
            return true;
          } catch (error) {
            console.error('Failed to parse user data:', error);
            get().logout();
            return false;
          }
        }
        return false;
      },
    }),
    {
      name: 'user-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);