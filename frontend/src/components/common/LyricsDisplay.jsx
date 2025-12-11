import React, { useEffect, useRef, useState } from 'react';

const LyricsDisplay = ({ lyrics, currentTime }) => {
    const [parsedLyrics, setParsedLyrics] = useState([]);
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

    /** ------- ② 设置歌词 ------- **/
    useEffect(() => {
        const parsed = parseLyrics(lyrics);
        setParsedLyrics(parsed);
        lineRefs.current = new Array(parsed.length);
    }, [lyrics]);

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

            // ⭐ 重点：使用统一固定高度的行，不受放大缩小影响 offsetTop
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

    /** ------- ⑤ 渲染歌词（不再被裁剪） ------- **/
    return (
        <div
            ref={containerRef}
            className="h-full overflow-y-auto px-4 relative"
            style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
            }}
        >
            <div className="py-28" />

            {parsedLyrics.map((line, index) => {
                const isCurrent = index === currentLineIndex;
                const distance = Math.abs(index - currentLineIndex);

                const opacity =
                    distance === 0 ? 1 :
                        distance === 1 ? 0.75 :
                            distance === 2 ? 0.45 : 0.25;

                return (
                    <div
                        key={`${line.time}-${index}`}
                        ref={el => (lineRefs.current[index] = el)}
                        style={{
                            height: "54px",        // ⭐ 固定高度（网易云的秘诀）
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "visible",
                            margin: "12px 0",
                        }}
                    >
                        <div
                            className="transition-all duration-300 origin-center select-none text-center"
                            style={{
                                transform: `scale(${isCurrent ? 1.25 : 1})`,
                                opacity,
                                fontSize: isCurrent ? "1.95rem" : "1.35rem",
                                fontWeight: isCurrent ? 700 : 400,
                                lineHeight: "1.35",
                                color: "#fff",
                                whiteSpace: "nowrap",
                                overflow: "visible",
                            }}
                        >
                            {line.text}
                        </div>
                    </div>
                );
            })}

            <div className="py-32" />
        </div>
    );
};

export default LyricsDisplay;
