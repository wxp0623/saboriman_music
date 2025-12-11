import LiquidGlass from '../ui/LiquidGlass.jsx';
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useUserStore } from "../../utils/store.js";

const MusicList = ({ musics, albumInfo }) => {
    const { playMusic, setPlaylistAndPlay } = usePlayer();
    const [musicList, setMusicList] = useState(musics || []);
    const userStore = useUserStore();

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

    const handlePlay = (music, index) => {
        // 从点击的歌曲开始播放整个列表
        setPlaylistAndPlay(musicList, index);
    };

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
        console.log('Musics updated:', musics);
    }, [musics]);

    useEffect(() => {
        console.log('Album Info:', albumInfo);
    }, [albumInfo]);

    // 计算专辑统计信息
    const totalDuration = musicList.reduce((sum, music) => sum + (music.duration || 0), 0);
    const totalSize = musicList.reduce((sum, music) => sum + (music.size || 0), 0);

    return (
        <div>
            {/* 专辑信息头部 */}
            {albumInfo?.name && (
                <LiquidGlass className="mb-4">
                    <div className="rounded-lg overflow-hidden">
                        <div className="flex items-start gap-6 p-6">
                            {/* 专辑封面 */}
                            <div className="flex-shrink-0">
                                <div className="w-56 h-56 rounded-lg overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 shadow-2xl">
                                    {albumInfo.coverUrl ? (
                                        <img
                                            src={getImageUrl(albumInfo.coverUrl)}
                                            alt={albumInfo.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <i className="fas fa-compact-disc text-white text-6xl"></i>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 专辑详情 */}
                            <div className="flex-1 min-w-0">
                                <div className="mb-2 flex justify-between items-center gap-2">
                                    <span className="text-xs text-gray-400 uppercase tracking-wider">专辑</span>
                                    {
                                        albumInfo.genre && <span className='text-sm text-gray-200 dark:text-gray-200 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm'>{albumInfo.genre}</span>
                                    }
                                </div>
                                <h1 className="text-4xl font-bold text-white mb-3 truncate">
                                    {albumInfo?.name || '未知专辑'}
                                </h1>
                                <div className="flex items-center gap-2 text-lg text-gray-200 mb-4">
                                    <i className="fas fa-user text-purple-400"></i>
                                    <span>{albumInfo.artistName || '未知艺术家'}</span>
                                    {albumInfo.year && (
                                        <>
                                            <span className="text-gray-500">•</span>
                                            <span>{albumInfo.year}</span>
                                        </>
                                    )}
                                </div>

                                {/* 统计信息 */}
                                <div className="flex items-center gap-6 text-sm text-gray-300 mb-6">
                                    <span>
                                        <i className="fas fa-music mr-2 text-purple-400"></i>
                                        {musicList.length} 首歌曲
                                    </span>
                                    <span>
                                        <i className="fas fa-clock mr-2 text-purple-400"></i>
                                        {formatDuration(totalDuration)}
                                    </span>
                                    <span>
                                        <i className="fas fa-hdd mr-2 text-purple-400"></i>
                                        {formatFileSize(totalSize)}
                                    </span>
                                </div>

                                {/* 操作按钮 */}
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handlePlayAll}
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all hover:scale-105 shadow-lg flex items-center gap-2"
                                    >
                                        <i className="fas fa-play text-lg"></i>
                                        播放全部
                                    </button>
                                    {/* 添加我的喜爱 */}
                                    <button
                                        onClick={handleLike}   
                                        className="w-16 h-16 text-gray-300 hover:text-white p-3 hover:bg-white/10 rounded-full transition-colors">
                                        <i className="fas fa-heart text-2xl"></i>
                                    </button>
                                    <button className="w-16 h-16 text-gray-300 hover:text-white p-3 hover:bg-white/10 rounded-full transition-colors">
                                        <i className="fas fa-share-alt text-2xl"></i>
                                    </button>
                                    <button className="w-16 h-16 text-gray-300 hover:text-white p-3 hover:bg-white/10 rounded-full transition-colors">
                                        <i className="fas fa-ellipsis-h text-2xl"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </LiquidGlass>
            )}

            {/* 音乐列表 */}
            <LiquidGlass>
                <div className="rounded-lg shadow overflow-hidden">
                    <div className="overflow-auto" style={{ maxHeight: albumInfo?.name ? 'calc(100vh - 480px)' : 'calc(100vh - 180px)' }}>
                        <table className="min-w-full divide-y divide-gray-600">
                            <thead className="sticky top-0 z-10 shadow-sm bg-gray-800/50 backdrop-blur-sm">
                                <tr>
                                    <th className="px-4 p-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-12">
                                        #
                                    </th>
                                    <th className="px-4 p-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        标题
                                    </th>
                                    <th className="px-4 p-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        艺术家
                                    </th>
                                    {!albumInfo?.name &&
                                        <th className="px-4 p-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            专辑
                                        </th>
                                    }
                                    <th className="px-4 p-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        时长
                                    </th>
                                    <th className="px-4 p-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        大小
                                    </th>
                                    <th className="px-4 p-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        播放/点赞
                                    </th>
                                    <th className="px-6 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        操作
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {musicList.map((music, index) => {
                                    return (
                                        <tr key={music.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="py-2 whitespace-nowrap">
                                                <div className="flex items-center justify-center w-8 text-sm text-gray-400 group-hover:text-white">
                                                    <span className="group-hover:hidden">{index + 1}</span>
                                                    <button
                                                        onClick={() => handlePlay(music, index)}
                                                        className="hidden group-hover:block text-purple-400 hover:text-purple-300"
                                                    >
                                                        <i className="fas fa-play"></i>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-2">
                                                <div className="text-sm font-medium text-white">
                                                    {music.title || '未知标题'}
                                                </div>
                                                {music.genre && (
                                                    <div className="text-xs text-gray-400">
                                                        <i className="fas fa-tag mr-1"></i>
                                                        {music.genre}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-2 whitespace-nowrap">
                                                <div className="text-sm text-gray-200">
                                                    {music.artist || '未知艺术家'}
                                                </div>
                                            </td>
                                            {!albumInfo?.name &&
                                                <td className="py-2 whitespace-nowrap">
                                                    <div className="text-sm text-gray-200">
                                                        {music.album || '未知专辑'}
                                                    </div>
                                                    {music.year && (
                                                        <div className="text-xs text-gray-400">
                                                            {music.year}
                                                        </div>
                                                    )}
                                                </td>
                                            }
                                            <td className="py-2 whitespace-nowrap">
                                                <div className="text-sm text-gray-200">
                                                    {formatDuration(music.duration)}
                                                </div>
                                                {music.bitRate && (
                                                    <div className="text-xs text-gray-400">
                                                        {music.bitRate} kbps
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-2 whitespace-nowrap">
                                                <div className="text-sm text-gray-200">
                                                    {formatFileSize(music.size)}
                                                </div>
                                                {music.suffix && (
                                                    <div className="text-xs text-gray-400 uppercase">
                                                        {music.suffix}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-2 whitespace-nowrap">
                                                <div className="flex items-center space-x-3 text-sm text-gray-300">
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
                                                        className="text-purple-400 hover:text-purple-300 transition-colors p-2 hover:bg-white/5 rounded-md"
                                                        title="播放"
                                                    >
                                                        <i className="fas fa-play text-base"></i>
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleLike(music, e)}
                                                        className={`transition-all p-2 hover:bg-white/5 rounded-md ${music.favorited
                                                                ? 'text-red-500 hover:text-red-400'
                                                                : 'text-gray-400 hover:text-red-400'
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