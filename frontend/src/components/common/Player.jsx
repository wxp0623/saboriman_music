import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import LiquidGlass from '../ui/LiquidGlass.jsx';
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import FullPlayer from './FullPlayer.jsx';

const Player = () => {
    const {
        currentMusic,
        isPlaying,
        playMode,
        playlist,
        currentIndex,
        togglePlay,
        playPrevious,
        playNext,
        togglePlayMode,
        setIsPlaying,
        playMusicAtIndex,
        audioRef,
        currentTime,
        duration,
        volume,
        isMuted,
        seekTo,
        changeVolume,
        toggleMute,
    } = usePlayer();

    const [showVolume, setShowVolume] = useState(false);
    const [volumePosition, setVolumePosition] = useState({ top: 0, right: 0 });
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [playlistPosition, setPlaylistPosition] = useState({ bottom: 0, right: 0 });
    const [showFullPlayer, setShowFullPlayer] = useState(false);
    const volumeButtonRef = useRef(null);
    const volumeMenuRef = useRef(null);
    const playlistButtonRef = useRef(null);
    const playlistMenuRef = useRef(null);

    // 环境配置
    const apiBaseUrl = 'http://localhost:8180';

    // 获取完整的 URL
    const getFullUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        return `${apiBaseUrl}${path}`;
    };

    // 使用 useMemo 缓存音频 URL
    const audioUrl = useMemo(() => {
        if (!currentMusic?.path) return '';
        const url = getFullUrl(currentMusic.path);
        console.log('Audio URL:', url);
        return url;
    }, [currentMusic?.path]);

    // 使用 useMemo 缓存封面 URL
    const coverUrl = useMemo(() => {
        if (!currentMusic?.coverUrl) return null;
        return getFullUrl(currentMusic.coverUrl);
    }, [currentMusic?.coverUrl]);

    // 格式化时间
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 进度条拖动 - 使用 Context 的 seekTo
    const handleSeek = (e) => {
        if (!duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const newTime = pos * duration;
        seekTo(newTime);
    };

    // 音量控制 - 使用 Context 的 changeVolume
    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        changeVolume(newVolume);
    };

    // 播放列表中的音乐
    const handlePlayMusic = (index) => {
        if (playMusicAtIndex) {
            playMusicAtIndex(index);
        }
    };

    // 播放模式图标
    const getPlayModeIcon = () => {
        switch (playMode) {
            case 'loop':
                return 'fa-repeat';
            case 'shuffle':
                return 'fa-random';
            case 'single':
                return 'fa-repeat';
            default:
                return 'fa-repeat';
        }
    };

    // 播放模式提示文本
    const getPlayModeTitle = () => {
        switch (playMode) {
            case 'loop':
                return '列表循环';
            case 'shuffle':
                return '随机播放';
            case 'single':
                return '单曲循环';
            default:
                return '列表循环';
        }
    };

    // 计算音量菜单位置
    useEffect(() => {
        if (showVolume && volumeButtonRef.current) {
            const rect = volumeButtonRef.current.getBoundingClientRect();
            setVolumePosition({
                bottom: window.innerHeight - rect.top + 8,
                right: window.innerWidth - rect.right,
            });
        }
    }, [showVolume]);

    // 计算播放列表位置
    useEffect(() => {
        if (showPlaylist && playlistButtonRef.current) {
            const rect = playlistButtonRef.current.getBoundingClientRect();
            setPlaylistPosition({
                bottom: window.innerHeight - rect.top + 8,
                right: window.innerWidth - rect.right,
            });
        }
    }, [showPlaylist]);

    // 点击外部关闭音量菜单
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                volumeMenuRef.current &&
                !volumeMenuRef.current.contains(event.target) &&
                volumeButtonRef.current &&
                !volumeButtonRef.current.contains(event.target)
            ) {
                setShowVolume(false);
            }
        };

        if (showVolume) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showVolume]);

    // 点击外部关闭播放列表
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                playlistMenuRef.current &&
                !playlistMenuRef.current.contains(event.target) &&
                playlistButtonRef.current &&
                !playlistButtonRef.current.contains(event.target)
            ) {
                setShowPlaylist(false);
            }
        };

        if (showPlaylist) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showPlaylist]);

    // 如果没有当前音乐，不显示播放器
    if (!currentMusic) {
        return null;
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-50">
                <LiquidGlass>
                    <div className="px-4 py-4">
                        <div className="flex items-center justify-between gap-6">
                            {/* 左侧：音乐信息 */}
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                {/* 封面 */}
                                <div className="w-16 h-16 overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0 shadow-lg">
                                    {coverUrl ? (
                                        <img
                                            src={coverUrl}
                                            alt={currentMusic.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <i className="fas fa-music text-white text-xl"></i>
                                        </div>
                                    )}
                                </div>

                                {/* 音乐信息 */}
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-white font-semibold truncate">
                                        {currentMusic.title || '未知标题'}
                                    </h3>
                                    <p className="text-gray-300 text-sm truncate">
                                        {currentMusic.artist || '未知艺术家'}
                                    </p>
                                </div>

                                {/* 点赞按钮 */}
                                <button
                                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                                    title="喜欢"
                                >
                                    <i className="far fa-heart text-lg"></i>
                                </button>
                            </div>

                            {/* 中间：播放控制 */}
                            <div className="flex-1 max-w-2xl">
                                {/* 控制按钮 */}
                                <div className="flex items-center justify-center gap-4 mb-2">
                                    {/* 播放模式 */}
                                    <button
                                        onClick={togglePlayMode}
                                        className="text-gray-300 hover:text-white transition-colors relative"
                                        title={getPlayModeTitle()}
                                    >
                                        <i className={`fas ${getPlayModeIcon()} text-lg`}></i>
                                        {/* 单曲循环时显示数字 1 */}
                                        {playMode === 'single' && (
                                            <span className="absolute -top-0.5 -right-0.5 min-w-[12px] h-3 px-1 bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                                                1
                                            </span>
                                        )}
                                    </button>

                                    {/* 上一曲 */}
                                    <button
                                        onClick={playPrevious}
                                        className="text-gray-300 hover:text-white transition-colors"
                                        title="上一曲"
                                    >
                                        <i className="fas fa-step-backward text-lg"></i>
                                    </button>

                                    {/* 播放/暂停 */}
                                    <button
                                        onClick={togglePlay}
                                        className="w-10 h-10 rounded-full bg-white text-purple-600 hover:bg-gray-100 transition-all hover:scale-110 flex items-center justify-center shadow-lg"
                                        title={isPlaying ? '暂停' : '播放'}
                                    >
                                        <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-lg ${!isPlaying ? 'ml-0.5' : ''}`}></i>
                                    </button>

                                    {/* 下一曲 */}
                                    <button
                                        onClick={playNext}
                                        className="text-gray-300 hover:text-white transition-colors"
                                        title="下一曲"
                                    >
                                        <i className="fas fa-step-forward text-lg"></i>
                                    </button>

                                    {/* 播放列表 */}
                                    <button
                                        ref={playlistButtonRef}
                                        onClick={() => setShowPlaylist(!showPlaylist)}
                                        className={`text-gray-300 hover:text-white transition-colors relative ${showPlaylist ? 'text-purple-400' : ''}`}
                                        title="播放列表"
                                    >
                                        <i className="fas fa-list text-lg"></i>
                                        {playlist && playlist.length > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                                {playlist.length}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {/* 进度条 */}
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-300 w-10 text-right">
                                        {formatTime(currentTime)}
                                    </span>
                                    <div
                                        className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer relative group"
                                        onClick={handleSeek}
                                    >
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full relative"
                                            style={{ width: `${progress}%` }}
                                        >
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-300 w-10">
                                        {formatTime(duration)}
                                    </span>
                                </div>
                            </div>

                            {/* 右侧：音量控制 */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <button
                                    ref={volumeButtonRef}
                                    onClick={toggleMute}
                                    onMouseEnter={() => setShowVolume(true)}
                                    className="text-gray-300 hover:text-white transition-colors"
                                    title={isMuted ? '取消静音' : '静音'}
                                >
                                    <i className={`fas ${isMuted ? 'fa-volume-mute' : volume > 0.5 ? 'fa-volume-up' : 'fa-volume-down'} text-lg`}></i>
                                </button>

                                {/* 全屏按钮 */}
                                <button
                                    onClick={() => setShowFullPlayer(true)}
                                    className="text-gray-300 hover:text-white transition-colors"
                                    title="全屏播放"
                                >
                                    <i className="fas fa-expand text-lg"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </LiquidGlass>
            </div>

            {/* 音量控制菜单 Portal */}
            {showVolume && createPortal(
                <div
                    ref={volumeMenuRef}
                    className="fixed z-[9999]"
                    style={{
                        bottom: `${volumePosition.bottom}px`,
                        right: `${volumePosition.right}px`,
                    }}
                    onMouseEnter={() => setShowVolume(true)}
                    onMouseLeave={() => setShowVolume(false)}
                >
                    <LiquidGlass cornerRadius={12}>
                        <div className="p-3 shadow-2xl">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="accent-purple-400 cursor-pointer"
                                style={{
                                    writingMode: 'bt-lr',
                                    WebkitAppearance: 'slider-vertical',
                                    height: '100px',
                                    width: '24px'
                                }}
                            />
                            <div className="mt-2 text-center text-xs text-gray-400 font-medium">
                                {Math.round((isMuted ? 0 : volume) * 100)}%
                            </div>
                        </div>
                    </LiquidGlass>
                </div>,
                document.body
            )}

            {/* 播放列表 Portal */}
            {showPlaylist && createPortal(
                <div
                    ref={playlistMenuRef}
                    className="fixed z-[9999]"
                    style={{
                        bottom: `${playlistPosition.bottom}px`,
                        right: `${playlistPosition.right}px`,
                    }}
                >
                    <LiquidGlass cornerRadius={12}>
                        <div className="w-100 max-h-96 overflow-hidden shadow-2xl">
                            {/* 播放列表头部 */}
                            <div className="px-4 py-3 border-b border-gray-700">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-white font-semibold">当前播放列表</h3>
                                    <button
                                        onClick={() => setShowPlaylist(false)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    共 {playlist?.length || 0} 首
                                </p>
                            </div>

                            {/* 播放列表内容 */}
                            <div className="overflow-y-auto max-h-80">
                                {playlist && playlist.length > 0 ? (
                                    <ul className="divide-y divide-gray-700">
                                        {playlist.map((music, index) => (
                                            <li
                                                key={music.id || index}
                                                onClick={() => handlePlayMusic(index)}
                                                className={`px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors ${
                                                    index === currentIndex ? 'bg-purple-500/10' : ''
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* 播放指示器 */}
                                                    <div className="w-5 text-center flex-shrink-0">
                                                        {index === currentIndex ? (
                                                            <i className="fas fa-volume-up text-purple-400 text-sm animate-pulse"></i>
                                                        ) : (
                                                            <span className="text-gray-500 text-xs">{index + 1}</span>
                                                        )}
                                                    </div>

                                                    {/* 封面 */}
                                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0 overflow-hidden">
                                                        {music.coverUrl ? (
                                                            <img
                                                                src={getFullUrl(music.coverUrl)}
                                                                alt={music.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <i className="fas fa-music text-white text-xs"></i>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* 音乐信息 */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`text-sm truncate ${
                                                            index === currentIndex ? 'text-purple-400 font-medium' : 'text-white'
                                                        }`}>
                                                            {music.title || '未知标题'}
                                                        </h4>
                                                        <p className="text-xs text-gray-400 truncate">
                                                            {music.artist || '未知艺术家'}
                                                        </p>
                                                    </div>

                                                    {/* 时长 */}
                                                    <span className="text-xs text-gray-500 flex-shrink-0">
                                                        {formatTime(music.duration)}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="px-4 py-12 text-center">
                                        <i className="fas fa-music text-4xl text-gray-600 mb-3"></i>
                                        <p className="text-gray-400 text-sm">播放列表为空</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </LiquidGlass>
                </div>,
                document.body
            )}

            {/* 全屏播放器 */}
            <FullPlayer 
                isOpen={showFullPlayer} 
                onClose={() => setShowFullPlayer(false)} 
            />
        </>
    );
};

export default Player;