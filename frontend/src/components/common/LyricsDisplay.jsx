import React, { useEffect, useRef, useState } from 'react';

const LyricsDisplay = ({ lyrics, translation, currentTime }) => {
    const [parsedLyrics, setParsedLyrics] = useState([]);
    const [parsedTranslation, setParsedTranslation] = useState([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(-1);
    const containerRef = useRef(null);
    const lineRefs = useRef([]);

    /** ------- ① 解析 LRC ------- **/
    const parseLyrics = (lyricsText) => {
        if (!lyricsText) return [];
        const lines = lyricsText.split('\n');
        const parsed = [];

        const timeRegex = /\[(\d{2,}):(\d{2})\.?(\d{2,3})?\]/g;

        lines.forEach(line => {
            if (!line.trim()) return;
            if (line.match(/^\[(ti|ar|al|by|offset|id):/i)) return;

            const matches = [...line.matchAll(timeRegex)];
            if (!matches.length) return;

            const text = line.replace(timeRegex, '').trim();
            if (!text) return;

            matches.forEach(match => {
                const m = parseInt(match[1]);
                const s = parseInt(match[2]);
                const ms = match[3] ? parseInt(match[3].padEnd(3, '0')) : 0;

                parsed.push({
                    time: m * 60 + s + ms / 1000,
                    text
                });
            });
        });

        return parsed.sort((a, b) => a.time - b.time);
    };

    /** ------- ② 设置歌词和翻译 ------- **/
    useEffect(() => {
        const parsed = parseLyrics(lyrics);
        setParsedLyrics(parsed);
        lineRefs.current = new Array(parsed.length);
    }, [lyrics]);

    useEffect(() => {
        const parsed = parseLyrics(translation);
        setParsedTranslation(parsed);
    }, [translation]);

    /** ------- ③ 根据播放时间定位歌词行 ------- **/
    useEffect(() => {
        if (!parsedLyrics.length) return;

        let idx = -1;
        for (let i = 0; i < parsedLyrics.length; i++) {
            if (currentTime >= parsedLyrics[i].time) idx = i;
            else break;
        }

        setCurrentLineIndex(idx);
    }, [currentTime, parsedLyrics]);

    /** ------- ④ 网易云：当前行强制居中 + 丝滑缓动 ------- **/
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        if (currentLineIndex < 0) {
            container.scrollTo({ top: 0, behavior: "instant" });
            return;
        }

        const currentLine = lineRefs.current[currentLineIndex];
        if (!currentLine) return;

        requestAnimationFrame(() => {
            const containerHeight = container.clientHeight;
            const scrollHeight = container.scrollHeight;

            const lineTop = currentLine.offsetTop;
            const lineHeight = currentLine.offsetHeight;

            const targetTop = lineTop - containerHeight / 2 + lineHeight / 2;

            const safeTop = Math.min(
                Math.max(0, targetTop),
                scrollHeight - containerHeight
            );

            // 自定义动画（网易云式）
            const start = container.scrollTop;
            const end = safeTop;
            const distance = end - start;
            const duration = 420;
            let startTime = null;

            const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

            const animate = (time) => {
                if (!startTime) startTime = time;
                const progress = Math.min((time - startTime) / duration, 1);
                const eased = easeOutCubic(progress);

                container.scrollTop = start + distance * eased;

                if (progress < 1) requestAnimationFrame(animate);
            };

            requestAnimationFrame(animate);
        });
    }, [currentLineIndex]);

    /** ------- ⑥ 获取对应时间的翻译 ------- **/
    const getTranslationForIndex = (index) => {
        if (index < 0 || index >= parsedLyrics.length) return '';
        if (parsedTranslation.length === 0) return '';

        const currentTime = parsedLyrics[index].time;
        
        // 查找时间最接近的翻译（允许 1 秒误差）
        let closestTranslation = '';
        let minDiff = 1.0; // 增加误差容忍度到 1 秒
        
        for (let i = 0; i < parsedTranslation.length; i++) {
            const diff = Math.abs(parsedTranslation[i].time - currentTime);
            if (diff < minDiff) {
                minDiff = diff;
                closestTranslation = parsedTranslation[i].text;
            }
        }
        
        return closestTranslation;
    };

    /** ------- ⑤ 渲染歌词（支持双语） ------- **/
    return (
        <div
            ref={containerRef}
            className="h-full overflow-y-auto px-4 relative sbrm-scroll-y"
        >
            <div className="py-28" />

            {parsedLyrics.length > 0 ? (
                parsedLyrics.map((line, index) => {
                    const isCurrent = index === currentLineIndex;
                    const distance = Math.abs(index - currentLineIndex);
                    const translationText = getTranslationForIndex(index);

                    return (
                        <div
                            key={`${line.time}-${index}`}
                            ref={el => (lineRefs.current[index] = el)}
                            className="flex flex-col items-center justify-center overflow-visible my-3"
                            style={{
                                height: translationText ? "84px" : "54px",
                            }}
                        >
                            {/* 原文歌词 */}
                            <div
                                className={`sbrm-transition-all origin-center select-none text-center ${
                                    isCurrent 
                                        ? 'sbrm-text-primary' 
                                        : distance === 1 
                                            ? 'sbrm-text-primary-1' 
                                            : 'sbrm-text-primary-2'
                                }`}
                                style={{
                                    transform: `scale(${isCurrent ? 1.25 : 1})`,
                                    opacity: distance === 0 ? 1 :
                                             distance === 1 ? 0.75 :
                                             distance === 2 ? 0.45 : 0.25,
                                    fontSize: isCurrent ? "1.95rem" : "1.35rem",
                                    fontWeight: isCurrent ? 700 : 400,
                                    lineHeight: "1.35",
                                    whiteSpace: "nowrap",
                                    overflow: "visible",
                                }}
                            >
                                {line.text}
                            </div>

                            {/* 翻译歌词 */}
                            {translationText && (
                                <div
                                    className={`sbrm-transition-all origin-center select-none text-center mt-1.5 ${
                                        isCurrent 
                                            ? 'sbrm-text-primary-1' 
                                            : 'sbrm-text-primary-2'
                                    }`}
                                    style={{
                                        transform: `scale(${isCurrent ? 1.1 : 0.95})`,
                                        opacity: (distance === 0 ? 1 :
                                                 distance === 1 ? 0.75 :
                                                 distance === 2 ? 0.45 : 0.25) * 0.85,
                                        fontSize: isCurrent ? "1.15rem" : "0.95rem",
                                        fontWeight: isCurrent ? 500 : 400,
                                        lineHeight: "1.4",
                                        whiteSpace: "nowrap",
                                        overflow: "visible",
                                    }}
                                >
                                    {translationText}
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <div className="flex flex-col items-center justify-center h-full">
                    <i className="fas fa-music text-6xl sbrm-text-tertiary mb-4 sbrm-opacity-50"></i>
                    <p className="sbrm-text-tertiary text-lg">暂无歌词</p>
                    <p className="sbrm-text-tertiary text-sm mt-2 sbrm-opacity-70">
                        您可以点击搜索按钮查找歌词
                    </p>
                </div>
            )}

            <div className="py-32" />
        </div>
    );
};

export default LyricsDisplay;
