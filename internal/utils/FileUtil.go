package utils

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// SaveLyricsToFile 将歌词保存到音乐所在文件夹下的 lyrics 子文件夹
// musicPath: 音乐文件的完整路径，例如 "/music/artist/song.mp3"
// lyrics: 歌词内容
// 返回: 歌词文件的相对路径（相对于音乐根目录）
func SaveLyricsToFile(musicPath, lyrics string) (string, error) {
	if lyrics == "" {
		return "", nil
	}

	// 获取音乐文件所在目录
	musicDir := filepath.Dir(musicPath)

	// 创建 lyrics 子文件夹
	lyricsDir := filepath.Join(musicDir, "lyrics")
	if err := os.MkdirAll(lyricsDir, 0755); err != nil {
		return "", fmt.Errorf("创建歌词目录失败: %w", err)
	}

	// 生成歌词文件名（与音乐文件同名，扩展名为 .lrc）
	musicFileName := filepath.Base(musicPath)
	lyricsFileName := strings.TrimSuffix(musicFileName, filepath.Ext(musicFileName)) + ".lrc"
	lyricsPath := filepath.Join(lyricsDir, lyricsFileName)

	// 写入文件
	if err := os.WriteFile(lyricsPath, []byte(lyrics), 0644); err != nil {
		return "", fmt.Errorf("保存歌词文件失败: %w", err)
	}

	fmt.Printf("原文歌词已保存到: %s\n", lyricsPath)

	// 返回相对路径
	relativePath := filepath.Join(filepath.Base(musicDir), "lyrics", lyricsFileName)
	return relativePath, nil
}

// SaveTranslationLyricsToFile 将翻译歌词保存到音乐所在文件夹下的 lyrics 子文件夹
// musicPath: 音乐文件的完整路径
// translation: 翻译歌词内容
// 返回: 翻译歌词文件的相对路径
func SaveTranslationLyricsToFile(musicPath, translation string) (string, error) {
	if translation == "" {
		return "", nil
	}

	// 获取音乐文件所在目录
	musicDir := filepath.Dir(musicPath)

	// 创建 lyrics 子文件夹
	lyricsDir := filepath.Join(musicDir, "lyrics")
	if err := os.MkdirAll(lyricsDir, 0755); err != nil {
		return "", fmt.Errorf("创建翻译歌词目录失败: %w", err)
	}

	// 生成翻译歌词文件名（与音乐文件同名，扩展名为 .zh.lrc）
	musicFileName := filepath.Base(musicPath)
	translationFileName := strings.TrimSuffix(musicFileName, filepath.Ext(musicFileName)) + ".zh.lrc"
	translationPath := filepath.Join(lyricsDir, translationFileName)

	// 写入文件
	if err := os.WriteFile(translationPath, []byte(translation), 0644); err != nil {
		return "", fmt.Errorf("保存翻译歌词文件失败: %w", err)
	}

	fmt.Printf("翻译歌词已保存到: %s\n", translationPath)

	// 返回相对路径
	relativePath := filepath.Join(filepath.Base(musicDir), "lyrics", translationFileName)
	return relativePath, nil
}
