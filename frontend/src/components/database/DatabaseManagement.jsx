import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

// 简化的Loading组件
const Loading = () => (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
);

// 简化的EmptyState组件
const EmptyState = ({ icon, message, action }) => (
    <div className="text-center py-12">
        <i className={`${icon} text-4xl text-gray-400 mb-4`}></i>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
        {action && action}
    </div>
);

const DatabaseManagement = () => {
    const { isDark } = useTheme();
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [migrating, setMigrating] = useState(false);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/database/tables');
            const data = await response.json();
            if (data.data) {
                setTables(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch tables:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMigrate = async () => {
        setMigrating(true);
        try {
            const response = await fetch('/api/database/migrate', {
                method: 'POST',
            });
            if (response.ok) {
                alert('数据库迁移成功！');
                fetchTables(); // 重新获取表状态
            } else {
                throw new Error('迁移失败');
            }
        } catch (error) {
            alert('数据库迁移失败：' + error.message);
        } finally {
            setMigrating(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:--text-primary-1">
                        🗄️ 数据库管理
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        管理数据库表和迁移 {isDark && '(暗色模式)'}
                    </p>
                </div>
                <button 
                    onClick={handleMigrate} 
                    disabled={migrating}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50  rounded-lg transition-colors duration-200"
                >
                    {migrating ? (
                        <>
                            <span className="animate-spin inline-block mr-2">⟳</span>
                            迁移中...
                        </>
                    ) : (
                        <>
                            <span className="mr-2">🔄</span>
                            执行迁移
                        </>
                    )}
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-colors duration-300">
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
                        <span className="mr-2 text-blue-500">🗄️</span>
                        数据表状态
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        显示所有数据表的当前状态
                    </p>
                </div>

                {tables.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-600">
                        {tables.map((table, index) => (
                            <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <span className={`text-2xl ${table.exists ? '✅' : '❌'}`}>
                                            {table.exists ? '📊' : '📋'}
                                        </span>
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                            {table.table_name}
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {table.entity_name} Entity
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                        table.exists 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                    }`}>
                                        {table.exists ? '✅ 已存在' : '❌ 未创建'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon="🗄️"
                        message="暂无数据表信息"
                        action={
                            <button onClick={fetchTables} className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600  rounded-lg">
                                🔄 刷新状态
                            </button>
                        }
                    />
                )}

                {tables.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                共 {tables.length} 个数据表，
                                {tables.filter(t => t.exists).length} 个已存在，
                                {tables.filter(t => !t.exists).length} 个待创建
                            </div>
                            <button 
                                onClick={fetchTables}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                            >
                                🔄 刷新状态
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 迁移说明 */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start">
                    <span className="text-blue-500 mt-1 mr-3 text-xl">ℹ️</span>
                    <div>
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">迁移说明</h4>
                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>• 执行迁移将创建缺失的数据表</li>
                            <li>• 已存在的表不会被修改</li>
                            <li>• 迁移过程中请勿关闭应用程序</li>
                            <li>• 建议在执行迁移前备份数据库</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabaseManagement;
