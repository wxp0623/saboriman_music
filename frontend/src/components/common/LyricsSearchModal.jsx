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
      onApply?.(selectedLyrics.lyrics);
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 rounded-2xl shadow-2xl border border-white/10 flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">搜索歌词</h2>
            <p className="text-sm text-gray-400 mt-1">
              {music?.title || '未知标题'} - {music?.artist || '未知艺术家'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 搜索栏 */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex gap-3">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入歌曲名或艺术家..."
              className="flex-1 px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-400/50 transition-colors"
            />
            <button
              onClick={() => handleSearch()}
              disabled={isSearching}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
          <div className="w-2/5 border-r border-white/10 overflow-y-auto">
            {error && searchResults.length === 0 ? (
              <div className="p-6 text-center">
                <i className="fas fa-exclamation-circle text-4xl text-gray-600 mb-3"></i>
                <p className="text-gray-400">{error}</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-white/5">
                {searchResults.map((song, index) => (
                  <div
                    key={song.id || index}
                    onClick={() => handleSelectSong(song)}
                    className="p-4 hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 flex-shrink-0 rounded bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <img
                          src={song.cover || '/default_cover.png'}
                          alt={song.name || '歌曲封面'}
                          className="w-12 h-12 rounded-lg object-cover mb-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate group-hover:text-purple-400 transition-colors">
                          {song.name || '未知标题'}
                        </h4>
                        <p className="text-sm text-gray-400 truncate">
                          {(song.artist || []).join(', ') || '未知艺术家'}
                        </p>
                        {song.album_name && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            专辑：{song.album_name}
                          </p>
                        )}
                      </div>
                      <i className="fas fa-chevron-right text-gray-600 group-hover:text-purple-400 transition-colors"></i>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <i className="fas fa-music text-4xl text-gray-600 mb-3"></i>
                <p className="text-gray-400">输入关键词搜索歌词</p>
              </div>
            )}
          </div>

          {/* 右侧：歌词预览 */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingLyrics ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-gray-400 text-sm">加载歌词中...</p>
              </div>
            ) : selectedLyrics ? (
              <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                <pre className="text-white text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {selectedLyrics.lyrics}
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <i className="fas fa-hand-pointer text-4xl mb-3"></i>
                <p>点击左侧歌曲查看歌词</p>
              </div>
            )}
            
            {error && selectedLyrics === '' && !isLoadingLyrics && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedLyrics}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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