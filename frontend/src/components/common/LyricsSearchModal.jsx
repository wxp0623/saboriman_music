import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { searchLyrics, getLyricsById } from '../../utils/geciyiSearch.js';

const LyricsSearchModal = ({ isOpen, onClose, music, onApply }) => {
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [error, setError] = useState('');
  const [selectedLyrics, setSelectedLyrics] = useState('');

  useEffect(() => {
    if (isOpen && music) {
      // 自动填充搜索关键词
      const searchKeyword = music.title.trim();
      setKeyword(searchKeyword);
      setSearchResults([]);
      setSelectedLyrics('');
      setError('');
      
      // 自动搜索
      if (searchKeyword) {
        handleSearch(searchKeyword);
      }
    }
  }, [isOpen, music]);

  const handleSearch = async (searchKeyword = keyword) => {
    if (!searchKeyword.trim()) {
      setError('请输入搜索关键词');
      return;
    }

    setIsSearching(true);
    setError('');
    setSearchResults([]);
    setSelectedLyrics('');

    try {
      const results = await searchLyrics(searchKeyword);
      setSearchResults(results || []);
      
      if (!results || results.length === 0) {
        setError('未找到相关歌词');
      }
    } catch (err) {
      console.error('搜索歌词失败:', err);
      setError(err.message || '搜索失败，请重试');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSong = async (song) => {
    setIsLoadingLyrics(true);
    setError('');
    setSelectedLyrics('');

    try {
      const lyricsData = await getLyricsById(song.id, keyword);
      setSelectedLyrics(lyricsData || '');
      
      if (!lyricsData) {
        setError('该歌曲暂无歌词');
      }
    } catch (err) {
      console.error('获取歌词失败:', err);
      setError(err.message || '获取歌词失败，请重试');
    } finally {
      setIsLoadingLyrics(false);
    }
  };

  const handleApply = () => {
    if (selectedLyrics) {
      onApply?.(selectedLyrics);
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 sbrm-bg-overlay backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-4xl max-h-[85vh] sbrm-bg-glass sbrm-rounded-2xl sbrm-shadow-2xl sbrm-border sbrm-border-tertiary flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 sbrm-border-b sbrm-border-divider">
          <div>
            <h2 className="text-xl font-bold sbrm-text-primary">搜索歌词</h2>
            <p className='text-sm sbrm-text-secondary'>来源：歌词易 ※请尽量使用中文关键词检索</p>
            <p className="text-sm sbrm-text-secondary mt-1">
              {music?.title || '未知标题'} - {music?.artist || '未知艺术家'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center sbrm-text-primary-1 hover:sbrm-text-primary hover:sbrm-bg-hover sbrm-rounded-full sbrm-transition"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 搜索栏 */}
        <div className="px-6 py-4 sbrm-border-b sbrm-border-divider">
          <div className="flex gap-3">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入歌曲名或艺术家..."
              className="flex-1 px-4 py-2 sbrm-bg-secondary sbrm-border sbrm-border-primary sbrm-rounded-lg sbrm-text-primary placeholder:sbrm-text-tertiary focus:outline-none focus:sbrm-border-accent-primary sbrm-transition"
            />
            <button
              onClick={() => handleSearch()}
              disabled={isSearching}
              className="px-6 py-2 sbrm-rounded-lg sbrm-bg-gradient sbrm-text-on-accent hover:sbrm-opacity-90 sbrm-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 sbrm-shadow-md"
            >
              {isSearching ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  搜索中...
                </>
              ) : (
                <>
                  <i className="fas fa-search"></i>
                  搜索
                </>
              )}
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden flex">
          {/* 左侧：搜索结果列表 */}
          <div className="w-2/5 sbrm-border-r sbrm-border-divider overflow-y-auto sbrm-scroll-y">
            {error && searchResults.length === 0 ? (
              <div className="p-6 text-center">
                <i className="fas fa-exclamation-circle text-4xl sbrm-text-tertiary mb-3"></i>
                <p className="sbrm-text-secondary">{error}</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y sbrm-border-divider">
                {searchResults.map((song, index) => (
                  <div
                    key={song.id || index}
                    onClick={() => handleSelectSong(song)}
                    className="p-4 hover:sbrm-bg-hover cursor-pointer sbrm-transition group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 flex-shrink-0 sbrm-rounded-md sbrm-bg-accent-alpha-20 flex items-center justify-center sbrm-text-accent-primary text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <img
                          src={song.cover || '/default_cover.png'}
                          alt={song.name || '歌曲封面'}
                          className="w-12 h-12 sbrm-rounded-lg object-cover mb-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="sbrm-text-primary font-medium truncate group-hover:sbrm-text-accent-primary sbrm-transition">
                          {song.name || '未知标题'}
                        </h4>
                        <p className="text-sm sbrm-text-secondary truncate">
                          {(song.artist || []).join(', ') || '未知艺术家'}
                        </p>
                        {song.album_name && (
                          <p className="text-xs sbrm-text-tertiary truncate mt-1">
                            专辑：{song.album_name}
                          </p>
                        )}
                      </div>
                      <i className="fas fa-chevron-right sbrm-text-tertiary group-hover:sbrm-text-accent-primary sbrm-transition"></i>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <i className="fas fa-music text-4xl sbrm-text-tertiary mb-3"></i>
                <p className="sbrm-text-secondary">输入关键词搜索歌词</p>
              </div>
            )}
          </div>

          {/* 右侧：歌词预览 */}
          <div className="flex-1 overflow-y-auto p-6 sbrm-scroll-y">
            {isLoadingLyrics ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-8 h-8 border-3 sbrm-border-accent-primary border-t-transparent sbrm-rounded-full animate-spin mb-3"></div>
                <p className="sbrm-text-secondary text-sm">加载歌词中...</p>
              </div>
            ) : selectedLyrics ? (
              <div className="sbrm-bg-secondary sbrm-rounded-lg p-4 sbrm-border sbrm-border-primary">
                <pre className="sbrm-text-primary text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {selectedLyrics.lyrics}
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full sbrm-text-tertiary">
                <i className="fas fa-hand-pointer text-4xl mb-3"></i>
                <p>点击左侧歌曲查看歌词</p>
              </div>
            )}
            
            {error && selectedLyrics === '' && !isLoadingLyrics && (
              <div className="p-4 sbrm-bg-error sbrm-border sbrm-border-error sbrm-rounded-lg">
                <div className="flex items-center gap-2 sbrm-text-error text-sm">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 sbrm-border-t sbrm-border-divider">
          <button
            onClick={onClose}
            className="px-4 py-2 sbrm-rounded-lg sbrm-bg-secondary sbrm-text-primary hover:sbrm-bg-hover sbrm-transition sbrm-border sbrm-border-primary"
          >
            取消
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedLyrics}
            className="px-4 py-2 sbrm-rounded-lg sbrm-bg-gradient sbrm-text-on-accent hover:sbrm-opacity-90 sbrm-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 sbrm-shadow-md"
          >
            <i className="fas fa-check"></i>
            应用歌词
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LyricsSearchModal;