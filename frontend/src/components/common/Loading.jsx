import React, { useState, useEffect } from 'react';

// Loading Component - 遮罩形式（延迟显示避免闪烁）
export const Loading = ({ message = '加载中...', fullScreen = false, delay = 300 }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // 延迟显示 Loading，避免快速请求时的闪烁
        const timer = setTimeout(() => {
            setShow(true);
        }, delay);

        return () => clearTimeout(timer);
    }, [delay]);

    if (!show) return null;

    return (
        <div 
            className={`${fullScreen ? 'fixed' : 'absolute'} inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 animate-fade-in`}
        >
            <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center animate-scale-in">
                <div className="loading-spinner"></div>
                <span className="mt-4 text-gray-700 font-medium">{message}</span>
            </div>
        </div>
    );
};

// Error Message Component
export const ErrorMessage = ({ message, onRetry }) => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
        <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p className="text-gray-600 mb-4">{message}</p>
        {onRetry && (
            <button onClick={onRetry} className="btn-primary">
                <i className="fas fa-redo mr-2"></i>重试
            </button>
        )}
    </div>
);

// Empty State Component
export const EmptyState = ({ icon, message, action }) => (
    <div className="text-center py-12 text-gray-500">
        <i className={`${icon} text-6xl mb-4`}></i>
        <p className="text-lg mb-4">{message}</p>
        {action && action}
    </div>
);

// Confirmation Modal Component
export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "确认", cancelText = "取消" }) => {
    if (!isOpen) return null;
    
    return (
        <div className="modal-overlay animate-fade-in">
            <div className="bg-white rounded-lg p-6 w-full max-w-md animate-scale-in">
                <h3 className="text-lg font-semibold mb-4">{title}</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600  rounded-md hover:bg-red-700 transition-colors"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Pagination Component
export const Pagination = ({ current, total, pageSize, onChange }) => {
    const totalPages = Math.ceil(total / pageSize);
    const startItem = (current - 1) * pageSize + 1;
    const endItem = Math.min(current * pageSize, total);
    
    return (
        <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
                显示第 {startItem} 到 {endItem} 条，共 {total} 条记录
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => onChange(current - 1)}
                    disabled={current <= 1}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                    上一页
                </button>
                <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                    {current} / {totalPages}
                </span>
                <button
                    onClick={() => onChange(current + 1)}
                    disabled={current >= totalPages}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                    下一页
                </button>
            </div>
        </div>
    );
};

// Default export for backward compatibility
export default Loading;
