package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"saboriman-music/internal/entity"
	"saboriman-music/internal/utils"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// LyricsHandler 音乐处理器
type LyricsHandler struct {
	db *gorm.DB
}

// NewLyricsHandler 创建音乐处理器
func NewLyricsHandler(db *gorm.DB) *LyricsHandler {
	return &LyricsHandler{db: db}
}

// SearchLyricsProxy 搜索歌词代理
func (h *LyricsHandler) SearchLyricsProxy(c *fiber.Ctx) error {
	keyword := c.Query("keyword")
	if keyword == "" {
		return utils.SendError(c, "搜索关键词不能为空")
	}

	timestamp := c.Query("timestamp")
	signature := c.Query("signature")
	page := c.Query("page")
	pageSize := c.Query("pageSize")

	// 创建 HTTP 客户端
	client := &http.Client{
		Timeout: 15 * time.Second,
	}

	// 构建请求参数
	params := url.Values{}
	params.Add("keyword", keyword)
	if timestamp != "" {
		params.Add("timestamp", timestamp)
	}
	if signature != "" {
		params.Add("signature", signature)
	}
	if page != "" {
		params.Add("page", page)
	}
	if pageSize != "" {
		params.Add("pageSize", pageSize)
	}

	// 构建完整 URL
	fullURL := fmt.Sprintf("https://geciyi.com/zh-Hans/api/search_lists?%s", params.Encode())

	fmt.Printf("请求 URL: %s\n", fullURL)

	// 创建请求
	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		return utils.SendError(c, "创建请求失败: "+err.Error())
	}

	// 设置请求头
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
	req.Header.Set("Referer", "https://geciyi.com/")
	req.Header.Set("Origin", "https://geciyi.com")

	// 发送请求
	resp, err := client.Do(req)
	if err != nil {
		return utils.SendError(c, "搜索失败: "+err.Error())
	}
	defer resp.Body.Close()

	fmt.Printf("响应状态码: %d\n", resp.StatusCode)
	fmt.Printf("Content-Type: %s\n", resp.Header.Get("Content-Type"))
	fmt.Printf("Content-Encoding: %s\n", resp.Header.Get("Content-Encoding"))

	// 读取响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return utils.SendError(c, "读取响应失败: "+err.Error())
	}

	fmt.Printf("响应体长度: %d 字节\n", len(body))

	// 打印前 500 个字符用于调试
	preview := string(body)
	if len(preview) > 500 {
		preview = preview[:500]
	}
	fmt.Printf("响应体预览:\n%s\n", preview)

	// 尝试解析 JSON 看看结构
	var jsonData interface{}
	if err := json.Unmarshal(body, &jsonData); err == nil {
		fmt.Printf("JSON 解析成功\n")
		if dataMap, ok := jsonData.(map[string]interface{}); ok {
			if data, exists := dataMap["data"]; exists {
				if dataArray, isArray := data.([]interface{}); isArray {
					fmt.Printf("data 字段是数组，长度: %d\n", len(dataArray))
				} else {
					fmt.Printf("data 字段不是数组，类型: %T\n", data)
				}
			}
		}
	} else {
		fmt.Printf("JSON 解析失败: %v\n", err)
	}

	// 设置响应头并返回 JSON
	c.Set("Content-Type", "application/json; charset=utf-8")
	return c.Send(body)
}

// GetLyricsByIdProxy 获取歌词详情代理
func (h *LyricsHandler) GetLyricsByIdProxy(c *fiber.Ctx) error {
	id := c.Query("id")
	keyword := c.Query("keyword")
	timestamp := c.Query("timestamp")
	signature := c.Query("signature")

	if id == "" || keyword == "" {
		return utils.SendError(c, "参数不完整")
	}

	// 创建 HTTP 客户端
	client := &http.Client{
		Timeout: 15 * time.Second,
	}

	// 构建请求参数
	params := url.Values{}
	params.Add("id", id)
	params.Add("keyword", keyword)
	if timestamp != "" {
		params.Add("timestamp", timestamp)
	}
	if signature != "" {
		params.Add("signature", signature)
	}

	// 构建完整 URL
	fullURL := fmt.Sprintf("https://geciyi.com/zh-Hans/api/get_lyrics_by_id?%s", params.Encode())

	fmt.Printf("获取歌词 URL: %s\n", fullURL)

	// 创建请求
	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		return utils.SendError(c, "创建请求失败: "+err.Error())
	}

	// 设置请求头
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
	req.Header.Set("Referer", "https://geciyi.com/")
	req.Header.Set("Origin", "https://geciyi.com")

	// 发送请求
	resp, err := client.Do(req)
	if err != nil {
		return utils.SendError(c, "获取歌词失败: "+err.Error())
	}
	defer resp.Body.Close()

	fmt.Printf("响应状态码: %d\n", resp.StatusCode)
	fmt.Printf("Content-Type: %s\n", resp.Header.Get("Content-Type"))

	// 读取响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return utils.SendError(c, "读取响应失败: "+err.Error())
	}

	fmt.Printf("响应体长度: %d 字节\n", len(body))

	// 设置响应头并返回 JSON
	c.Set("Content-Type", "application/json; charset=utf-8")
	return c.Send(body)
}

