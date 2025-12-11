import React, { useState, useEffect } from 'react';
import LiquidGlass from '../ui/LiquidGlass.jsx';
import api from '../../services/api.js';
import { useNavigate } from 'react-router-dom';

const AlbumManagement = ({onChange}) => {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20); // 增加每页显示数量
    const [total, setTotal] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingAlbum, setEditingAlbum] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        artistName: '',
        coverUrl: '',
        releaseDate: ''
    });
    const navigate = useNavigate();

    // 环境配置
    const apiBaseUrl = 'http://localhost:8180';

    // 获取完整的图片 URL
    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        return `${apiBaseUrl}${path}`;
    };

    // 获取专辑列表
    const fetchAlbums = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                page_size: pageSize,
            };
            if (searchQuery) {
                params.q = searchQuery;
            }

            const response = await api.albums.list(params);
            if (!response.error) {
                setAlbums(response.data.data || []);
                setTotal(response.data.total || 0);
            }
        } catch (error) {
            console.error('获取专辑列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlbums();
    }, [page, searchQuery]);

    // 处理搜索
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
    };

    // 打开新增/编辑模态框
    const handleOpenModal = (album = null) => {
        if (album) {
            setEditingAlbum(album);
            setFormData({
                name: album.name || '',
                artistName: album.artistName || '',
                coverUrl: album.coverUrl || '',
                releaseDate: album.releaseDate ? album.releaseDate.split('T')[0] : ''
            });
        } else {
            setEditingAlbum(null);
            setFormData({
                name: '',
                artistName: '',
                coverUrl: '',
                releaseDate: ''
            });
        }
        setShowModal(true);
    };

    // 关闭模态框
    const handleCloseModal = () => {
        setShowModal(false);
        setEditingAlbum(null);
        setFormData({
            name: '',
            artistName: '',
            coverUrl: '',
            releaseDate: ''
        });
    };

    // 处理表单提交
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('请输入专辑名称');
            return;
        }

        try {
            const submitData = {
                name: formData.name,
                artistName: formData.artistName,
                coverUrl: formData.coverUrl,
                releaseDate: formData.releaseDate ? new Date(formData.releaseDate).toISOString() : null
            };

            if (editingAlbum) {
                await api.albums.update(editingAlbum.id, submitData);
                alert('专辑更新成功');
            } else {
                await api.albums.create(submitData);
                alert('专辑创建成功');
            }

            handleCloseModal();
            fetchAlbums();
        } catch (error) {
            console.error('保存专辑失败:', error);
            alert('保存专辑失败');
        }
    };

    // 删除专辑
    const handleDelete = async (album) => {
        if (!confirm(`确定要删除专辑"${album.name}"吗？`)) {
            return;
        }

        try {
            await api.albums.delete(album.id);
            alert('专辑删除成功');
            fetchAlbums();
        } catch (error) {
            console.error('删除专辑失败:', error);
            alert('删除专辑失败');
        }
    };

    // 查看专辑详情
    const handleViewDetails = (album) => {
        // TODO: 跳转到专辑详情页
        //console.log('查看专辑详情:', album);
        //navigate('/musics?albumId=' + album.id);
        onChange(album);
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div>
            {/* 页面标题和操作栏 */}
            <div className="flex justify-end items-center">
                <div className='justify-end mr-1'>
                    {/* 搜索栏 */}
                    <div className="py-4">
                        <div className="relative">
                            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <input
                                type="text"
                                placeholder="搜索专辑名称或艺术家..."
                                value={searchQuery}
                                onChange={handleSearch}
                                className="w-96 pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 专辑网格 - 调大 50% */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
            ) : albums.length === 0 ? (
                <LiquidGlass>
                    <div className="text-center py-20">
                        <i className="fas fa-compact-disc text-6xl text-gray-600 mb-4"></i>
                        <p className="text-gray-400 text-lg">暂无专辑数据</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="mt-4 text-purple-400 hover:text-purple-300"
                        >
                            创建第一个专辑
                        </button>
                    </div>
                </LiquidGlass>
            ) : (
                <>
                    <div className='h-[calc(100vh-265px)] overflow-auto'>
                        {/* 调整网格列数：从 8/6/4/2 减少到 5/4/3/2 */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {albums.map((album) => (
                                <LiquidGlass key={album.id} radius={12}>
                                    <div className="overflow-hidden cursor-pointer group">
                                        {/* 专辑封面 */}
                                        <div
                                            className="aspect-square bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center relative overflow-hidden"
                                            onClick={() => handleViewDetails(album)}
                                        >
                                            {album.coverUrl ? (
                                                <img
                                                    src={getImageUrl(album.coverUrl)}
                                                    alt={album.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <i className="fas fa-compact-disc text-5xl text-white"></i>
                                            )}
                                            {/* 悬停遮罩 */}
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <button className="w-16 h-16 rounded-full bg-white text-purple-600 p-3 hover:scale-110 transition-transform">
                                                    <i className="fas fa-play text-lg"></i>
                                                </button>
                                            </div>
                                        </div>

                                        {/* 专辑信息 - 调大字体和间距 */}
                                        <div className="p-3">
                                            <h3 className="font-semibold text-white truncate text-base mb-1">
                                                {album.name || '未知专辑'}
                                            </h3>
                                            <p className="text-gray-300 text-sm truncate mb-1.5">
                                                <i className="fas fa-user mr-1"></i>
                                                {album.artistName || '未知艺术家'}
                                            </p>
                                            {album.releaseDate && (
                                                <p className="text-gray-400 text-sm mb-3">
                                                    <i className="fas fa-calendar mr-1"></i>
                                                    {new Date(album.releaseDate).getFullYear()}
                                                </p>
                                            )}

                                            {/* 操作按钮 - 调大 */}
                                            {/* <div className="flex justify-between items-center pt-3 border-t border-gray-600"> */}
                                            <div className="flex justify-between items-center pt-3">
                                                {/* <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetails(album);
                                                    }}
                                                    className="text-purple-400 hover:text-purple-300 transition-colors"
                                                    title="查看详情"
                                                >
                                                    <i className="fas fa-eye text-base"></i>
                                                </button> */}
                                                <div className="flex space-x-2.5">
                                                    {/* <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenModal(album);
                                                        }}
                                                        className="text-blue-400 hover:text-blue-300 transition-colors"
                                                        title="编辑"
                                                    >
                                                        <i className="fas fa-edit text-base"></i>
                                                    </button> */}
                                                    {/* <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(album);
                                                        }}
                                                        className="text-red-400 hover:text-red-300 transition-colors"
                                                        title="删除"
                                                    >
                                                        <i className="fas fa-trash text-base"></i>
                                                    </button> */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </LiquidGlass>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* 分页 */}
            {totalPages > 1 && (
                <LiquidGlass>
                    <div className="flex justify-center items-center gap-2 p-4">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>

                        <span className="text-white px-4">
                            第 {page} 页 / 共 {totalPages} 页
                        </span>

                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </LiquidGlass>
            )}

            {/* 新增/编辑模态框 */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <LiquidGlass>
                        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {editingAlbum ? '编辑专辑' : '新增专辑'}
                                </h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-white text-2xl"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-gray-300 mb-2">
                                        专辑名称 <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="请输入专辑名称"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-300 mb-2">艺术家</label>
                                    <input
                                        type="text"
                                        value={formData.artistName}
                                        onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="请输入艺术家名称"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-300 mb-2">封面 URL</label>
                                    <input
                                        type="url"
                                        value={formData.coverUrl}
                                        onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="https://example.com/cover.jpg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-300 mb-2">发行日期</label>
                                    <input
                                        type="date"
                                        value={formData.releaseDate}
                                        onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                                    >
                                        {editingAlbum ? '更新' : '创建'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </LiquidGlass>
                </div>
            )}
        </div>
    );
};

export default AlbumManagement;