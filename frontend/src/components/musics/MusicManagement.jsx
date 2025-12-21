import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api.js';
import { Loading, EmptyState, ConfirmModal } from '../common/Loading.jsx';
import MusicCards from './MusicCards.jsx';
import MusicList from './MusicList.jsx';
import AlbumManagement from '../album/AlbumManagement.jsx';
import LiquidGlass from '../ui/LiquidGlass.jsx';
import { useSearchParams } from 'react-router-dom';
import AlbumList from "../album/AlbumList.jsx";

/**
 * 视图模式枚举
 * @enum {number}
 */
const ViewMode = {
    LIST: 1,           // 列表视图
    CARD: 2,           // 卡片视图
    ALBUM_CARDS: 3,    // 专辑卡片视图
    ALBUM_INFO: 4      // 专辑详情视图
};

/**
 * 筛选类型枚举
 * @enum {string}
 */
const FilterType = {
    ALL: 'all',        // 全部音乐
    LIKED: 'liked',    // 我喜欢的
    RECENT: 'recent'   // 最近播放
};

/**
 * 音乐管理主组件
 * 提供音乐列表展示、筛选、删除等功能
 */
const MusicManagement = () => {
    // ==================== 状态管理 ====================
    
    /** @type {Array} 音乐列表数据 */
    const [musics, setMusics] = useState([]);
    
    /** @type {Object} 当前专辑信息 */
    const [album, setAlbum] = useState({});
    
    /** @type {boolean} 加载状态 */
    const [loading, setLoading] = useState(true);
    
    /** @type {boolean} 是否显示编辑模态框 */
    const [showModal, setShowModal] = useState(false);
    
    /** @type {Object|null} 正在编辑的音乐 */
    const [editingMusic, setEditingMusic] = useState(null);
    
    /** @type {boolean} 是否显示删除确认框 */
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    
    /** @type {Object|null} 待删除的音乐 */
    const [musicToDelete, setMusicToDelete] = useState(null);
    
    /** @type {number} 当前视图模式 */
    const [viewMode, setViewMode] = useState(ViewMode.LIST);
    
    const [albumId, setAlbumId] = useState(null);

    // ==================== 筛选状态 ====================
    
    /** @type {string} 当前筛选类型 */
    const [filterType, setFilterType] = useState(FilterType.ALL);
    
    /** @type {string} 当前选中的流派 */
    const [selectedGenre, setSelectedGenre] = useState('all');

    /** @type {URLSearchParams} URL 搜索参数 */
    const [searchParams] = useSearchParams();

    // ==================== 副作用 ====================
    
    /**
     * 监听筛选类型变化，重新获取音乐列表
     */
    useEffect(() => {
        fetchMusics();
    }, [filterType, searchParams]);

    // ==================== 数据获取 ====================
    
    /**
     * 获取专辑详情
     * @param {string} albumId - 专辑 ID
     */
    const fetchAlbums = async (albumId) => {
        try {
            const response = await api.albums.get(albumId);

            if (!response.error && response.data) {
                setAlbum(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch album:', error);
        }
    };

    /**
     * 获取音乐列表
     * 根据筛选条件和 URL 参数获取不同的音乐数据
     */
    const fetchMusics = async () => {
        setLoading(true);
        try {
            // 构建请求参数
            const params = { page: 1, page_size: 100 };

            // 根据筛选类型设置不同的参数和视图模式
            if (filterType === FilterType.LIKED) {
                // 我喜欢的音乐：设置 favorited 参数，使用列表视图
                params.favorited = true;

                setViewMode(ViewMode.ALBUM_INFO);
                setAlbum({name: '我喜欢的音乐', artistName: '多位艺术家'});
            } else if (filterType === FilterType.ALBUM_CARDS) {
                // 专辑卡片视图
                setViewMode(ViewMode.ALBUM_CARDS);
            } else if (albumId) {
                // 专辑详情：根据 albumId 获取专辑下的音乐
                params.albumId = albumId;
                fetchAlbums(albumId);
                setViewMode(ViewMode.ALBUM_INFO);
            } else {
                // 全部音乐：清空专辑信息，使用列表视图
                setAlbum({name: '全部音乐', artistName: '多位艺术家'});
                setViewMode(ViewMode.ALBUM_INFO);
            }

            // 请求音乐列表
            const response = await api.musics.list(params);

            if (response.data) {
                setMusics(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch musics:', error);
        } finally {
            setLoading(false);
        }
    };

    // ==================== 计算属性 ====================
    
    /**
     * 获取所有流派列表（去重并排序）
     * @returns {Array<string>} 流派列表
     */
    const genres = useMemo(() => {
        const genreSet = new Set();
        musics.forEach(music => {
            if (music.genre && music.genre !== 'Unknown') {
                genreSet.add(music.genre);
            }
        });
        return Array.from(genreSet).sort();
    }, [musics]);

    /**
     * 筛选后的音乐列表
     * 根据选中的流派进行筛选
     * @returns {Array} 筛选后的音乐列表
     */
    const filteredMusics = useMemo(() => {
        let result = [...musics];

        // 按流派筛选
        if (selectedGenre !== 'all') {
            result = result.filter(music => music.genre === selectedGenre);
        }

        return result;
    }, [musics, selectedGenre]);

    /**
     * 统计信息
     * 计算总曲目数、总时长等
     * @returns {Object} 统计信息对象
     */
    const stats = useMemo(() => {
        const totalDuration = filteredMusics.reduce((acc, m) => acc + (m.duration || 0), 0);
        return {
            count: filteredMusics.length,           // 总曲目数
            duration: Math.floor(totalDuration / 60), // 总分钟数
            hours: Math.floor(totalDuration / 3600)   // 总小时数
        };
    }, [filteredMusics]);

    // ==================== 事件处理 ====================
    
    /**
     * 点赞音乐
     * @param {string} musicId - 音乐 ID
     */
    const handleLike = async (musicId) => {
        try {
            await api.musics.like(musicId);
            // 更新本地状态，增加点赞数
            setMusics(prev => prev.map(music =>
                music.id === musicId
                    ? { ...music, likeCount: (music.likeCount || 0) + 1 }
                    : music
            ));
        } catch (error) {
            console.error('Failed to like music:', error);
        }
    };

    /**
     * 删除音乐（显示确认框）
     * @param {Object} music - 音乐对象
     */
    const handleDelete = (music) => {
        setMusicToDelete(music);
        setShowConfirmDelete(true);
    };

    /**
     * 确认删除音乐
     * 删除成功后重新获取音乐列表
     */
    const confirmDelete = async () => {
        if (!musicToDelete) return;

        try {
            await api.musics.delete(musicToDelete.id);
            setShowConfirmDelete(false);
            setMusicToDelete(null);
            fetchMusics(); // 重新获取列表
        } catch (error) {
            alert('删除失败：' + error.message);
        }
    };

    /**
     * 切换筛选类型
     * @param {string} type - 筛选类型（FilterType 枚举值）
     */
    const handleFilterChange = (type) => {
        setFilterType(type);
    };

    /**
     * 切换流派筛选
     * @param {string} genre - 流派名称或 'all'
     */
    const handleGenreChange = (genre) => {
        setSelectedGenre(genre);
    };

    const onAlbumChange = (album) => {
        setAlbumId(album.id);
        setFilterType(null);
    }

    // ==================== 渲染辅助函数 ====================
    
    /**
     * 根据当前视图模式渲染不同的内容
     * @returns {JSX.Element} 渲染的内容组件
     */
    const renderContent = () => {
        // 空状态处理
        if (filteredMusics.length === 0) {
            const emptyMessage = filterType !== FilterType.ALL || selectedGenre !== 'all'
                ? '没有符合筛选条件的音乐'
                : '暂无音乐数据';

            return (
                <EmptyState
                    icon="fas fa-music"
                    message={emptyMessage}
                    action={
                        filterType !== FilterType.ALL || selectedGenre !== 'all' ? (
                            // 有筛选条件时显示"清除筛选"按钮
                            <button
                                onClick={() => {
                                    setFilterType(FilterType.ALL);
                                    setSelectedGenre('all');
                                }}
                                className="sbrm-btn sbrm-btn-primary mt-4"
                            >
                                <i className="fas fa-redo mr-2"></i>清除筛选
                            </button>
                        ) : (
                            // 无数据时显示"上传第一首音乐"按钮
                            <button onClick={() => setShowModal(true)} className="sbrm-btn sbrm-btn-primary mt-4">
                                <i className="fas fa-plus mr-2"></i>上传第一首音乐
                            </button>
                        )
                    }
                />
            );
        }

        // 根据视图模式渲染不同的组件
        switch (viewMode) {
            case ViewMode.CARD:
                // 卡片视图
                return (
                    <MusicCards
                        musics={filteredMusics}
                        onLike={handleLike}
                        onEdit={setEditingMusic}
                        onDelete={handleDelete}
                    />
                );

            case ViewMode.LIST:
                // 列表视图
                return <MusicList musics={filteredMusics} onLike={handleLike} />;

            case ViewMode.ALBUM_INFO:
                // 专辑详情视图（带专辑信息的列表）
                return <MusicList musics={filteredMusics} albumInfo={album} />;

            case ViewMode.ALBUM_CARDS:
                // 专辑卡片管理视图
                return <LiquidGlass className="px-4">
                    <AlbumList onChange={onAlbumChange}/>
                </LiquidGlass>;

            default:
                // 默认列表视图
                return <MusicList musics={filteredMusics} />;
        }
    };

    // ==================== 主渲染 ====================
    
    return (
        <div className="p-4 flex flex-col">
            {/* 左右布局容器 */}
            <div className="flex gap-6 flex-1 overflow-hidden">
                {/* ==================== 左侧 Sidebar ==================== */}
                <aside className="w-64 flex-shrink-0">
                    <LiquidGlass cornerRadius={16}>
                        <div className="sbrm-rounded-lg sbrm-shadow-card p-4 h-full sbrm-scroll-y">
                            <h3 className="text-lg font-semibold sbrm-text-primary mb-4">筛选</h3>

                            {/* 分类筛选 */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium sbrm-text-primary-1 mb-3 flex items-center gap-2">
                                    <i className="fas fa-filter sbrm-text-accent-primary text-xs"></i>
                                    分类
                                </h4>
                                <ul className="space-y-1">
                                    {/* 全部专辑 */}
                                    <li>
                                        <button
                                            onClick={() => handleFilterChange(FilterType.ALBUM_CARDS)}
                                            className={`w-full text-left px-3 py-2.5 sbrm-rounded-md text-sm sbrm-transition ${
                                                filterType === FilterType.ALBUM_CARDS
                                                    ? 'sbrm-bg-accent-alpha-20 sbrm-text-primary font-medium sbrm-border-l-2 sbrm-border-accent'
                                                    : 'hover:sbrm-bg-hover sbrm-text-primary-1 hover:sbrm-text-primary'
                                            }`}
                                        >
                                            <i className="fas fa-compact-disc mr-2 sbrm-text-accent-primary"></i>
                                            全部专辑
                                        </button>
                                    </li>
                                    
                                    {/* 全部音乐 */}
                                    <li>
                                        <button
                                            onClick={() => handleFilterChange(FilterType.ALL)}
                                            className={`w-full text-left px-3 py-2.5 sbrm-rounded-md text-sm sbrm-transition ${
                                                filterType === FilterType.ALL
                                                    ? 'sbrm-bg-accent-alpha-20 sbrm-text-primary font-medium sbrm-border-l-2 sbrm-border-accent'
                                                    : 'hover:sbrm-bg-hover sbrm-text-primary-1 hover:sbrm-text-primary'
                                            }`}
                                        >
                                            <i className="fas fa-music mr-2 sbrm-text-accent-primary"></i>
                                            全部音乐
                                        </button>
                                    </li>
                                    
                                    {/* 我喜欢的 */}
                                    <li>
                                        <button
                                            onClick={() => handleFilterChange(FilterType.LIKED)}
                                            className={`w-full text-left px-3 py-2.5 sbrm-rounded-md text-sm sbrm-transition ${
                                                filterType === FilterType.LIKED
                                                    ? 'sbrm-bg-accent-alpha-20 sbrm-text-primary font-medium sbrm-border-l-2 sbrm-border-accent'
                                                    : 'hover:sbrm-bg-hover sbrm-text-primary-1 hover:sbrm-text-primary'
                                            }`}
                                        >
                                            <i className="fas fa-heart mr-2 sbrm-text-error"></i>
                                            我喜欢的
                                        </button>
                                    </li>
                                    
                                    {/* 最近播放 */}
                                    <li>
                                        <button
                                            onClick={() => handleFilterChange(FilterType.RECENT)}
                                            className={`w-full text-left px-3 py-2.5 sbrm-rounded-md text-sm sbrm-transition ${
                                                filterType === FilterType.RECENT
                                                    ? 'sbrm-bg-accent-alpha-20 sbrm-text-primary font-medium sbrm-border-l-2 sbrm-border-accent'
                                                    : 'hover:sbrm-bg-hover sbrm-text-primary-1 hover:sbrm-text-primary'
                                            }`}
                                        >
                                            <i className="fas fa-clock mr-2 sbrm-text-accent-primary"></i>
                                            最近播放
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            {/* 分隔线 */}
                            <div className="sbrm-divider"></div>

                            {/* 流派筛选 */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium sbrm-text-primary-1 mb-3 flex items-center gap-2">
                                    <i className="fas fa-tags sbrm-text-accent-primary text-xs"></i>
                                    流派
                                </h4>
                                <ul className="space-y-1 max-h-64 sbrm-scroll-y">
                                    {/* 全部流派 */}
                                    <li>
                                        <button
                                            onClick={() => handleGenreChange('all')}
                                            className={`w-full text-left px-3 py-2 sbrm-rounded-md text-sm sbrm-transition ${
                                                selectedGenre === 'all'
                                                    ? 'sbrm-bg-accent-alpha-20 sbrm-text-primary font-medium'
                                                    : 'hover:sbrm-bg-hover sbrm-text-primary-1 hover:sbrm-text-primary'
                                            }`}
                                        >
                                            全部流派
                                        </button>
                                    </li>
                                    
                                    {/* 动态流派列表 */}
                                    {genres.map(genre => (
                                        <li key={genre}>
                                            <button
                                                onClick={() => handleGenreChange(genre)}
                                                className={`w-full text-left px-3 py-2 sbrm-rounded-md text-sm sbrm-transition ${
                                                    selectedGenre === genre
                                                        ? 'sbrm-bg-accent-alpha-20 sbrm-text-primary font-medium'
                                                        : 'hover:sbrm-bg-hover sbrm-text-primary-1 hover:sbrm-text-primary'
                                                }`}
                                            >
                                                {genre}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* 分隔线 */}
                            <div className="sbrm-divider"></div>

                            {/* 统计信息 */}
                            <div>
                                <h4 className="text-sm font-medium sbrm-text-primary-1 mb-3 flex items-center gap-2">
                                    <i className="fas fa-chart-bar sbrm-text-accent-primary text-xs"></i>
                                    统计
                                </h4>
                                <div className="space-y-3">
                                    {/* 总曲目数 */}
                                    <div className="flex justify-between items-center px-3 py-2 sbrm-bg-secondary sbrm-rounded-md">
                                        <span className="text-sm sbrm-text-secondary flex items-center gap-2">
                                            <i className="fas fa-music text-xs sbrm-text-accent-primary"></i>
                                            总曲目
                                        </span>
                                        <span className="text-sm font-semibold sbrm-text-primary">
                                            {stats.count}
                                        </span>
                                    </div>
                                    
                                    {/* 总时长 */}
                                    <div className="flex justify-between items-center px-3 py-2 sbrm-bg-secondary sbrm-rounded-md">
                                        <span className="text-sm sbrm-text-secondary flex items-center gap-2">
                                            <i className="fas fa-clock text-xs sbrm-text-accent-primary"></i>
                                            总时长
                                        </span>
                                        <span className="text-sm font-semibold sbrm-text-primary">
                                            {stats.hours > 0
                                                ? `${stats.hours}h ${stats.duration % 60}m`
                                                : `${stats.duration}m`
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </LiquidGlass>
                </aside>

                {/* ==================== 右侧主内容区 ==================== */}
                <main className="flex-1 sbrm-scroll-y">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : (
                        renderContent()
                    )}
                </main>
            </div>

            {/* ==================== 确认删除模态框 ==================== */}
            <ConfirmModal
                isOpen={showConfirmDelete}
                title="确认删除音乐"
                message={`确定要删除音乐 "${musicToDelete?.title}" 吗？此操作不可撤销。`}
                onConfirm={confirmDelete}
                onCancel={() => {
                    setShowConfirmDelete(false);
                    setMusicToDelete(null);
                }}
                confirmText="删除"
                cancelText="取消"
            />
        </div>
    );
};

export default MusicManagement;
