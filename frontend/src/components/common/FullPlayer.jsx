import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePlayer } from '../../contexts/PlayerContext.jsx';
import LyricsDisplay from './LyricsDisplay.jsx';
import AudioVisualizer from './AudioVisualizer.jsx';
import api from '../../services/api.js';
import LyricsSearchModal from './LyricsSearchModal.jsx';
import LyricsEditModal from './LyricsEditModal.jsx';

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
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
    const [isLyricsSearchModalOpen, setLyricsSearchModalOpen] = useState(false);
    const [isLyricsEditModalOpen, setLyricsEditModalOpen] = useState(false);

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

    // 获取歌词
    const fetchLyrics = async (musicId) => {
        console.log('获取歌词，musicId:', musicId);
        if (!musicId) return;
        setIsLoadingLyrics(true);
        try {
            const response = await api.musics.getLyrics(musicId);
            const lyrics = response?.lyrics || response.data?.lyrics || '';
            console.log('获取歌词成功:', lyrics);
            setLyrics(lyrics);
        } catch (error) {
            console.error('获取歌词失败:', error);
            setLyrics('');
        } finally {
            setIsLoadingLyrics(false);
        }
    };

    const applyLyrics = async (text, src) => {
        setLyrics(text || '');
        // 可选：同步到后端保存本地文件，留空或调用接口
        await api.musics.saveLyrics(currentMusic.id, text);
    };

    const handleApplySearchedLyrics = (lyricsText) => {
        setLyrics(lyricsText);
        applyLyrics(lyricsText);
        // 打开编辑弹窗让用户可以进一步编辑
        // setLyricsEditModalOpen(true);
    };

    const handleSaveLyrics = (newLyrics) => {
        setLyrics(newLyrics);
        // 可选：刷新歌词显示
        if (currentMusic?.id) {
            fetchLyrics(currentMusic.id);
        }
    };

    // 当音乐改变时获取歌词
    useEffect(() => {
        if (currentMusic?.id) {
            fetchLyrics(currentMusic.id);
        } else {
            setLyrics('');
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


    // const handleVolumeChange = (e) => {
    //     visualizerRef.current?.setVolume(parseFloat(e.target.value));
    // };

    // const handleSeek = (time) => {
    //     visualizerRef.current?.seek(time);
    // };

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 backdrop-blur-xl overflow-hidden">
            {/* 背景模糊封面 */}
            {coverUrl && (
                <div className="absolute inset-0 opacity-20">
                    <img
                        src={coverUrl}
                        alt=""
                        className="w-full h-full object-cover blur-3xl scale-110"
                    />
                </div>
            )}

            {/* 主内容 */}
            <div className="relative h-full flex">
                <div className='w-2/5'>
                    {/* 顶部操作栏 - 减小内边距 */}
                    <div className="flex flex-center justify-between px-6 py-4">
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                            title="最小化"
                        >
                            <i className="fas fa-chevron-down text-lg"></i>
                        </button>

                        <h2 className="text-white text-base font-semibold">正在播放</h2>

                        <div className="flex">
                            <button
                                onClick={() => setLyricsSearchModalOpen(true)}
                                className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                                title="搜索歌词"
                            >
                                <i className="fas fa-search text-lg"></i>
                            </button>
                            <button
                                onClick={() => setLyricsEditModalOpen(true)}
                                className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                                title="设置歌词"
                            >
                                <i className="fas fa-edit text-lg"></i>
                            </button>
                            <button
                                onClick={() => setShowLyrics(!showLyrics)}
                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${showLyrics ? 'text-purple-400 bg-white/10' : 'text-white hover:bg-white/10'
                                    }`}
                                title="歌词"
                            >
                                <i className="fas fa-align-left text-lg"></i>
                            </button>
                            <button
                                onClick={() => setShowPlaylist(!showPlaylist)}
                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${showPlaylist ? 'text-purple-400 bg-white/10' : 'text-white hover:bg-white/10'
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
                                <div className="relative w-80 h-80 mb-6 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 shadow-2xl flex-shrink-0">
                                    <div className='absolute z-10'>
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
                                                <i className="fas fa-music text-white text-6xl"></i>
                                            </div>
                                        )}
                                    </div>
                                    {/* 黑胶唱片效果 - 带过渡区 */}
                                    <div className="p-4 absolute bottom-0  p-4 ml-40" >
                                        <div className='w-72 h-72 backdrop-blur-mdrounded-full p-4 relative rounded-full'
                                            style={{
                                                background: 'radial-gradient(circle, transparent 25%, rgba(0,0,0,0.3) 28%, rgba(0,0,0,0.7) 31%, rgba(0,0,0,0.9) 35%)',
                                                WebkitMaskImage: 'radial-gradient(circle, transparent 25%, black 25%)',
                                                maskImage: 'radial-gradient(circle, transparent 12%, black 20%)'
                                            }}>
                                            {/* 外圈黑胶纹理 */}
                                            <div className="absolute inset-0 rounded-full opacity-40" style={{
                                                background: 'repeating-radial-gradient(circle at center, transparent 0px, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)'
                                            }}>
                                                <div className='w-full h-full backdrop-blur-md rounded-full relative'>
                                                    {/* 中心标签（可选） */}
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 via-gray-800 to-black border-2 border-white/20 flex items-center justify-center shadow-lg">
                                                        <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                                                    </div>

                                                    {/* 黑胶纹理效果（可选） */}
                                                    <div className="absolute inset-0 rounded-full opacity-20" style={{
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
                                        <div className="max-h-64 overflow-hidden bg-black/20 backdrop-blur-md rounded-2xl border border-white/10">
                                            <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
                                                <h3 className="text-white text-sm font-semibold">播放列表</h3>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    共 {playlist?.length || 0} 首
                                                </p>
                                            </div>
                                            <div className="overflow-y-auto max-h-52">
                                                {playlist && playlist.length > 0 ? (
                                                    <ul className="divide-y divide-white/5">
                                                        {playlist.map((music, index) => (
                                                            <li
                                                                key={music.id || index}
                                                                onClick={() => handlePlayMusic(index)}
                                                                className={`px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors ${index === currentIndex ? 'bg-purple-500/20' : ''
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-4 text-center flex-shrink-0">
                                                                        {index === currentIndex ? (
                                                                            <i className="fas fa-volume-up text-purple-400 text-xs animate-pulse"></i>
                                                                        ) : (
                                                                            <span className="text-gray-500 text-xs">{index + 1}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className={`text-xs truncate ${index === currentIndex ? 'text-purple-400 font-medium' : 'text-white'
                                                                            }`}>
                                                                            {music.title || '未知标题'}
                                                                        </h4>
                                                                        <p className="text-xs text-gray-400 truncate">
                                                                            {music.artist || '未知艺术家'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <div className="px-4 py-8 text-center">
                                                        <i className="fas fa-music text-3xl text-gray-600 mb-2"></i>
                                                        <p className="text-gray-400 text-xs">播放列表为空</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* {!showPlaylist && <AudioVisualizer audioRef={audioRef} musicUrl={getFullUrl(currentMusic.path)} isPlaying={isPlaying}/>} */}
                            </div>

                            {/* 底部控制栏 */}
                            <div className="flex-shrink-0 mt-4">
                                <div className="p-4 rounded-2xl">
                                    {/* 歌曲信息 */}
                                    <div className="mb-3 text-center">
                                        <h1 className="text-xl font-bold text-white mb-0.5">
                                            {currentMusic.title || '未知标题'}
                                        </h1>
                                        <p className="text-sm text-gray-300">
                                            {currentMusic.artist || '未知艺术家'}
                                            {currentMusic.album && (
                                                <>
                                                    <span className="mx-2">•</span>
                                                    {currentMusic.album}
                                                </>
                                            )}
                                        </p>
                                    </div>

                                    {/* 进度条 */}
                                    <div className="mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-300 w-10 text-right">
                                                {formatTime(currentTime)}
                                            </span>
                                            <div
                                                className="flex-1 h-1.5 bg-gray-600 rounded-full cursor-pointer relative group"
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

                                    {/* 控制按钮 */}
                                    <div className="flex items-center justify-between">
                                        {/* 左侧：播放模式 */}
                                        <div className="flex items-center gap-3 w-20">
                                            <button
                                                onClick={togglePlayMode}
                                                className="text-gray-300 hover:text-white transition-colors relative"
                                                title={getPlayModeTitle()}
                                            >
                                                <i className={`fas ${getPlayModeIcon()} text-lg`}></i>
                                                {playMode === 'single' && (
                                                    <span className="absolute -top-1 -right-1 min-w-[12px] h-3 px-0.5 bg-purple-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                                                        1
                                                    </span>
                                                )}
                                            </button>
                                        </div>

                                        {/* 中间：播放控制 */}
                                        <div className="flex items-center gap-6">
                                            <button
                                                onClick={playPrevious}
                                                className="text-gray-300 hover:text-white transition-colors"
                                                title="上一曲"
                                            >
                                                <i className="fas fa-step-backward text-xl"></i>
                                            </button>

                                            <button
                                                onClick={togglePlay}
                                                className="w-14 h-14 rounded-full bg-white text-purple-600 hover:bg-gray-100 transition-all hover:scale-110 flex items-center justify-center shadow-lg"
                                                title={isPlaying ? '暂停' : '播放'}
                                            >
                                                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-xl ${!isPlaying ? 'ml-0.5' : ''}`}></i>
                                            </button>

                                            <button
                                                onClick={playNext}
                                                className="text-gray-300 hover:text-white transition-colors"
                                                title="下一曲"
                                            >
                                                <i className="fas fa-step-forward text-xl"></i>
                                            </button>
                                        </div>

                                        {/* 右侧：音量和喜欢 */}
                                        <div className="flex items-center gap-3 w-20 justify-end">
                                            <button
                                                className="text-gray-300 hover:text-red-400 transition-colors"
                                                title="喜欢"
                                            >
                                                <i className="far fa-heart text-lg"></i>
                                            </button>

                                            <div className="relative group">
                                                <button
                                                    onClick={toggleMute}
                                                    className="text-gray-300 hover:text-white transition-colors"
                                                    title={isMuted ? '取消静音' : '静音'}
                                                >
                                                    <i className={`fas ${isMuted ? 'fa-volume-mute' : volume > 0.5 ? 'fa-volume-up' : 'fa-volume-down'} text-lg`}></i>
                                                </button>

                                                {/* 音量滑块 */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                                    <div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-2">
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
                                                                height: '80px',
                                                                width: '20px'
                                                            }}
                                                        />
                                                        <div className="mt-1 text-center text-xs text-gray-300 font-medium">
                                                            {Math.round((isMuted ? 0 : volume) * 100)}%
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
                        {/* <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-2">
                                <i className="fas fa-align-left text-purple-400"></i>
                                <span className="text-white font-semibold">歌词</span>
                            </div>
                                <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setLyricsModalOpen(true)}
                                    className="px-3 py-1.5 rounded-lg bg-white/10 text-xs text-white hover:bg-white/20 transition-colors"
                                    title="搜索歌词"
                                >
                                    <i className="fas fa-search mr-1"></i>
                                    搜索
                                </button>
                                <button
                                    onClick={() => fetchLyrics(currentMusic?.id)}
                                    className="px-3 py-1.5 rounded-lg bg-white/10 text-xs text-white hover:bg-white/20 transition-colors"
                                    title="重新获取"
                                >
                                    <i className="fas fa-sync-alt mr-1"></i>
                                    刷新
                                </button>
                            </div>
                            </div>
                        </div> */}
                    </div>
                </div>
                <div className="w-3/5 rounded-2xl overflow-hidden">
                    {isLoadingLyrics ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-gray-400 text-sm">加载歌词中...</p>
                            </div>
                        </div>
                    ) : (
                        <LyricsDisplay
                            lyrics={lyrics}
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
                onSave={handleSaveLyrics}
            />
        </div>,
        document.body
    );
};

export default FullPlayer;