// SaveLyrics 保存歌词
func (h *LyricsHandler) SaveLyrics(c *fiber.Ctx) error {
	id := c.Params("id")

	// 解析请求体
	var req struct {
		Lyrics string `json:"lyrics"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.SendError(c, "请求参数解析失败")
	}

	if req.Lyrics == "" {
		return utils.SendError(c, "歌词内容不能为空")
	}

	// 查询音乐信息
	var music entity.Music
	if err := h.db.First(&music, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.SendError(c, "音乐不存在")
		}
		return utils.SendError(c, "查询音乐失败")
	}

	// 获取音乐文件所在目录
	musicPath := music.FileUrl
	musicDir := filepath.Dir(musicPath)
	musicFileName := filepath.Base(musicPath)

	// 构建歌词文件路径：音乐文件夹/lyrics/歌曲名.lrc
	lyricsDir := filepath.Join(musicDir, "lyrics")
	lyricsFileName := strings.TrimSuffix(musicFileName, filepath.Ext(musicFileName)) + ".lrc"
	lyricsPath := filepath.Join(lyricsDir, lyricsFileName)

	// 确保 lyrics 目录存在
	if err := os.MkdirAll(lyricsDir, 0755); err != nil {
		return utils.SendError(c, "创建歌词目录失败: "+err.Error())
	}

	// 写入歌词文件
	if err := os.WriteFile(lyricsPath, []byte(req.Lyrics), 0644); err != nil {
		return utils.SendError(c, "保存歌词文件失败: "+err.Error())
	}

	fmt.Printf("原文歌词已保存到: %s\n", lyricsPath)

	return utils.SendSuccess(c, "歌词保存成功", fiber.Map{
		"lyrics_path": lyricsPath,
	})
}

// SaveTranslatiionLyrics 保存翻译歌词
func (h *LyricsHandler) SaveTranslatiionLyrics(c *fiber.Ctx) error {
	id := c.Params("id")

	// 解析请求体
	var req struct {
		Lyrics string `json:"lyrics"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.SendError(c, "请求参数解析失败")
	}

	if req.Lyrics == "" {
		return utils.SendError(c, "歌词内容不能为空")
	}

	// 查询音乐信息
	var music entity.Music
	if err := h.db.First(&music, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.SendError(c, "音乐不存在")
		}
		return utils.SendError(c, "查询音乐失败")
	}

	// 获取音乐文件所在目录
	musicPath := music.FileUrl
	musicDir := filepath.Dir(musicPath)
	musicFileName := filepath.Base(musicPath)

	// 构建翻译歌词文件路径：音乐文件夹/lyrics/歌曲名.zh.lrc
	lyricsDir := filepath.Join(musicDir, "lyrics")
	translationFileName := strings.TrimSuffix(musicFileName, filepath.Ext(musicFileName)) + ".zh.lrc"
	translationPath := filepath.Join(lyricsDir, translationFileName)

	// 确保 lyrics 目录存在
	if err := os.MkdirAll(lyricsDir, 0755); err != nil {
		return utils.SendError(c, "创建歌词目录失败: "+err.Error())
	}

	// 写入翻译歌词文件
	if err := os.WriteFile(translationPath, []byte(req.Lyrics), 0644); err != nil {
		return utils.SendError(c, "保存翻译歌词文件失败: "+err.Error())
	}

	fmt.Printf("翻译歌词已保存到: %s\n", translationPath)

	return utils.SendSuccess(c, "翻译歌词保存成功", fiber.Map{
		"lyrics_path": translationPath,
	})
}
