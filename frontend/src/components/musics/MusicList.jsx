import LiquidGlass from '../ui/LiquidGlass.jsx';
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useUserStore } from "../../utils/store.js";
import { getFullUrl } from '../../services/fileUtil.js';

const MusicList = ({ musics, albumInfo }) => {
    const { playMusic, setPlaylistAndPlay } = usePlayer();
    const [musicList, setMusicList] = useState(musics || []);
    const userStore = useUserStore();

    const formatDuration = (seconds) => {
        if (!seconds) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    };

    // 播放单首歌曲 - 只添加这一首到播放列表
    const handlePlay = (music, index) => {
        // 只播放单首歌曲
        playMusic(music);
    };

    // 播放全部 - 从第一首开始播放整个列表
    const handlePlayAll = () => {
        if (musicList && musicList.length > 0) {
            setPlaylistAndPlay(musicList, 0);
        }
    };

    // 处理添加到我的喜欢
    const handleLike = async (music, e) => {
        e.stopPropagation(); // 防止触发行点击事件

        try {
            // 调用 API 添加喜欢
            await api.playlists.favorite({musicId: music.id});

            setMusicList((prevList) =>
                prevList.map((m) =>
                    m.id === music.id ? { ...m, favorited: !m.favorited } : m
                )
            );

        } catch (error) {
            console.error('操作失败:', error);
        }
    };

    useEffect(() => {
        setMusicList(musics);
    }, [musics]);

    useEffect(() => {
    }, [albumInfo]);

    // 计算专辑统计信息
    const totalDuration = musicList.reduce((sum, music) => sum + (music.duration || 0), 0);
    const totalSize = musicList.reduce((sum, music) => sum + (music.size || 0), 0);

    return (
        <div>
            {/* 专辑信息头部 */}
            {albumInfo?.name && (
                <LiquidGlass className="mb-4">
                    <div className="sbrm-rounded-lg overflow-hidden">
                        <div className="flex items-start gap-6 p-6">
                            {/* 专辑封面 */}
                            <div className="flex-shrink-0">
                                <div className="w-56 h-56 sbrm-rounded-lg overflow-hidden sbrm-bg-gradient sbrm-shadow-2xl">
                                    {albumInfo.coverUrl ? (
                                        <img
                                            src={getFullUrl(albumInfo.coverUrl)}
                                            alt={albumInfo.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <i className="fas fa-compact-disc sbrm-text-on-accent text-6xl"></i>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 专辑详情 */}
                            <div className="flex-1 min-w-0">
                                <div className="mb-2 flex justify-between items-center gap-2">
                                    <span className="text-xs sbrm-text-tertiary uppercase tracking-wider">专辑</span>
                                    {albumInfo.genre && (
                                        <span className="text-sm sbrm-text-primary-1 sbrm-bg-glass px-3 py-1 sbrm-rounded-full">
                                            {albumInfo.genre}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-4xl font-bold sbrm-text-primary mb-3 truncate">
                                    {albumInfo?.name || '未知专辑'}
                                </h1>
                                <div className="flex items-center gap-2 text-lg sbrm-text-primary-1 mb-4">
                                    <i className="fas fa-user sbrm-text-accent-primary"></i>
                                    <span>{albumInfo.artistName || '未知艺术家'}</span>
                                    {albumInfo.year && (
                                        <>
                                            <span className="sbrm-text-secondary">•</span>
                                            <span>{albumInfo.year}</span>
                                        </>
                                    )}
                                </div>

                                {/* 统计信息 */}
                                <div className="flex items-center gap-6 text-sm sbrm-text-secondary mb-6">
                                    <span>
                                        <i className="fas fa-music mr-2 sbrm-text-accent-primary"></i>
                                        {musicList.length} 首歌曲
                                    </span>
                                    <span>
                                        <i className="fas fa-clock mr-2 sbrm-text-accent-primary"></i>
                                        {formatDuration(totalDuration)}
                                    </span>
                                    <span>
                                        <i className="fas fa-hdd mr-2 sbrm-text-accent-primary"></i>
                                        {formatFileSize(totalSize)}
                                    </span>
                                </div>

                                {/* 操作按钮 */}
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handlePlayAll}
                                        className="sbrm-btn-primary sbrm-btn-lg sbrm-shadow-glow flex items-center gap-2"
                                    >
                                        <i className="fas fa-play text-lg"></i>
                                        播放全部
                                    </button>
                                    {/* 添加我的喜爱 */}
                                    {/* <button
                                        onClick={handleLike}   
                                        className="w-16 h-16 sbrm-text-primary hover:sbrm-text-error p-3 hover:sbrm-bg-hover sbrm-rounded-full sbrm-transition"
                                    >
                                        <i className="fas fa-heart text-2xl"></i>
                                    </button> */}
                                    {/* <button className="w-16 h-16 sbrm-text-primary hover:sbrm-text-accent-primary p-3 hover:sbrm-bg-hover sbrm-rounded-full sbrm-transition">
                                        <i className="fas fa-share-alt text-2xl"></i>
                                    </button> */}
                                    {/* <button className="w-16 h-16 sbrm-text-primary hover:sbrm-text-accent-primary p-3 hover:sbrm-bg-hover sbrm-rounded-full sbrm-transition">
                                        <i className="fas fa-ellipsis-h text-2xl"></i>
                                    </button> */}
                                </div>
                            </div>
                        </div>
                    </div>
                </LiquidGlass>
            )}

            {/* 音乐列表 */}
            <LiquidGlass>
                <div className="sbrm-rounded-lg sbrm-shadow-card overflow-hidden">
                    <div className="sbrm-scroll-y" style={{ maxHeight: albumInfo?.name ? 'calc(100vh - 480px)' : 'calc(100vh - 180px)' }}>
                        <table className="sbrm-table">
                            <thead className="sticky top-0 z-10 sbrm-bg-primary">
                                <tr>
                                    <th className="px-4 p-2 text-left text-xs font-medium sbrm-text-secondary uppercase tracking-wider w-12">
                                        #
                                    </th>
                                    <th className="px-4 p-2 text-left text-xs font-medium sbrm-text-secondary uppercase tracking-wider">
                                        标题
                                    </th>
                                    <th className="px-4 p-2 text-left text-xs font-medium sbrm-text-secondary uppercase tracking-wider">
                                        艺术家
                                    </th>
                                    {!albumInfo?.name && (
                                        <th className="px-4 p-2 text-left text-xs font-medium sbrm-text-secondary uppercase tracking-wider">
                                            专辑
                                        </th>
                                    )}
                                    <th className="px-4 p-2 text-left text-xs font-medium sbrm-text-secondary uppercase tracking-wider">
                                        时长
                                    </th>
                                    <th className="px-4 p-2 text-left text-xs font-medium sbrm-text-secondary uppercase tracking-wider">
                                        大小
                                    </th>
                                    <th className="px-4 p-2 text-left text-xs font-medium sbrm-text-secondary uppercase tracking-wider">
                                        播放/点赞
                                    </th>
                                    <th className="px-6 text-right text-xs font-medium sbrm-text-secondary uppercase tracking-wider">
                                        操作
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="sbrm-border-divider">
                                {musicList.map((music, index) => {
                                    return (
                                        <tr key={music.id} className="hover:sbrm-bg-hover sbrm-transition group">
                                            <td className="py-2 whitespace-nowrap">
                                                <div className="flex items-center justify-center w-8 text-sm sbrm-text-tertiary">
                                                    <span className="group-hover:hidden">{index + 1}</span>
                                                    <button
                                                        onClick={() => handlePlay(music, index)}
                                                        className="hidden group-hover:block sbrm-text-accent-primary hover:sbrm-text-accent-hover sbrm-transition"
                                                    >
                                                        <i className="fas fa-play"></i>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-2">
                                                <div className="text-sm font-medium sbrm-text-primary">
                                                    {music.title || '未知标题'}
                                                </div>
                                                {music.genre && (
                                                    <div className="text-xs sbrm-text-tertiary">
                                                        <i className="fas fa-tag mr-1"></i>
                                                        {music.genre}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-2 whitespace-nowrap">
                                                <div className="text-sm sbrm-text-primary-1">
                                                    {music.artist || '未知艺术家'}
                                                </div>
                                            </td>
                                            {!albumInfo?.name && (
                                                <td className="py-2 whitespace-nowrap">
                                                    <div className="text-sm sbrm-text-primary-1">
                                                        {music.album || '未知专辑'}
                                                    </div>
                                                    {music.year && (
                                                        <div className="text-xs sbrm-text-tertiary">
                                                            {music.year}
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                            <td className="py-2 whitespace-nowrap">
                                                <div className="text-sm sbrm-text-primary-1">
                                                    {formatDuration(music.duration)}
                                                </div>
                                                {music.bitRate && (
                                                    <div className="text-xs sbrm-text-tertiary">
                                                        {music.bitRate} kbps
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-2 whitespace-nowrap">
                                                <div className="text-sm sbrm-text-primary-1">
                                                    {formatFileSize(music.size)}
                                                </div>
                                                {music.suffix && (
                                                    <div className="text-xs sbrm-text-tertiary uppercase">
                                                        {music.suffix}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-2 whitespace-nowrap">
                                                <div className="flex items-center space-x-3 text-sm sbrm-text-secondary">
                                                    <span title="播放次数">
                                                        <i className="fas fa-play mr-1 text-xs"></i>
                                                        {music.playCount || 0}
                                                    </span>
                                                    <span title="点赞数">
                                                        <i className="fas fa-heart mr-1 text-xs"></i>
                                                        {music.likeCount || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-2 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-3">
                                                    <button
                                                        onClick={() => handlePlay(music, index)}
                                                        className="sbrm-text-accent-primary hover:sbrm-text-accent-hover sbrm-transition p-2 hover:sbrm-bg-hover sbrm-rounded-md"
                                                        title="播放"
                                                    >
                                                        <i className="fas fa-play text-base"></i>
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleLike(music, e)}
                                                        className={`sbrm-transition p-2 hover:sbrm-bg-hover sbrm-rounded-md ${
                                                            music.favorited
                                                                ? 'sbrm-text-error hover:opacity-80'
                                                                : 'sbrm-text-tertiary hover:sbrm-text-error'
                                                        }`}
                                                        title={music.favorited ? '从我的喜欢移除' : '添加到我的喜欢'}
                                                    >
                                                        <i className={`${music.favorited ? 'fas' : 'far'} fa-heart text-base`}></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </LiquidGlass>
        </div>
    );
};

export default MusicList;