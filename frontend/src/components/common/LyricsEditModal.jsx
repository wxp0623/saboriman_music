import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api.js';

const LyricsEditModal = ({ isOpen, onClose, music, currentLyrics, onSave }) => {
  const [lyrics, setLyrics] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const formatted = formatLyrics(currentLyrics || '');
      setLyrics(formatted);
      setError('');
    }
  }, [isOpen, currentLyrics]);

  // 格式化歌词函数
  const formatLyrics = (text) => {
    if (!text) return '';
    
    // 移除开头的元数据行（如 "出品"、"作曲" 等）
    const lines = text.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      // 跳过空行
      if (!trimmed) return false;
      
      // 检查是否是元数据行（包含冒号但不是时间戳）
      if (trimmed.includes(':') && !trimmed.match(/\[\d{2}:\d{2}\.\d{2,3}\]/)) {
        // 如果是 [xx:xx] 格式的元数据，跳过
        if (trimmed.match(/^\[.*:.*\]/)) {
          return false;
        }
      }
      
      return true;
    });

    // 移除 \n 转义字符
    let result = filteredLines.join('\n').replace(/\\n/g, '\n');
    
    // 确保每个时间戳都在新行开始
    result = result.replace(/\]\s*\[/g, ']\n[');
    
    // 移除多余的空行
    result = result.replace(/\n{3,}/g, '\n\n');
    
    return result.trim();
  };

  const handleFormat = () => {
    const formatted = formatLyrics(lyrics);
    setLyrics(formatted);
  };

  const handleSave = async () => {
    if (!music?.id) {
      setError('音乐信息不完整');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await api.musics.saveLyrics(music.id, { lyrics });
      const result = response.data;
      if (!response.error) {
        onSave?.(lyrics);
        onClose();
      } else {
        setError(result.message || '保存失败');
      }
    } catch (err) {
      console.error('保存歌词失败:', err);
      setError('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-3xl max-h-[80vh] bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 rounded-2xl shadow-2xl border border-white/10 flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">设置歌词</h2>
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

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden px-6 py-4">
          <div className="h-full flex flex-col">
            {/* 提示信息 */}
            <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <i className="fas fa-info-circle text-blue-400 mt-0.5"></i>
                <div className="text-sm text-gray-300">
                  <p className="font-medium mb-1">LRC 格式说明：</p>
                  <p className="text-xs text-gray-400">
                    每行格式：[分:秒.毫秒]歌词内容，例如：[00:12.50]第一行歌词
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    也可以直接粘贴纯文本歌词，点击"格式化"按钮自动清理
                  </p>
                </div>
              </div>
            </div>

            {/* 编辑器 */}
            <div className="flex-1 overflow-hidden">
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="请输入歌词内容...&#10;&#10;LRC 格式示例：&#10;[00:12.50]第一行歌词&#10;[00:17.20]第二行歌词&#10;&#10;或直接粘贴纯文本歌词"
                className="w-full h-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-400/50 transition-colors font-mono text-sm"
                style={{ minHeight: '300px' }}
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <div className="text-sm text-gray-400">
            共 {lyrics.split('\n').filter(line => line.trim()).length} 行
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleFormat}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center gap-2"
              title="移除元数据和多余空行"
            >
              <i className="fas fa-magic"></i>
              格式化
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  保存中...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  保存
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LyricsEditModal;