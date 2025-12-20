import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import LyricsDisplay from './LyricsDisplay.jsx';
import AudioVisualizer from './AudioVisualizer.jsx';
import api from '../../services/api.js';
import LyricsSearchModal from './LyricsSearchModal.jsx';
import LyricsEditModal from './LyricsEditModal.jsx';
import LiquidGlass from '../ui/LiquidGlass.jsx';
import { getFullUrl } from '../../services/fileUtil.js';

const FullPlayer = ({ isOpen, onClose }) => {
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

    const [showPlaylist, setShowPlaylist] = useState(false);
    const [showLyrics, setShowLyrics] = useState(true);
    const [lyrics, setLyrics] = useState('');
    const [translation, setTranslation] = useState('');
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
    const [isLyricsSearchModalOpen, setLyricsSearchModalOpen] = useState(false);
    const [isLyricsEditModalOpen, setLyricsEditModalOpen] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);

    // 使用 useMemo 缓存音频 URL
    const audioUrl = useMemo(() => {
        if (!currentMusic?.path) return '';
        return getFullUrl(currentMusic.path);
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

    // 进度条拖动
    const handleSeek = (e) => {
        if (!duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const newTime = pos * duration;
        seekTo(newTime);
    };

    // 音量控制
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

    // 处理添加到我的喜欢
    const toggleLike = async () => {
        if (!currentMusic?.id) return;

        try {
            // 调用 API 添加/取消喜欢
            await api.playlists.favorite({ musicId: currentMusic.id });
            
            // 切换收藏状态
            setIsFavorited(!isFavorited);
            
        } catch (error) {
            console.error('操作失败:', error);
        }
    };

    // 获取歌词（包含翻译）
    const fetchLyrics = async (musicId) => {
        if (!musicId) return;
        setIsLoadingLyrics(true);
        try {
            const response = await api.musics.getLyrics(musicId);
            const lyrics = response?.lyrics || response.data?.lyrics || '';
            const tlyrics = response?.tlyrics || response.data?.tlyrics || '';
            setLyrics(lyrics);
            setTranslation(tlyrics);
        } catch (error) {
            console.error('获取歌词失败:', error);
            setLyrics('');
            setTranslation('');
        } finally {
            setIsLoadingLyrics(false);
        }
    };

    const applyLyrics = async (text, translationText = '') => {
        setLyrics(text || '');
        // 保存到后端
        if (currentMusic?.id) {
            await api.lyrics.saveLyrics(currentMusic.id, text);
            await api.lyrics.saveTranslationLyrics(currentMusic.id, translationText);
        }
    };

    const handleApplySearchedLyrics = (data) => {
        handleSaveLyrics(data.lyrics, data.tlyric);
    };

    const handleSaveLyrics = (newLyrics, newTranslation = '') => {
        setLyrics(newLyrics);
        setTranslation(newTranslation);
        applyLyrics(newLyrics, newTranslation);
    };

    // 当音乐改变时获取歌词和收藏状态
    useEffect(() => {
        if (currentMusic?.id) {
            fetchLyrics(currentMusic.id);
            // 设置收藏状态
            setIsFavorited(currentMusic.favorited || false);
        } else {
            setLyrics('');
            setTranslation('');
            setIsFavorited(false);
        }
    }, [currentMusic?.id]);

    // 阻止背景滚动
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen || !currentMusic) {
        return null;
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return createPortal(
        <div className="fixed inset-0 z-[9999] sbrm-bg-primary overflow-hidden">
            {/* 背景模糊封面 */}
            {coverUrl && (
                <div className="absolute inset-0 sbrm-opacity-20 bottom-0">
                    <img
                        src={coverUrl}
                        alt=""
                        className="w-full h-full object-cover sbrm-blur-xl scale-110 object-[50%_25%]"
                    />
                </div>
            )}

            {/* 主内容 */}
            <div className="relative h-full flex">
                <div className='w-2/5'>
                    {/* 顶部操作栏 */}
                    <div className="flex items-center justify-between px-6 py-4">
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center hover:sbrm-bg-hover sbrm-rounded-full sbrm-transition sbrm-text-primary"
                            title="最小化"
                        >
                            <i className="fas fa-chevron-down text-lg"></i>
                        </button>

                        <h2 className="text-base font-semibold sbrm-text-primary">正在播放</h2>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setLyricsSearchModalOpen(true)}
                                className="w-10 h-10 flex items-center justify-center hover:sbrm-bg-hover sbrm-rounded-full sbrm-transition sbrm-text-primary"
                                title="搜索歌词"
                            >
                                <i className="fas fa-search text-lg"></i>
                            </button>
                            <button
                                onClick={() => setLyricsEditModalOpen(true)}
                                className="w-10 h-10 flex items-center justify-center hover:sbrm-bg-hover sbrm-rounded-full sbrm-transition sbrm-text-primary"
                                title="设置歌词"
                            >
                                <i className="fas fa-edit text-lg"></i>
                            </button>
                            <button
                                onClick={() => setShowLyrics(!showLyrics)}
                                className={`w-10 h-10 flex items-center justify-center sbrm-rounded-full sbrm-transition ${
                                    showLyrics 
                                        ? 'sbrm-text-accent-primary sbrm-bg-accent-alpha-20' 
                                        : 'sbrm-text-primary hover:sbrm-bg-hover'
                                }`}
                                title="歌词"
                            >
                                <i className="fas fa-align-left text-lg"></i>
                            </button>
                            <button
                                onClick={() => setShowPlaylist(!showPlaylist)}
                                className={`w-10 h-10 flex items-center justify-center sbrm-rounded-full sbrm-transition ${
                                    showPlaylist 
                                        ? 'sbrm-text-accent-primary sbrm-bg-accent-alpha-20' 
                                        : 'sbrm-text-primary hover:sbrm-bg-hover'
                                }`}
                                title="播放列表"
                            >
                                <i className="fas fa-list text-lg"></i>
                            </button>
                        </div>
                    </div>

                    <div className="flex px-6 min-h-0 overflow-hidden gap-8 py-4 h-[calc(100vh-80px)]">
                        {/* 左侧：封面、播放列表和控制栏 */}
                        <div className="w-full flex flex-col">
                            <div className="flex-1 flex flex-col items-center justify-center">
                                {/* 封面 */}
                                <div className="relative w-80 h-80 mb-6 sbrm-bg-gradient sbrm-shadow-2xl flex-shrink-0">
                                    <div className='absolute z-10 w-full h-full overflow-hidden'>
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
                                                <i className="fas fa-music sbrm-text-on-accent text-6xl"></i>
                                            </div>
                                        )}
                                    </div>

                                    {/* 黑胶唱片效果 */}
                                    <div className="absolute bottom-0 p-4 ml-40" >
                                        <div className='w-72 h-72 backdrop-blur-md rounded-full p-4 relative'
                                            style={{
                                                background: 'radial-gradient(circle, transparent 25%, rgba(0,0,0,0.3) 28%, rgba(0,0,0,0.7) 31%, rgba(0,0,0,0.9) 35%)',
                                                WebkitMaskImage: 'radial-gradient(circle, transparent 25%, black 25%)',
                                                maskImage: 'radial-gradient(circle, transparent 12%, black 20%)'
                                            }}>
                                            {/* 外圈黑胶纹理 */}
                                            <div className="absolute inset-0 rounded-full sbrm-opacity-40" style={{
                                                background: 'repeating-radial-gradient(circle at center, transparent 0px, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)'
                                            }}>
                                                <div className='w-full h-full backdrop-blur-md rounded-full relative'>
                                                    {/* 中心标签 */}
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 via-gray-800 to-black sbrm-border-2 border-white/20 flex items-center justify-center sbrm-shadow-lg">
                                                        <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                                                    </div>

                                                    {/* 黑胶纹理效果 */}
                                                    <div className="absolute inset-0 rounded-full sbrm-opacity-20" style={{
                                                        background: 'repeating-radial-gradient(circle at center, transparent 0px, transparent 3px, rgba(255,255,255,0.05) 3px, rgba(255,255,255,0.05) 6px)'
                                                    }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 播放列表 */}
                                {showPlaylist && (
                                    <div className="w-full max-w-2xl">
                                        <div className="max-h-64 overflow-hidden sbrm-bg-glass sbrm-rounded-2xl sbrm-border sbrm-border-tertiary">
                                            <div className="px-4 py-3 sbrm-border-b sbrm-border-divider flex-shrink-0">
                                                <h3 className="text-sm font-semibold sbrm-text-primary">播放列表</h3>
                                                <p className="text-xs sbrm-text-tertiary mt-0.5">
                                                    共 {playlist?.length || 0} 首
                                                </p>
                                            </div>
                                            <div className="overflow-y-auto max-h-52 sbrm-scroll-y">
                                                {playlist && playlist.length > 0 ? (
                                                    <ul className="divide-y sbrm-border-divider">
                                                        {playlist.map((music, index) => (
                                                            <li
                                                                key={music.id || index}
                                                                onClick={() => handlePlayMusic(index)}
                                                                className={`px-4 py-3 hover:sbrm-bg-hover cursor-pointer sbrm-transition ${
                                                                    index === currentIndex ? 'sbrm-bg-accent-alpha-20' : ''
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-4 text-center flex-shrink-0">
                                                                        {index === currentIndex ? (
                                                                            <i className="fas fa-volume-up sbrm-text-accent-primary text-xs animate-pulse"></i>
                                                                        ) : (
                                                                            <span className="sbrm-text-tertiary text-xs">{index + 1}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className={`text-xs truncate ${
                                                                            index === currentIndex 
                                                                                ? 'sbrm-text-accent-primary font-medium' 
                                                                                : 'sbrm-text-primary'
                                                                        }`}>
                                                                            {music.title || '未知标题'}
                                                                        </h4>
                                                                        <p className="text-xs sbrm-text-tertiary truncate">
                                                                            {music.artist || '未知艺术家'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="px-4 py-8 text-center">
                                                        <i className="fas fa-music text-3xl sbrm-text-tertiary mb-2"></i>
                                                        <p className="sbrm-text-tertiary text-xs">播放列表为空</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 底部控制栏 */}
                            <div className="flex-shrink-0 mt-4">
                                <div className="p-4 sbrm-rounded-2xl">
                                    {/* 歌曲信息 */}
                                    <div className="mb-3 text-center">
                                        <h1 className="text-xl font-bold sbrm-text-primary mb-0.5">
                                            {currentMusic.title || '未知标题'}
                                        </h1>
                                        <p className="text-sm sbrm-text-primary-1">
                                            {currentMusic.artist || '未知艺术家'}
                                            {currentMusic.album && (
                                                <>
                                                    <span className="mx-2 sbrm-text-secondary">•</span>
                                                    {currentMusic.album}
                                                </>
                                            )}
                                        </p>
                                    </div>

                                    {/* 进度条 */}
                                    <div className="mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs sbrm-text-primary-1 w-10 text-right">
                                                {formatTime(currentTime)}
                                            </span>
                                            <div
                                                className="flex-1 h-1.5 sbrm-bg-secondary sbrm-rounded-full cursor-pointer relative group"
                                                onClick={handleSeek}
                                            >
                                                <div
                                                    className="h-full sbrm-bg-gradient sbrm-rounded-full relative"
                                                    style={{ width: `${progress}%` }}
                                                >
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 sbrm-bg-primary sbrm-rounded-full opacity-0 group-hover:opacity-100 sbrm-transition sbrm-shadow-lg"></div>
                                                </div>
                                            </div>
                                            <span className="text-xs sbrm-text-primary-1 w-10">
                                                {formatTime(duration)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 控制按钮 */}
                                    <div className="flex items-center justify-between">
                                        {/* 左侧：播放模式 */}
                                        <div className="flex items-center gap-3 w-20">
                                            <button
                                                onClick={togglePlayMode}
                                                className="sbrm-text-primary-1 hover:sbrm-text-primary sbrm-transition relative"
                                                title={getPlayModeTitle()}
                                            >
                                                <i className={`fas ${getPlayModeIcon()} text-lg`}></i>
                                                {playMode === 'single' && (
                                                    <span className="absolute -top-1 -right-1 min-w-[12px] h-3 px-0.5 sbrm-bg-accent-primary sbrm-text-on-accent text-[9px] font-bold sbrm-rounded-full flex items-center justify-center leading-none">
                                                        1
                                                    </span>
                                                )}
                                            </button>
                                        </div>

                                        {/* 中间：播放控制 */}
                                        <div className="flex items-center gap-6">
                                            <button
                                                onClick={playPrevious}
                                                className="sbrm-text-primary-1 hover:sbrm-text-primary sbrm-transition"
                                                title="上一曲"
                                            >
                                                <i className="fas fa-step-backward text-xl"></i>
                                            </button>

                                            <button
                                                onClick={togglePlay}
                                                className="w-14 h-14 sbrm-rounded-full sbrm-bg-primary sbrm-text-accent-primary hover:scale-110 sbrm-transition-all flex items-center justify-center sbrm-shadow-lg"
                                                title={isPlaying ? '暂停' : '播放'}
                                            >
                                                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-xl ${!isPlaying ? 'ml-0.5' : ''}`}></i>
                                            </button>

                                            <button
                                                onClick={playNext}
                                                className="sbrm-text-primary-1 hover:sbrm-text-primary sbrm-transition"
                                                title="下一曲"
                                            >
                                                <i className="fas fa-step-forward text-xl"></i>
                                            </button>
                                        </div>

                                        {/* 右侧：音量和喜欢 */}
                                        <div className="flex items-center gap-3 w-20 justify-end">
                                            <button
                                                onClick={toggleLike}
                                                className={`sbrm-transition ${
                                                    isFavorited
                                                        ? 'sbrm-text-error hover:opacity-80'
                                                        : 'sbrm-text-primary-1 hover:sbrm-text-error'
                                                }`}
                                                title={isFavorited ? '从我的喜欢移除' : '添加到我的喜欢'}
                                            >
                                                <i className={`${isFavorited ? 'fas' : 'far'} fa-heart text-lg`}></i>
                                            </button>

                                            <div className="relative">
                                                <div className="group">
                                                    <button
                                                        onClick={toggleMute}
                                                        className="sbrm-text-primary-1 hover:sbrm-text-primary sbrm-transition w-8"
                                                        title={isMuted ? '取消静音' : '静音'}
                                                    >
                                                        <i className={`fas ${isMuted ? 'fa-volume-mute' : volume > 0.5 ? 'fa-volume-up' : 'fa-volume-down'} text-lg`}></i>
                                                    </button>

                                                    {/* 音量滑块 - 悬停显示 */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 opacity-0 group-hover:opacity-100 sbrm-transition pointer-events-none group-hover:pointer-events-auto">
                                                        <LiquidGlass radius>
                                                            <div className="p-3 sbrm-shadow-2xl">
                                                                <input
                                                                    type="range"
                                                                    min="0"
                                                                    max="1"
                                                                    step="0.01"
                                                                    value={isMuted ? 0 : volume}
                                                                    onChange={handleVolumeChange}
                                                                    className="cursor-pointer"
                                                                    style={{
                                                                        writingMode: 'bt-lr',
                                                                        WebkitAppearance: 'slider-vertical',
                                                                        height: '100px',
                                                                        width: '24px',
                                                                        accentColor: 'var(--accent-primary)'
                                                                    }}
                                                                />
                                                                <div className="mt-1 text-center text-xs sbrm-text-primary-1 font-medium">
                                                                    {Math.round((isMuted ? 0 : volume) * 100)}%
                                                                </div>
                                                            </div>
                                                        </LiquidGlass>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 右侧：歌词区域 */}
                <div className="w-3/5 sbrm-rounded-2xl overflow-hidden">
                    {isLoadingLyrics ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-3 sbrm-border-accent-primary border-t-transparent sbrm-rounded-full animate-spin"></div>
                                <p className="sbrm-text-tertiary text-sm">加载歌词中...</p>
                            </div>
                        </div>
                    ) : (
                        <LyricsDisplay
                            lyrics={lyrics}
                            translation={translation}
                            currentTime={currentTime}
                        />
                    )}
                </div>
            </div>

            {/* 弹窗：搜索歌词 */}
            <LyricsSearchModal
                isOpen={isLyricsSearchModalOpen}
                onClose={() => setLyricsSearchModalOpen(false)}
                music={currentMusic}
                onApply={handleApplySearchedLyrics}
            />

            {/* 弹窗：编辑歌词 */}
            <LyricsEditModal
                isOpen={isLyricsEditModalOpen}
                onClose={() => setLyricsEditModalOpen(false)}
                music={currentMusic}
                currentLyrics={lyrics}
                currentTranslation={translation}
                onSave={handleSaveLyrics}
            />
        </div>,
        document.body
    );
};

export default FullPlayer;