import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const PlayerContext = createContext();

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
};

export const PlayerProvider = ({ children }) => {
    const [currentMusic, setCurrentMusic] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playMode, setPlayMode] = useState('loop'); // 'loop', 'shuffle', 'single'
    const [playlist, setPlaylist] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);

    // 添加音频元素引用（单一实例）
    const audioRef = useRef(null);
    
    // 添加共享状态
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

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

    // 音频 URL
    const audioUrl = currentMusic?.path ? getFullUrl(currentMusic.path) : '';
    
    // 音频事件处理
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };
    
    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };
    
    const handleEnded = () => {
        if (playMode === 'single') {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(console.error);
            }
        } else {
            playNext();
        }
    };
    
    // 进度控制
    const seekTo = (time) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };
    
    // 音量控制
    const changeVolume = (newVolume) => {
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
        if (newVolume === 0) {
            setIsMuted(true);
        } else if (isMuted) {
            setIsMuted(false);
        }
    };
    
    // 静音切换
    const toggleMute = () => {
        if (isMuted) {
            changeVolume(volume || 0.5);
        } else {
            setIsMuted(true);
            if (audioRef.current) {
                audioRef.current.volume = 0;
            }
        }
    };
    
    // 当音乐改变时重置状态
    useEffect(() => {
        if (audioRef.current && currentMusic) {
            console.log('Loading new music:', audioUrl);
            audioRef.current.load();
            setCurrentTime(0);
            if (isPlaying) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error('播放失败:', error);
                        setIsPlaying(false);
                    });
                }
            }
        }
    }, [currentMusic?.id]);
    
    // 控制播放/暂停
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error('播放失败:', error);
                        setIsPlaying(false);
                    });
                }
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);
    
    // 初始化音量
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, []);

    // 播放指定索引的音乐
    const playMusicAtIndex = useCallback((index) => {
        if (playlist && playlist[index]) {
            setCurrentIndex(index);
            setCurrentMusic(playlist[index]);
            setIsPlaying(true);
        }
    }, [playlist]);

    // 播放单首音乐（添加到播放列表并播放）
    const playMusic = useCallback((music) => {
        setCurrentMusic(music);
        setIsPlaying(true);
        
        // 如果播放列表中没有这首歌，添加到列表
        const existingIndex = playlist.findIndex(m => m.id === music.id);
        if (existingIndex === -1) {
            const newPlaylist = [...playlist, music];
            setPlaylist(newPlaylist);
            setCurrentIndex(newPlaylist.length - 1);
        } else {
            setCurrentIndex(existingIndex);
        }
    }, [playlist]);

    // 设置播放列表并播放第一首
    const setPlaylistAndPlay = useCallback((musics, startIndex = 0) => {
        if (musics && musics.length > 0) {
            setPlaylist(musics);
            setCurrentIndex(startIndex);
            setCurrentMusic(musics[startIndex]);
            setIsPlaying(true);
        }
    }, []);

    // 下一曲
    const playNext = useCallback(() => {
        if (!playlist || playlist.length === 0) return;

        let nextIndex;
        
        switch (playMode) {
            case 'shuffle':
                // 随机播放：随机选择一首（但不是当前这首）
                do {
                    nextIndex = Math.floor(Math.random() * playlist.length);
                } while (nextIndex === currentIndex && playlist.length > 1);
                break;
                
            case 'single':
                // 单曲循环：保持当前索引
                nextIndex = currentIndex;
                break;
                
            case 'loop':
            default:
                // 列表循环：播放下一首，到末尾后回到开头
                nextIndex = (currentIndex + 1) % playlist.length;
                break;
        }

        setCurrentIndex(nextIndex);
        setCurrentMusic(playlist[nextIndex]);
        setIsPlaying(true);
    }, [playlist, currentIndex, playMode]);

    // 上一曲
    const playPrevious = useCallback(() => {
        if (!playlist || playlist.length === 0) return;

        let prevIndex;
        
        switch (playMode) {
            case 'shuffle':
                // 随机播放：随机选择一首
                do {
                    prevIndex = Math.floor(Math.random() * playlist.length);
                } while (prevIndex === currentIndex && playlist.length > 1);
                break;
                
            case 'single':
                // 单曲循环：保持当前索引
                prevIndex = currentIndex;
                break;
                
            case 'loop':
            default:
                // 列表循环：播放上一首，到开头后回到末尾
                prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
                break;
        }

        setCurrentIndex(prevIndex);
        setCurrentMusic(playlist[prevIndex]);
        setIsPlaying(true);
    }, [playlist, currentIndex, playMode]);

    // 切换播放/暂停
    const togglePlay = useCallback(() => {
        setIsPlaying(prev => !prev);
    }, []);

    // 切换播放模式
    const togglePlayMode = useCallback(() => {
        setPlayMode(prev => {
            switch (prev) {
                case 'loop':
                    return 'shuffle';
                case 'shuffle':
                    return 'single';
                case 'single':
                    return 'loop';
                default:
                    return 'loop';
            }
        });
    }, []);

    // 清空播放列表
    const clearPlaylist = useCallback(() => {
        setPlaylist([]);
        setCurrentIndex(-1);
        setCurrentMusic(null);
        setIsPlaying(false);
    }, []);

    // 从播放列表中移除歌曲
    const removeFromPlaylist = useCallback((index) => {
        const newPlaylist = playlist.filter((_, i) => i !== index);
        setPlaylist(newPlaylist);

        if (index === currentIndex) {
            // 如果删除的是当前播放的歌曲
            if (newPlaylist.length === 0) {
                setCurrentMusic(null);
                setCurrentIndex(-1);
                setIsPlaying(false);
            } else {
                const newIndex = Math.min(currentIndex, newPlaylist.length - 1);
                setCurrentIndex(newIndex);
                setCurrentMusic(newPlaylist[newIndex]);
            }
        } else if (index < currentIndex) {
            // 如果删除的歌曲在当前播放之前，索引需要减1
            setCurrentIndex(prev => prev - 1);
        }
    }, [playlist, currentIndex]);

    const value = {
        currentMusic,
        isPlaying,
        playMode,
        playlist,
        currentIndex,
        playMusic,
        playMusicAtIndex,
        setPlaylistAndPlay,
        togglePlay,
        playNext,
        playPrevious,
        togglePlayMode,
        setIsPlaying,
        clearPlaylist,
        removeFromPlaylist,
        audioRef,
        currentTime,
        duration,
        volume,
        isMuted,
        seekTo,
        changeVolume,
        toggleMute,
        handleTimeUpdate,
        handleLoadedMetadata,
        handleEnded,
    };

    return (
        <PlayerContext.Provider value={value}>
            {children}
            {/* 渲染音频元素 */}
            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                onError={(e) => {
                    console.error('音频加载错误:', e);
                    console.error('音频 URL:', audioUrl);
                }}
            />
        </PlayerContext.Provider>
    );
};