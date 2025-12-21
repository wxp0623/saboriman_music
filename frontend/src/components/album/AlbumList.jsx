import React, { useState, useEffect } from 'react';
import LiquidGlass from '../ui/LiquidGlass.jsx';
import api from '../../services/api.js';
import { useNavigate } from 'react-router-dom';
import { getFullUrl } from '../../services/fileUtil.js';

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
                            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 sbrm-text-tertiary"></i>
                            <input
                                type="text"
                                placeholder="搜索专辑名称或艺术家..."
                                value={searchQuery}
                                onChange={handleSearch}
                                className="w-96 pl-12 pr-4 py-3 sbrm-bg-secondary sbrm-border sbrm-border-primary sbrm-rounded-lg sbrm-text-primary placeholder:sbrm-text-tertiary focus:outline-none focus:ring-2 focus:sbrm-ring-accent-alpha-20 focus:sbrm-border-accent-primary sbrm-transition"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 专辑网格 */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin sbrm-rounded-full h-12 w-12 border-3 sbrm-border-accent-primary border-t-transparent"></div>
                </div>
            ) : albums.length === 0 ? (
                <LiquidGlass>
                    <div className="text-center py-20">
                        <i className="fas fa-compact-disc text-6xl sbrm-text-tertiary mb-4"></i>
                        <p className="sbrm-text-secondary text-lg">暂无专辑数据</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="mt-4 sbrm-text-accent-primary hover:sbrm-text-accent-hover sbrm-transition"
                        >
                            创建第一个专辑
                        </button>
                    </div>
                </LiquidGlass>
            ) : (
                <>
                    <div className='h-[calc(100vh-265px)] overflow-auto sbrm-scroll-y pb-4'>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {albums.map((album) => (
                                <LiquidGlass key={album.id} radius={12}>
                                    <div className="overflow-hidden cursor-pointer group">
                                        {/* 专辑封面 */}
                                        <div
                                            className="aspect-square sbrm-bg-gradient flex items-center justify-center relative overflow-hidden"
                                            onClick={() => handleViewDetails(album)}
                                        >
                                            {album.coverUrl ? (
                                                <img
                                                    src={getFullUrl(album.coverUrl)}
                                                    alt={album.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 sbrm-transition-all duration-500"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <i className="fas fa-compact-disc text-5xl sbrm-text-on-accent"></i>
                                            )}
                                            {/* 悬停遮罩 */}
                                            <div className="absolute inset-0 sbrm-bg-overlay opacity-0 group-hover:opacity-100 sbrm-transition-all duration-300 flex items-center justify-center">
                                                <button className="w-16 h-16 sbrm-rounded-full sbrm-bg-primary sbrm-text-accent-primary p-3 hover:scale-110 sbrm-transition sbrm-shadow-xl">
                                                    <i className="fas fa-play text-lg"></i>
                                                </button>
                                            </div>
                                        </div>

                                        {/* 专辑信息 */}
                                        <div className="p-3">
                                            <h3 className="font-semibold sbrm-text-primary truncate text-base mb-1">
                                                {album.name || '未知专辑'}
                                            </h3>
                                            <p className="sbrm-text-primary-1 text-sm truncate mb-1.5">
                                                <i className="fas fa-user mr-1 sbrm-text-tertiary"></i>
                                                {album.artistName || '未知艺术家'}
                                            </p>
                                            {album.releaseDate && (
                                                <p className="sbrm-text-secondary text-sm mb-3">
                                                    <i className="fas fa-calendar mr-1 sbrm-text-tertiary"></i>
                                                    {new Date(album.releaseDate).getFullYear()}
                                                </p>
                                            )}

                                            {/* 操作按钮 */}
                                            <div className="flex justify-between items-center pt-3">
                                                <div className="flex space-x-2.5">
                                                    {/* 可选：添加编辑和删除按钮 */}
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
                            className="px-4 py-2 sbrm-bg-secondary sbrm-text-primary sbrm-rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:sbrm-bg-hover sbrm-transition sbrm-border sbrm-border-primary"
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>

                        <span className="sbrm-text-primary px-4">
                            第 {page} 页 / 共 {totalPages} 页
                        </span>

                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 sbrm-bg-secondary sbrm-text-primary sbrm-rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:sbrm-bg-hover sbrm-transition sbrm-border sbrm-border-primary"
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </LiquidGlass>
            )}

            {/* 新增/编辑模态框 */}
            {showModal && (
                <div className="fixed inset-0 sbrm-bg-overlay backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <LiquidGlass>
                        <div className="sbrm-bg-glass sbrm-rounded-2xl p-6 max-w-md w-full sbrm-border sbrm-border-tertiary">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold sbrm-text-primary">
                                    {editingAlbum ? '编辑专辑' : '新增专辑'}
                                </h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="sbrm-text-primary-1 hover:sbrm-text-primary text-2xl sbrm-transition"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block sbrm-text-primary mb-2">
                                        专辑名称 <span className="sbrm-text-error">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 sbrm-bg-secondary sbrm-border sbrm-border-primary sbrm-rounded-lg sbrm-text-primary placeholder:sbrm-text-tertiary focus:outline-none focus:ring-2 focus:sbrm-ring-accent-alpha-20 focus:sbrm-border-accent-primary sbrm-transition"
                                        placeholder="请输入专辑名称"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block sbrm-text-primary mb-2">艺术家</label>
                                    <input
                                        type="text"
                                        value={formData.artistName}
                                        onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                                        className="w-full px-4 py-2 sbrm-bg-secondary sbrm-border sbrm-border-primary sbrm-rounded-lg sbrm-text-primary placeholder:sbrm-text-tertiary focus:outline-none focus:ring-2 focus:sbrm-ring-accent-alpha-20 focus:sbrm-border-accent-primary sbrm-transition"
                                        placeholder="请输入艺术家名称"
                                    />
                                </div>

                                <div>
                                    <label className="block sbrm-text-primary mb-2">封面 URL</label>
                                    <input
                                        type="url"
                                        value={formData.coverUrl}
                                        onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                                        className="w-full px-4 py-2 sbrm-bg-secondary sbrm-border sbrm-border-primary sbrm-rounded-lg sbrm-text-primary placeholder:sbrm-text-tertiary focus:outline-none focus:ring-2 focus:sbrm-ring-accent-alpha-20 focus:sbrm-border-accent-primary sbrm-transition"
                                        placeholder="https://example.com/cover.jpg"
                                    />
                                </div>

                                <div>
                                    <label className="block sbrm-text-primary mb-2">发行日期</label>
                                    <input
                                        type="date"
                                        value={formData.releaseDate}
                                        onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                                        className="w-full px-4 py-2 sbrm-bg-secondary sbrm-border sbrm-border-primary sbrm-rounded-lg sbrm-text-primary focus:outline-none focus:ring-2 focus:sbrm-ring-accent-alpha-20 focus:sbrm-border-accent-primary sbrm-transition"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-2 sbrm-bg-secondary sbrm-text-primary sbrm-rounded-lg hover:sbrm-bg-hover sbrm-transition sbrm-border sbrm-border-primary"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 sbrm-bg-gradient sbrm-text-on-accent sbrm-rounded-lg hover:sbrm-opacity-90 sbrm-transition sbrm-shadow-md"
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