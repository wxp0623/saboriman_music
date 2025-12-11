import React, { useEffect, useRef, useState, useCallback } from 'react';

const AudioVisualizer = ({ audioRef, barCount = 50, barWidth = 12, maxHeight = 80 }) => {
  const [error, setError] = useState('');
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const frequencyBarsRef = useRef(null);
  const audioContextRef = useRef(null);
  const preAnalyzedDataRef = useRef(null); // 存储预分析的数据
  const animationIdRef = useRef(null);
  const isInitializedRef = useRef(false);

  /** ----------------------------
   * 预分析整个音频文件
   * ---------------------------- */
  const preAnalyzeAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !audio.src) {
      console.error('No audio source');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeProgress(0);
    console.log('Starting pre-analysis of audio...');

    try {
      // 创建离线音频上下文
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const offlineContext = new AudioContext();
      
      // 获取音频数据
      const response = await fetch(audio.src);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer);
      
      console.log('Audio decoded, duration:', audioBuffer.duration, 'seconds');

      // 创建离线分析器
      const analyser = offlineContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // 创建音频源
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      analyser.connect(offlineContext.destination);

      // 计算需要采样的帧数 (每100ms一帧)
      const sampleRate = 10; // 每秒10帧
      const duration = audioBuffer.duration;
      const totalFrames = Math.ceil(duration * sampleRate);
      const frameInterval = 1 / sampleRate;

      console.log('Will analyze', totalFrames, 'frames');

      // 存储预分析的数据
      const preAnalyzedData = [];

      // 由于 Web Audio API 的限制，我们需要用不同的方法
      // 使用 ScriptProcessorNode 或分段处理
      const chunkDuration = 0.1; // 100ms 每段
      const samplesPerChunk = Math.floor(audioBuffer.sampleRate * chunkDuration);
      
      for (let time = 0; time < duration; time += chunkDuration) {
        const frameData = new Uint8Array(bufferLength);
        
        // 计算这个时间点的频谱数据
        const startSample = Math.floor(time * audioBuffer.sampleRate);
        const endSample = Math.min(startSample + samplesPerChunk, audioBuffer.length);
        
        // 获取这段时间的音频数据并进行FFT分析
        const channelData = audioBuffer.getChannelData(0); // 只用第一个声道
        const segment = channelData.slice(startSample, endSample);
        
        // 简化的频谱计算（实际应用FFT，这里使用近似）
        for (let i = 0; i < bufferLength; i++) {
          const freq = (i / bufferLength) * (audioBuffer.sampleRate / 2);
          let magnitude = 0;
          
          // 简单的频率幅度计算
          for (let j = 0; j < segment.length; j++) {
            magnitude += Math.abs(segment[j]) / segment.length;
          }
          
          frameData[i] = Math.min(255, Math.floor(magnitude * 255 * 10));
        }
        
        preAnalyzedData.push({
          time: time,
          data: frameData
        });

        // 更新进度
        setAnalyzeProgress(Math.floor((time / duration) * 100));
      }

      preAnalyzedDataRef.current = preAnalyzedData;
      console.log('Pre-analysis complete, total frames:', preAnalyzedData.length);
      setIsAnalyzing(false);
      setAnalyzeProgress(100);

      // 关闭离线上下文
      offlineContext.close();

    } catch (err) {
      console.error('Pre-analysis error:', err);
      setError('音频预分析失败：' + err.message);
      setIsAnalyzing(false);
    }
  }, [audioRef]);

  /** ----------------------------
   * 根据当前播放时间获取频谱数据
   * ---------------------------- */
  const getFrequencyDataAtTime = useCallback((currentTime) => {
    if (!preAnalyzedDataRef.current || preAnalyzedDataRef.current.length === 0) {
      return null;
    }

    // 找到最接近当前时间的帧
    const frames = preAnalyzedDataRef.current;
    let closestFrame = frames[0];
    let minDiff = Math.abs(frames[0].time - currentTime);

    for (let i = 1; i < frames.length; i++) {
      const diff = Math.abs(frames[i].time - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestFrame = frames[i];
      } else {
        break; // 已经过了最近点
      }
    }

    return closestFrame.data;
  }, []);

  /** ----------------------------
   * 开始可视化动画（使用预分析的数据）
   * ---------------------------- */
  const startVisualization = useCallback(() => {
    console.log('Starting visualization animation...');
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }

    const animate = () => {
      const audio = audioRef.current;
      if (!audio || audio.paused) {
        return;
      }

      animationIdRef.current = requestAnimationFrame(animate);

      // 获取当前播放时间对应的频谱数据
      const currentTime = audio.currentTime;
      const frequencyData = getFrequencyDataAtTime(currentTime);

      if (!frequencyData) {
        return;
      }

      // 更新可视化
      const bars = frequencyBarsRef.current?.querySelectorAll('.freq-bar');
      if (!bars || bars.length === 0) {
        return;
      }

      const len = frequencyData.length;
      const barsCount = bars.length;

      for (let i = 0; i < barsCount; i++) {
        const index = Math.floor(Math.pow(i / barsCount, 1.5) * len);
        const value = frequencyData[index] || 0;
        
        let height = (value / 255) * maxHeight;
        height = Math.max(height, 2);

        const bar = bars[i];
        const currentHeight = parseFloat(bar.style.height) || 2;
        const newHeight = currentHeight * 0.7 + height * 0.3;
        
        bar.style.height = `${newHeight}px`;

        const intensity = newHeight / maxHeight;
        if (intensity > 0.7) {
          bar.style.background = 'linear-gradient(to top, #ff0080, #ff8a00)';
        } else if (intensity > 0.4) {
          bar.style.background = 'linear-gradient(to top, #00ffcc, #0080ff)';
        } else {
          bar.style.background = 'linear-gradient(to top, #fff, #888)';
        }
      }
    };
    
    animate();
  }, [audioRef, getFrequencyDataAtTime, maxHeight]);

  /** ----------------------------
   * 停止可视化
   * ---------------------------- */
  const stopVisualization = useCallback(() => {
    console.log('Stopping visualization...');
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    setIsVisualizing(false);
  }, []);

  /** ----------------------------
   * 处理音频事件
   * ---------------------------- */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.error('No audio element provided');
      return;
    }

    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded, starting pre-analysis...');
      preAnalyzeAudio();
    };

    const handlePlay = () => {
      console.log('Play event triggered');
      if (preAnalyzedDataRef.current && preAnalyzedDataRef.current.length > 0) {
        startVisualization();
        setIsVisualizing(true);
      }
    };

    const handlePause = () => {
      console.log('Pause event triggered');
      stopVisualization();
    };

    const handleEnded = () => {
      console.log('Ended event triggered');
      stopVisualization();
    };

    const handleError = (e) => {
      console.error('Audio error:', e);
      setError('音频加载失败');
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // 如果音频已经加载，立即预分析
    if (audio.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      
      stopVisualization();
    };
  }, [audioRef, preAnalyzeAudio, startVisualization, stopVisualization]);

  return (
    <div style={styles.container}>
      {error ? (
        <div style={styles.errorMsg}>
          {error}
          <button 
            onClick={() => {
              setError('');
              preAnalyzeAudio();
            }}
            style={styles.retryButton}
          >
            重试
          </button>
        </div>
      ) : isAnalyzing ? (
        <div style={styles.analyzingMsg}>
          <div>正在分析音频文件...</div>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${analyzeProgress}%`}} />
          </div>
          <div>{analyzeProgress}%</div>
        </div>
      ) : (
        <>
          <div ref={frequencyBarsRef} style={styles.frequencyBars}>
            {Array.from({ length: barCount }).map((_, i) => (
              <div
                key={i}
                className="freq-bar"
                style={{
                  width: `${barWidth}px`,
                  height: '2px',
                  background: 'linear-gradient(to top, #fff, #888)',
                  borderRadius: '2px',
                  transition: 'height 0.05s ease-out, background 0.2s ease',
                  willChange: 'height, background',
                  transformOrigin: 'bottom center',
                }}
              />
            ))}
          </div>
          {!isVisualizing && preAnalyzedDataRef.current && (
            <div style={styles.statusHint}>
              点击播放查看可视化效果
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    background: "transparent",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    minHeight: "120px",
    padding: "10px",
    position: 'relative',
  },
  frequencyBars: {
    display: "flex",
    gap: "4px",
    alignItems: "flex-end",
    height: "80px",
    justifyContent: "center",
    width: "100%",
    padding: "10px 0",
  },
  statusHint: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: "0.9em",
    marginTop: "10px",
    fontStyle: "italic",
    textAlign: "center",
    padding: "10px",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: "4px",
  },
  analyzingMsg: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "1em",
    textAlign: "center",
    padding: "20px",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  progressBar: {
    width: '200px',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(to right, #00ffcc, #0080ff)',
    transition: 'width 0.3s ease',
  },
  errorMsg: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "1em",
    textAlign: "center",
    padding: "20px",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  retryButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    padding: '8px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9em',
    transition: 'background 0.2s',
  },
};

export default AudioVisualizer;