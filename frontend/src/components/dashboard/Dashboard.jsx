import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import LiquidGlass from '../ui/LiquidGlass';

const Dashboard = () => {
    const { isDark } = useTheme();
    const [stats, setStats] = useState({
        users: 0,
        musics: 0,
        playlists: 0,
        tables: 0
    });

    useEffect(() => {
        // 从API获取统计数据
        const fetchStats = async () => {
            try {
                setStats({
                    users: 12,
                    musics: 45,
                    playlists: 8,
                    tables: 4
                });
            } catch (error) {
                console.error('获取统计数据失败:', error);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        {
            title: '用户总数',
            value: stats.users,
            icon: '👥',
            color: 'bg-blue-500',
            link: '/users'
        },
        {
            title: '音乐总数',
            value: stats.musics,
            icon: '🎵',
            color: 'bg-green-500',
            link: '/musics'
        },
        {
            title: '播放列表',
            value: stats.playlists,
            icon: '📋',
            color: 'bg-purple-500',
            link: '/playlists'
        },
        {
            title: '数据表',
            value: stats.tables,
            icon: '🗄️',
            color: 'bg-orange-500',
            link: '/database'
        }
    ];

    const quickActions = [
        {
            label: '添加新用户',
            path: '/users',
            color: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
        },
        {
            label: '上传音乐',
            path: '/musics',
            color: 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
        },
        {
            label: '创建播放列表',
            path: '/playlists',
            color: 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700'
        },
        {
            label: '管理数据库',
            path: '/database',
            color: 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700'
        }
    ];

    return (
        <div className="min-h-screen p-6  from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
            <LiquidGlass className="p-6 mb-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold text-gray-800 dark:--text-primary-1">
                        📊 仪表板
                    </h2>
                    <div className="text-sm text-gray-600 dark:text-gray-400 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                        当前主题: {isDark ? '🌙 暗色' : '☀️ 明亮'}
                    </div>
                </div>
            </LiquidGlass>
            
            {/* 统计卡片 - 使用背景自适应玻璃效果 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {cards.map((card, index) => (
                    <Link key={index} to={card.link}>
                        <LiquidGlass 
                            className="p-6 hover:scale-105 transition-transform duration-200"
                        >
                            <div className="flex items-center">
                                <div className={`${card.color}  rounded-full p-3 mr-4 shadow-lg`}>
                                    <span className="text-2xl">{card.icon}</span>
                                </div>
                                <div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">{card.title}</p>
                                    <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{card.value}</p>
                                </div>
                            </div>
                        </LiquidGlass>
                    </Link>
                ))}
            </div>

            {/* 快速操作 - 使用强化玻璃效果 */}
            <LiquidGlass 
                className="p-8 mb-8"
            >
                <h3 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
                    🚀 快速操作
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quickActions.map((action, index) => (
                        <Link
                            key={index}
                            to={action.path}
                            className={`${action.color}  px-6 py-4 rounded-lg transition-all duration-200 text-center block font-medium shadow-lg hover:shadow-xl hover:scale-105`}
                        >
                            {action.label}
                        </Link>
                    ))}
                </div>
            </LiquidGlass>

            {/* 展示不同强度的背景自适应玻璃效果 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <LiquidGlass
                    className="p-6"
                >
                    <div className="text-center">
                        <div className="text-4xl mb-3">🌈</div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2 text-lg">
                            动态适应玻璃
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            根据背景自动调整效果
                        </p>
                    </div>
                </LiquidGlass>

                <LiquidGlass
                    className="p-6"
                >
                    <div className="text-center">
                        <div className="text-4xl mb-3">✨</div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2 text-lg">
                            智能模糊
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            智能调节模糊强度
                        </p>
                    </div>
                </LiquidGlass>

                <LiquidGlass
                    className="p-6"
                >
                    <div className="text-center">
                        <div className="text-4xl mb-3">🎨</div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2 text-lg">
                            色彩跟随
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            颜色随背景变化
                        </p>
                    </div>
                </LiquidGlass>
            </div>
        </div>
    );
};

export default Dashboard;
