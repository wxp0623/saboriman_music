import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api.js';

const LyricsEditModal = ({ isOpen, onClose, music, currentLyrics, currentTranslation, onSave }) => {
  const [lyrics, setLyrics] = useState('');
  const [translation, setTranslation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('lyrics'); // 'lyrics' | 'translation'

  useEffect(() => {
    if (isOpen) {
      const formatted = formatLyrics(currentLyrics || '');
      const formattedTranslation = formatLyrics(currentTranslation || '');
      setLyrics(formatted);
      setTranslation(formattedTranslation);
      setError('');
    }
  }, [isOpen, currentLyrics, currentTranslation]);

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
    if (activeTab === 'lyrics') {
      const formatted = formatLyrics(lyrics);
      setLyrics(formatted);
    } else {
      const formatted = formatLyrics(translation);
      setTranslation(formatted);
    }
  };

  const handleSave = async () => {
    if (!music?.id) {
      setError('音乐信息不完整');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // 保存原文歌词
      await api.musics.saveLyrics(music.id, { lyrics });
      
      // 保存翻译歌词
      if (translation) {
        await api.lyrics.saveTranslationLyrics(music.id, translation);
      }
      
      onSave?.(lyrics, translation);
      onClose();
    } catch (err) {
      console.error('保存歌词失败:', err);
      setError('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentText = activeTab === 'lyrics' ? lyrics : translation;
  const setCurrentText = activeTab === 'lyrics' ? setLyrics : setTranslation;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 sbrm-bg-overlay backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-3xl max-h-[80vh] sbrm-bg-glass sbrm-rounded-2xl sbrm-shadow-2xl sbrm-border sbrm-border-tertiary flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 sbrm-border-b sbrm-border-divider">
          <div>
            <h2 className="text-xl font-bold sbrm-text-primary">设置歌词</h2>
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

        {/* 标签页 */}
        <div className="flex items-center gap-2 px-6 pt-4">
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`px-4 py-2 sbrm-rounded-lg text-sm font-medium sbrm-transition ${
              activeTab === 'lyrics'
                ? 'sbrm-bg-accent-alpha-20 sbrm-text-accent-primary'
                : 'sbrm-text-primary-1 hover:sbrm-bg-hover hover:sbrm-text-primary'
            }`}
          >
            <i className="fas fa-file-alt mr-2"></i>
            原文歌词
          </button>
          <button
            onClick={() => setActiveTab('translation')}
            className={`px-4 py-2 sbrm-rounded-lg text-sm font-medium sbrm-transition ${
              activeTab === 'translation'
                ? 'sbrm-bg-accent-alpha-20 sbrm-text-accent-primary'
                : 'sbrm-text-primary-1 hover:sbrm-bg-hover hover:sbrm-text-primary'
            }`}
          >
            <i className="fas fa-language mr-2"></i>
            翻译歌词
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden px-6 py-4">
          <div className="h-full flex flex-col">
            {/* 提示信息 */}
            <div className="mb-3 p-3 sbrm-bg-info sbrm-border sbrm-border-info sbrm-rounded-lg">
              <div className="flex items-start gap-2">
                <i className="fas fa-info-circle sbrm-text-accent-primary mt-0.5"></i>
                <div className="text-sm sbrm-text-primary-1">
                  <p className="font-medium mb-1">LRC 格式说明：</p>
                  <p className="text-xs sbrm-text-secondary">
                    每行格式：[分:秒.毫秒]歌词内容，例如：[00:12.50]第一行歌词
                  </p>
                  <p className="text-xs sbrm-text-secondary mt-1">
                    {activeTab === 'translation' 
                      ? '翻译歌词的时间戳应与原文歌词对应，确保同步显示'
                      : '也可以直接粘贴纯文本歌词，点击"格式化"按钮自动清理'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* 编辑器 */}
            <div className="flex-1 overflow-hidden">
              <textarea
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                placeholder={
                  activeTab === 'lyrics'
                    ? "请输入歌词内容...\n\nLRC 格式示例：\n[00:12.50]第一行歌词\n[00:17.20]第二行歌词\n\n或直接粘贴纯文本歌词"
                    : "请输入翻译歌词...\n\nLRC 格式示例：\n[00:12.50]翻译的第一行\n[00:17.20]翻译的第二行\n\n时间戳应与原文歌词对应"
                }
                className="w-full h-full px-4 py-3 sbrm-bg-secondary sbrm-border sbrm-border-primary sbrm-rounded-lg sbrm-text-primary placeholder:sbrm-text-tertiary resize-none focus:outline-none focus:sbrm-border-accent-primary sbrm-transition font-mono text-sm sbrm-scroll-y"
                style={{ minHeight: '300px' }}
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div class="mt-3 p-3 sbrm-bg-error sbrm-border sbrm-border-error sbrm-rounded-lg">
                <div class="flex items-center gap-2 sbrm-text-error text-sm">
                  <i class="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between px-6 py-4 sbrm-border-t sbrm-border-divider">
          <div className="text-sm sbrm-text-secondary">
            共 {currentText.split('\n').filter(line => line.trim()).length} 行
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleFormat}
              className="px-4 py-2 sbrm-rounded-lg sbrm-bg-secondary sbrm-text-primary hover:sbrm-bg-hover sbrm-transition flex items-center gap-2 sbrm-border sbrm-border-primary"
              title="移除元数据和多余空行"
            >
              <i className="fas fa-magic"></i>
              格式化
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 sbrm-rounded-lg sbrm-bg-secondary sbrm-text-primary hover:sbrm-bg-hover sbrm-transition sbrm-border sbrm-border-primary"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 sbrm-rounded-lg sbrm-bg-gradient sbrm-text-on-accent hover:sbrm-opacity-90 sbrm-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 sbrm-shadow-md"
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