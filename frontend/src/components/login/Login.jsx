import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LiquidGlass from '../ui/LiquidGlass.jsx';
import api from '../../services/api.js';
import { useUserStore } from "../../utils/store.js";

const Login = () => {
    const [isLogin, setIsLogin] = useState(true); // true: 登录, false: 注册
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const userStore = useUserStore();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(''); // 清除错误提示
    };

    const validateForm = () => {
        if (!formData.username) {
            setError('请输入用户名');
            return false;
        }

        if (!isLogin && !formData.email) {
            setError('请输入邮箱');
            return false;
        }

        if (!isLogin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('请输入有效的邮箱地址');
            return false;
        }

        if (!formData.password) {
            setError('请输入密码');
            return false;
        }

        if (formData.password.length < 6) {
            setError('密码至少需要6个字符');
            return false;
        }

        if (!isLogin && formData.password !== formData.confirmPassword) {
            setError('两次输入的密码不一致');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            let response;
            if (isLogin) {
                // 登录
                response = await api.auth.login({
                    username: formData.username,
                    password: formData.password
                });
            } else {
                // 注册
                response = await api.auth.register({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                });
            }

            if (response.data) {
                // 保存 token
                userStore.login(response.data.user, response.data.token);
                
                // 跳转到首页
                navigate('/');
            } else {
                setError(response.message || '操作失败，请重试');
            }
        } catch (err) {
            setError(err.message || '网络错误，请稍后重试');
            console.error('Auth error:', err);
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setFormData({
            username: '',
            email: '',
            password: '',
            confirmPassword: ''
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative">
            {/* 背景图片层 */}
            <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: "url(http://192.168.1.193:5244/d/8.jpg?sign=Nd4oGycnzi-Qw9avgWnkL9C5e981IDlx8AGppL9xbcI=:0)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
                zIndex: -2
            }}></div>
            
            {/* 暗色遮罩层 */}
            <div className="fixed inset-0 sbrm-bg-overlay backdrop-blur-sm" style={{ zIndex: -1 }}></div>

            {/* 背景装饰动画 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 sbrm-bg-accent-alpha-10 sbrm-rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 sbrm-bg-accent-alpha-10 sbrm-rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative w-full max-w-md z-10">
                <LiquidGlass cornerRadius={24}>
                    <div className="p-8">
                        {/* Logo 和标题 */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 sbrm-bg-gradient sbrm-rounded-full mb-4 sbrm-shadow-2xl">
                                <i className="fas fa-music sbrm-text-on-accent text-3xl"></i>
                            </div>
                            <h1 className="text-3xl font-bold sbrm-text-primary mb-2">
                                Saboriman Music
                            </h1>
                            <p className="sbrm-text-secondary text-sm">
                                {isLogin ? '欢迎回来，继续你的音乐之旅' : '加入我们，开启音乐之旅'}
                            </p>
                        </div>

                        {/* 错误提示 */}
                        {error && (
                            <div className="mb-6 p-4 sbrm-bg-error sbrm-border sbrm-border-error sbrm-rounded-lg backdrop-blur-sm">
                                <div className="flex items-center gap-2 sbrm-text-error">
                                    <i className="fas fa-exclamation-circle"></i>
                                    <span className="text-sm">{error}</span>
                                </div>
                            </div>
                        )}

                        {/* 表单 */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* 用户名 */}
                            <div>
                                <label className="block text-sm font-medium sbrm-text-primary mb-2">
                                    <i className="fas fa-user mr-2 sbrm-text-accent-primary"></i>
                                    用户名
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 sbrm-bg-secondary sbrm-border sbrm-border-primary sbrm-rounded-lg sbrm-text-primary placeholder:sbrm-text-tertiary focus:outline-none focus:ring-2 focus:sbrm-ring-accent-alpha-20 focus:sbrm-border-accent-primary sbrm-transition backdrop-blur-sm"
                                    placeholder="请输入用户名"
                                    autoComplete="username"
                                />
                            </div>

                            {/* 邮箱（仅注册时显示） */}
                            {!isLogin && (
                                <div>
                                    <label className="block text-sm font-medium sbrm-text-primary mb-2">
                                        <i className="fas fa-envelope mr-2 sbrm-text-accent-primary"></i>
                                        邮箱
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 sbrm-bg-secondary sbrm-border sbrm-border-primary sbrm-rounded-lg sbrm-text-primary placeholder:sbrm-text-tertiary focus:outline-none focus:ring-2 focus:sbrm-ring-accent-alpha-20 focus:sbrm-border-accent-primary sbrm-transition backdrop-blur-sm"
                                        placeholder="请输入邮箱地址"
                                        autoComplete="email"
                                    />
                                </div>
                            )}

                            {/* 密码 */}
                            <div>
                                <label className="block text-sm font-medium sbrm-text-primary mb-2">
                                    <i className="fas fa-lock mr-2 sbrm-text-accent-primary"></i>
                                    密码
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 sbrm-bg-secondary sbrm-border sbrm-border-primary sbrm-rounded-lg sbrm-text-primary placeholder:sbrm-text-tertiary focus:outline-none focus:ring-2 focus:sbrm-ring-accent-alpha-20 focus:sbrm-border-accent-primary sbrm-transition backdrop-blur-sm"
                                    placeholder="请输入密码"
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                />
                            </div>

                            {/* 确认密码（仅注册时显示） */}
                            {!isLogin && (
                                <div>
                                    <label className="block text-sm font-medium sbrm-text-primary mb-2">
                                        <i className="fas fa-lock mr-2 sbrm-text-accent-primary"></i>
                                        确认密码
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 sbrm-bg-secondary sbrm-border sbrm-border-primary sbrm-rounded-lg sbrm-text-primary placeholder:sbrm-text-tertiary focus:outline-none focus:ring-2 focus:sbrm-ring-accent-alpha-20 focus:sbrm-border-accent-primary sbrm-transition backdrop-blur-sm"
                                        placeholder="请再次输入密码"
                                        autoComplete="new-password"
                                    />
                                </div>
                            )}

                            {/* 登录时的额外选项 */}
                            {isLogin && (
                                <div className="flex items-center justify-between text-sm">
                                    <label className="flex items-center sbrm-text-secondary cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 sbrm-rounded sbrm-border-primary sbrm-text-accent-primary focus:sbrm-ring-accent-primary focus:ring-offset-0 sbrm-bg-secondary"
                                        />
                                        <span className="ml-2">记住我</span>
                                    </label>
                                    <a href="#" className="sbrm-text-accent-primary hover:sbrm-text-accent-hover sbrm-transition">
                                        忘记密码？
                                    </a>
                                </div>
                            )}

                            {/* 提交按钮 */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 sbrm-bg-gradient sbrm-text-on-accent font-semibold sbrm-rounded-lg hover:sbrm-opacity-90 focus:outline-none focus:ring-2 focus:sbrm-ring-accent-primary focus:ring-offset-2 focus:sbrm-ring-offset-primary sbrm-transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none sbrm-shadow-lg"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <i className="fas fa-spinner fa-spin"></i>
                                        <span>处理中...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <i className={`fas ${isLogin ? 'fa-sign-in-alt' : 'fa-user-plus'}`}></i>
                                        <span>{isLogin ? '登录' : '注册'}</span>
                                    </div>
                                )}
                            </button>
                        </form>

                        {/* 切换登录/注册 */}
                        <div className="mt-6 text-center">
                            <p className="sbrm-text-secondary text-sm">
                                {isLogin ? '还没有账号？' : '已有账号？'}
                                <button
                                    onClick={switchMode}
                                    className="ml-2 sbrm-text-accent-primary hover:sbrm-text-accent-hover font-semibold sbrm-transition"
                                >
                                    {isLogin ? '立即注册' : '立即登录'}
                                </button>
                            </p>
                        </div>

                        {/* 分隔线 */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full sbrm-border-t sbrm-border-divider"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 sbrm-bg-secondary sbrm-text-tertiary backdrop-blur-sm">
                                    或使用第三方登录
                                </span>
                            </div>
                        </div>

                        {/* 第三方登录 */}
                        <div className="grid grid-cols-3 gap-3">
                            <button className="flex items-center justify-center py-3 px-4 sbrm-bg-secondary hover:sbrm-bg-hover sbrm-border sbrm-border-primary sbrm-rounded-lg sbrm-transition sbrm-text-primary">
                                <i className="fab fa-github text-xl"></i>
                            </button>
                            <button className="flex items-center justify-center py-3 px-4 sbrm-bg-secondary hover:sbrm-bg-hover sbrm-border sbrm-border-primary sbrm-rounded-lg sbrm-transition sbrm-text-primary">
                                <i className="fab fa-google text-xl"></i>
                            </button>
                            <button className="flex items-center justify-center py-3 px-4 sbrm-bg-secondary hover:sbrm-bg-hover sbrm-border sbrm-border-primary sbrm-rounded-lg sbrm-transition sbrm-text-primary">
                                <i className="fab fa-weixin text-xl"></i>
                            </button>
                        </div>
                    </div>
                </LiquidGlass>

                {/* 底部版权信息 */}
                <div className="mt-8 text-center sbrm-text-tertiary text-sm">
                    <p>© 2024 Saboriman Music. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;