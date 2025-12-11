package handler

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"saboriman-music/config"
	"saboriman-music/internal/dto"
	"saboriman-music/internal/entity"
	"saboriman-music/internal/utils"
	"strings"
	"time"

	"github.com/dhowden/tag"
	"github.com/gofiber/fiber/v2"
	"github.com/jinzhu/copier"
	"gopkg.in/vansante/go-ffprobe.v2"
	"gorm.io/gorm"
)

// MusicHandler 音乐处理器
type MusicHandler struct {
	db *gorm.DB
}

// NewMusicHandler 创建音乐处理器
func NewMusicHandler(db *gorm.DB) *MusicHandler {
	return &MusicHandler{db: db}
}

// CreateMusic 创建音乐
func (h *MusicHandler) CreateMusic(c *fiber.Ctx) error {
	var req dto.CreateMusicRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.SendError(c, "请求参数解析失败")
	}

	if req.Title == "" {
		return utils.SendError(c, "歌曲标题不能为空")
	}
	if req.Artist == "" {
		return utils.SendError(c, "艺术家不能为空")
	}

	var music entity.Music
	copier.Copy(&music, &req)

	if err := h.db.Create(&music).Error; err != nil {
		return utils.SendError(c, "创建音乐失败: "+err.Error())
	}

	return utils.SendSuccess(c, "音乐创建成功", music)
}

// GetMusic 获取音乐信息
func (h *MusicHandler) GetMusic(c *fiber.Ctx) error {
	id := c.Params("id") // ID 现在是字符串

	var music entity.Music
	if err := h.db.Preload("User").First(&music, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.SendError(c, "音乐不存在")
		}
		return utils.SendError(c, "查询音乐失败")
	}

	return utils.SendSuccess(c, "获取音乐成功", music)
}

// UpdateMusic 更新音乐
func (h *MusicHandler) UpdateMusic(c *fiber.Ctx) error {
	id := c.Params("id") // ID 现在是字符串

	var music entity.Music
	if err := h.db.First(&music, "id = ?", id).Error; err != nil {
		return utils.SendError(c, "音乐不存在")
	}

	var req dto.UpdateMusicRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.SendError(c, "请求参数解析失败")
	}

	if err := h.db.Model(&music).Updates(&req).Error; err != nil {
		return utils.SendError(c, "更新音乐失败")
	}

	return utils.SendSuccess(c, "音乐更新成功", music)
}

// DeleteMusic 删除音乐
func (h *MusicHandler) DeleteMusic(c *fiber.Ctx) error {
	id := c.Params("id") // ID 现在是字符串

	if err := h.db.Delete(&entity.Music{}, "id = ?", id).Error; err != nil {
		return utils.SendError(c, "删除音乐失败")
	}

	return utils.SendSuccess(c, "音乐删除成功", nil)
}

// ListMusics 获取音乐列表
func (h *MusicHandler) ListMusics(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("page_size", 10)
	albumId := c.Query("albumId")
	isFavorited := c.QueryBool("favorited", false) // 直接获取 bool，默认为 false
	query := c.Query("q")

	// 获取当前用户ID
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return utils.SendError(c, "未认证的用户")
	}

	var musics []entity.Music
	var total int64

	dbQuery := h.db.Model(&entity.Music{})

	if albumId != "" {
		dbQuery = dbQuery.Where("album_id = ?", albumId)
	}

	if query != "" {
		searchQuery := "%" + query + "%"
		dbQuery = dbQuery.Where("title LIKE ? OR artist LIKE ? OR album_artist LIKE ?", searchQuery, searchQuery, searchQuery)
	}

	if err := dbQuery.Count(&total).Error; err != nil {
		return utils.SendError(c, "获取音乐总数失败")
	}

	offset := (page - 1) * pageSize
	if err := dbQuery.Offset(offset).Limit(pageSize).Find(&musics).Error; err != nil {
		return utils.SendError(c, "获取音乐列表失败")
	}

	// 查找当前用户的"我的喜欢"播放列表
	var favoritePlaylist entity.Playlist
	err := h.db.Where("name = ? AND user_id = ?", "我的喜爱", userID).First(&favoritePlaylist).Error

	// 获取"我的喜欢"中的所有音乐ID
	favoriteMusicIDs := make(map[string]bool)
	if err == nil {
		// 播放列表存在，查询关联的音乐ID
		var musicIDs []string
		h.db.Model(&favoritePlaylist).
			Select("music.id").
			Joins("JOIN playlist_musics ON playlist_musics.playlist_id = ?", favoritePlaylist.ID).
			Joins("JOIN music ON music.id = playlist_musics.music_id").
			Pluck("music.id", &musicIDs)

		// 转换为 map 方便快速查找
		for _, id := range musicIDs {
			favoriteMusicIDs[id] = true
		}
	}

	var musicResponses []dto.ListMusicResponse
	for _, music := range musics {
		// 筛选喜爱的音乐
		if isFavorited && !favoriteMusicIDs[music.ID] {
			continue
		}
		musicResponses = append(musicResponses, dto.ListMusicResponse{
			Music:     music,
			Favorited: favoriteMusicIDs[music.ID],
		})
	}

	totalPages := (total + int64(pageSize) - 1) / int64(pageSize)

	result := map[string]interface{}{
		"data":        musicResponses,
		"total":       total,
		"page":        page,
		"total_pages": totalPages,
	}
	return utils.SendSuccess(c, "获取音乐列表成功", result)
}

// PlayMusic 播放音乐（增加播放次数）
func (h *MusicHandler) PlayMusic(c *fiber.Ctx) error {
	id := c.Params("id") // ID 现在是字符串

	result := h.db.Model(&entity.Music{}).Where("id = ?", id).Update("play_count", gorm.Expr("play_count + 1"))
	if result.Error != nil {
		return utils.SendError(c, "增加播放次数失败")
	}
	if result.RowsAffected == 0 {
		return utils.SendError(c, "音乐不存在")
	}

	return utils.SendSuccess(c, "播放次数增加成功", nil)
}

// LikeMusic 点赞音乐（增加点赞次数）
func (h *MusicHandler) LikeMusic(c *fiber.Ctx) error {
	id := c.Params("id") // ID 现在是字符串

	result := h.db.Model(&entity.Music{}).Where("id = ?", id).Update("like_count", gorm.Expr("like_count + 1"))
	if result.Error != nil {
		return utils.SendError(c, "点赞失败")
	}
	if result.RowsAffected == 0 {
		return utils.SendError(c, "音乐不存在")
	}

	return utils.SendSuccess(c, "点赞成功", nil)
}

// SaveLyrics 保存歌词
func (h *MusicHandler) SaveLyrics(c *fiber.Ctx) error {
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

	// 构建歌词文件路径
	musicPath := music.FileUrl
	ext := filepath.Ext(musicPath)
	lyricsPath := strings.TrimSuffix(musicPath, ext) + ".lrc"

	// 确保目录存在
	dir := filepath.Dir(lyricsPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return utils.SendError(c, "创建歌词目录失败: "+err.Error())
	}

	// 写入歌词文件
	if err := os.WriteFile(lyricsPath, []byte(req.Lyrics), 0644); err != nil {
		return utils.SendError(c, "保存歌词文件失败: "+err.Error())
	}

	fmt.Printf("歌词已保存到: %s\n", lyricsPath)

	return utils.SendSuccess(c, "歌词保存成功", fiber.Map{
		"lyrics_path": lyricsPath,
	})
}

// ScanResult 定义了扫描结果的结构
type ScanResult struct {
	ScannedFiles int      `json:"scanned_files"`
	Added        int      `json:"added"`
	Removed      int      `json:"removed"`
	Errors       []string `json:"errors"`
}

// ScanLibrary 扫描音乐库并更新数据库
func (h *MusicHandler) ScanLibrary(c *fiber.Ctx) error {
	musicFolder := config.AppConfig.MusicFolder
	if musicFolder == "" {
		return utils.SendError(c, "配置中未设置 MusicFolder")
	}

	// 使用 goroutine 在后台执行扫描，避免 HTTP 请求超时
	go ScanLibraryInBackground(h.db, musicFolder)

	return utils.SendSuccess(c, "音乐库扫描已在后台开始", nil)
}

// ScanLibraryInBackground 是实际执行扫描的函数
func ScanLibraryInBackground(db *gorm.DB, musicFolder string) {
	fmt.Println("开始扫描音乐库:", musicFolder)
	result := &ScanResult{}

	// 将整个扫描过程包裹在一个事务中
	err := db.Transaction(func(tx *gorm.DB) error {
		// 0. 确保 'SYSTEM' 用户存在
		var systemUser entity.User
		err := tx.First(&systemUser, "id = ?", "SYSTEM").Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			fmt.Println("SYSTEM 用户不存在，正在创建...")
			newUser := entity.User{
				ID:       "SYSTEM",
				Username: "System",
				Email:    "system@localhost",
				Password: "123456",
				Role:     entity.RoleAdmin,
				Status:   1,
			}
			if createErr := tx.Create(&newUser).Error; createErr != nil {
				fmt.Printf("创建 SYSTEM 用户失败: %v\n", createErr)
				return fmt.Errorf("致命错误: 无法创建 SYSTEM 用户: %v", createErr)
			}
			fmt.Println("SYSTEM 用户创建成功。")
		} else if err != nil {
			fmt.Printf("查询 SYSTEM 用户时出错: %v\n", err)
			return fmt.Errorf("查询 SYSTEM 用户失败: %v", err)
		} else {
			fmt.Println("SYSTEM 用户已存在。")
		}

		// 1. 获取数据库中所有音乐的文件路径
		var existingPaths []string
		tx.Model(&entity.Music{}).Pluck("file_url", &existingPaths)
		pathMap := make(map[string]bool)
		for _, p := range existingPaths {
			pathMap[p] = true
		}

		// 新增：为本次扫描创建一个专辑缓存，避免重复查询/创建
		albumCache := make(map[string]*entity.Album)
		// 专辑目录到封面路径的缓存
		albumCoverCache := make(map[string]string)
		foundPaths := make(map[string]bool)

		// 2. 遍历文件系统
		walkErr := filepath.WalkDir(musicFolder, func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("访问路径失败 %s: %v", path, err))
				return nil
			}
			if d.IsDir() {
				return nil
			}

			foundPaths[path] = true
			result.ScannedFiles++

			if !isSupportedFileType(path) {
				return nil
			}

			if _, exists := pathMap[path]; exists {
				return nil
			}

			// 3. 解析元数据和时长
			file, err := os.Open(path)
			if err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("打开文件失败 %s: %v", path, err))
				return nil
			}
			defer file.Close()

			meta, err := tag.ReadFrom(file)
			if err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("解析元数据失败 %s: %v", path, err))
			}

			// 使用 ffprobe 获取详细的音频信息
			var durationSeconds int
			var bitRate int
			var sampleRate int
			var bitDepth int
			var channels int
			var fileSize int64

			probeCtx, cancelFn := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancelFn()
			data, err := ffprobe.ProbeURL(probeCtx, path)
			if err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("探测时长失败 %s: %v", path, err))
				return nil
			}

			// 提取音频流信息
			durationSeconds = int(data.Format.Duration().Seconds())
			if data.Format.BitRate != "" {
				fmt.Sscanf(data.Format.BitRate, "%d", &bitRate)
				bitRate = bitRate / 1000 // 转换为 kbps
			}

			// 获取文件大小
			fileInfo, err := os.Stat(path)
			if err == nil {
				fileSize = fileInfo.Size()
			}

			// 从第一个音频流获取详细信息
			if len(data.Streams) > 0 {
				for _, stream := range data.Streams {
					if stream.CodecType == "audio" {
						if stream.SampleRate != "" {
							fmt.Sscanf(stream.SampleRate, "%d", &sampleRate)
						}
						if stream.BitsPerRawSample != "" {
							fmt.Sscanf(stream.BitsPerRawSample, "%d", &bitDepth)
						}
						channels = stream.Channels
						break
					}
				}
			}

			// 4. 提取所有元数据标签
			var albumName string
			var trackNumber int
			var discNumber int
			var year int
			var releaseDate string
			var performer string
			var label string
			var copyright string
			var isrc string
			var upc string
			var hasCoverArt bool

			if meta != nil {
				albumName = meta.Album()

				track, _ := meta.Track()
				trackNumber = track

				disc, _ := meta.Disc()
				discNumber = disc

				year = meta.Year()

				// 检查是否有封面
				if meta.Picture() != nil {
					hasCoverArt = true
				}

				// 提取原始标签
				if raw := meta.Raw(); raw != nil {
					// 发行日期
					if dateTag, ok := raw["date"]; ok {
						if dates, ok := dateTag.([]string); ok && len(dates) > 0 {
							releaseDate = dates[0]
						} else if dateStr, ok := dateTag.(string); ok {
							releaseDate = dateStr
						}
					}

					// 表演者
					if performerTag, ok := raw["performer"]; ok {
						if performers, ok := performerTag.([]string); ok && len(performers) > 0 {
							performer = performers[0]
						} else if performerStr, ok := performerTag.(string); ok {
							performer = performerStr
						}
					}

					// 唱片公司
					if labelTag, ok := raw["label"]; ok {
						if labels, ok := labelTag.([]string); ok && len(labels) > 0 {
							label = labels[0]
						} else if labelStr, ok := labelTag.(string); ok {
							label = labelStr
						}
					}

					// 版权信息
					if copyrightTag, ok := raw["copyright"]; ok {
						if copyrights, ok := copyrightTag.([]string); ok && len(copyrights) > 0 {
							copyright = copyrights[0]
						} else if copyrightStr, ok := copyrightTag.(string); ok {
							copyright = copyrightStr
						}
					}

					// ISRC 代码
					if isrcTag, ok := raw["isrc"]; ok {
						if isrcs, ok := isrcTag.([]string); ok && len(isrcs) > 0 {
							isrc = isrcs[0]
						} else if isrcStr, ok := isrcTag.(string); ok {
							isrc = isrcStr
						}
					}

					// UPC 代码
					if upcTag, ok := raw["upc"]; ok {
						if upcs, ok := upcTag.([]string); ok && len(upcs) > 0 {
							upc = upcs[0]
						} else if upcStr, ok := upcTag.(string); ok {
							upc = upcStr
						}
					}
				}
			}

			// 5. 查找或创建专辑
			var albumID string

			if albumName != "" {
				artistName := meta.AlbumArtist()
				if artistName == "" {
					artistName = meta.Artist()
				}
				if artistName == "" {
					artistName = "未知艺术家"
				}

				// 使用 "专辑名::艺术家名" 作为唯一键
				albumKey := fmt.Sprintf("%s::%s", albumName, artistName)

				// 首先检查内存缓存
				album, found := albumCache[albumKey]
				if !found {
					// 缓存未命中,查询数据库(使用事务 tx)
					var existingAlbum entity.Album
					err := tx.Where("name = ? AND artist_name = ?", albumName, artistName).First(&existingAlbum).Error
					if errors.Is(err, gorm.ErrRecordNotFound) {
						// 数据库中也不存在,创建新专辑
						// 先获取流派
						albumGenre := meta.Genre()

						newAlbum := entity.Album{
							Name:       albumName,
							ArtistName: artistName,
							Genre:      albumGenre, // 新增：保存流派
						}
						// 安全地设置发行日期
						if year > 0 {
							t := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
							newAlbum.ReleaseDate = &t
						}

						// 提取并保存专辑封面
						coverURL := extractAlbumCover(path, meta, albumCoverCache)
						if coverURL != "" {
							newAlbum.CoverURL = coverURL
						}

						if createErr := tx.Create(&newAlbum).Error; createErr != nil {
							result.Errors = append(result.Errors, fmt.Sprintf("创建专辑失败 %s: %v", albumName, createErr))
						} else {
							albumCache[albumKey] = &newAlbum
							albumID = newAlbum.ID
						}
					} else if err == nil {
						albumCache[albumKey] = &existingAlbum
						albumID = existingAlbum.ID

						// 如果专辑已存在但没有封面，尝试补充封面
						if existingAlbum.CoverURL == "" {
							coverURL := extractAlbumCover(path, meta, albumCoverCache)
							if coverURL != "" {
								tx.Model(&existingAlbum).Update("cover_url", coverURL)
								existingAlbum.CoverURL = coverURL
							}
						}
					}
				} else {
					albumID = album.ID
				}
			}

			// 6. 创建音乐实体
			// 提取封面路径
			coverURL := extractAlbumCover(path, meta, albumCoverCache)

			music := entity.Music{
				FileUrl:     path,
				CoverUrl:    coverURL, // 新增：保存封面路径
				Duration:    durationSeconds,
				UserID:      "SYSTEM",
				AlbumID:     albumID,
				Album:       nil,
				TrackNumber: trackNumber,
				DiscNumber:  discNumber,
				Year:        year,
				ReleaseDate: releaseDate,
				Size:        fileSize,
				Suffix:      strings.TrimPrefix(strings.ToLower(filepath.Ext(path)), "."),
				BitRate:     bitRate,
				SampleRate:  sampleRate,
				BitDepth:    bitDepth,
				Channels:    channels,
				HasCoverArt: hasCoverArt,
				Performer:   performer,
				Label:       label,
				Copyright:   copyright,
				ISRC:        isrc,
				UPC:         upc,
			}

			if meta != nil {
				music.Title = meta.Title()
				music.Artist = meta.Artist()
				music.AlbumArtist = meta.AlbumArtist()
				music.Genre = meta.Genre()
				music.Composer = meta.Composer()
			}

			if music.Title == "" {
				music.Title = strings.TrimSuffix(filepath.Base(path), filepath.Ext(path))
			}
			if music.Artist == "" {
				music.Artist = "未知艺术家"
			}
			if music.AlbumArtist == "" {
				music.AlbumArtist = music.Artist
			}

			// 在扫描时使用
			music.Genre = getOrInferGenre(tx, meta.Genre(), albumID, albumName)

			if err := tx.Create(&music).Error; err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("创建记录失败 %s: %v", path, err))
			} else {
				result.Added++
			}
			return nil
		})

		if walkErr != nil {
			return walkErr
		}

		// 6. 清理（Pruning）：删除数据库中存在但文件已不存在的记录
		for _, path := range existingPaths {
			if _, found := foundPaths[path]; !found {
				if err := tx.Where("file_url = ?", path).Delete(&entity.Music{}).Error; err == nil {
					result.Removed++
				}
			}
		}

		return nil
	})

	if err != nil {
		fmt.Printf("扫描事务失败: %v\n", err)
	}

	fmt.Printf("扫描完成: 新增 %d, 移除 %d, 扫描文件 %d, 错误 %d\n", result.Added, result.Removed, result.ScannedFiles, len(result.Errors))
	if len(result.Errors) > 0 {
		fmt.Println("扫描期间发生错误:")
		for _, e := range result.Errors {
			fmt.Println("- ", e)
		}
	}
}

// extractAlbumCover 提取专辑封面，优先级：1. 音乐文件内嵌封面 2. 目录下的图片文件
func extractAlbumCover(musicPath string, meta tag.Metadata, coverCache map[string]string) string {
	musicDir := filepath.Dir(musicPath)

	// 检查是否已经为该目录找到过封面
	if cachedCover, exists := coverCache[musicDir]; exists {
		return cachedCover
	}

	var coverURL string

	// 1. 优先尝试从音乐文件的元数据中提取封面
	if meta != nil && meta.Picture() != nil {
		picture := meta.Picture()
		coverURL = saveCoverImage(musicDir, picture.Data, picture.Ext)
		if coverURL != "" {
			coverCache[musicDir] = coverURL
			return coverURL
		}
	}

	// 2. 如果元数据中没有封面，扫描目录下的图片文件
	coverURL = findCoverImageInDirectory(musicDir)
	if coverURL != "" {
		coverCache[musicDir] = coverURL
		return coverURL
	}

	return ""
}

// saveCoverImage 将内嵌封面保存到磁盘
func saveCoverImage(musicDir string, imageData []byte, ext string) string {
	if len(imageData) == 0 {
		return ""
	}

	// 创建 covers 目录
	coversDir := filepath.Join(config.AppConfig.MusicFolder, ".covers")
	if err := os.MkdirAll(coversDir, 0755); err != nil {
		fmt.Printf("创建封面目录失败: %v\n", err)
		return ""
	}

	// 使用 MD5 生成唯一的文件名
	hash := md5.Sum(imageData)

	// 确保扩展名包含点号
	if ext != "" && !strings.HasPrefix(ext, ".") {
		ext = "." + ext
	}
	// 如果没有扩展名，默认使用 .jpg
	if ext == "" {
		ext = ".jpg"
	}

	filename := hex.EncodeToString(hash[:]) + ext

	coverPath := filepath.Join(coversDir, filename)

	// 如果文件已存在，直接返回路径
	if _, err := os.Stat(coverPath); err == nil {
		return coverPath
	}

	// 保存图片文件
	if err := os.WriteFile(coverPath, imageData, 0644); err != nil {
		fmt.Printf("保存封面失败: %v\n", err)
		return ""
	}

	fmt.Printf("保存专辑封面: %s\n", coverPath)
	return coverPath
}

// findCoverImageInDirectory 在目录中查找封面图片
func findCoverImageInDirectory(dir string) string {
	// 常见的封面文件名
	coverNames := []string{
		"cover.jpg", "cover.jpeg", "cover.png",
		"folder.jpg", "folder.jpeg", "folder.png",
		"album.jpg", "album.jpeg", "album.png",
		"front.jpg", "front.jpeg", "front.png",
	}

	// 先尝试匹配常见的封面文件名
	for _, name := range coverNames {
		coverPath := filepath.Join(dir, name)
		if _, err := os.Stat(coverPath); err == nil {
			return coverPath
		}
		// 尝试大写
		coverPath = filepath.Join(dir, strings.ToUpper(name))
		if _, err := os.Stat(coverPath); err == nil {
			return coverPath
		}
	}

	// 如果没有找到，扫描目录中的第一张图片
	entries, err := os.ReadDir(dir)
	if err != nil {
		return ""
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		ext := strings.ToLower(filepath.Ext(entry.Name()))
		if isImageFile(ext) {
			return filepath.Join(dir, entry.Name())
		}
	}

	return ""
}

// isImageFile 检查文件扩展名是否为图片格式
func isImageFile(ext string) bool {
	imageExts := []string{".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}
	for _, imgExt := range imageExts {
		if ext == imgExt {
			return true
		}
	}
	return false
}

// isSupportedFileType 检查文件扩展名是否为支持的音频格式
func isSupportedFileType(path string) bool {
	ext := strings.ToLower(filepath.Ext(path))
	supportedExts := []string{".mp3", ".m4a", ".flac", ".ogg", ".wav"}
	for _, supported := range supportedExts {
		if ext == supported {
			return true
		}
	}
	return false
}

// getOrInferGenre 获取或推断流派
func getOrInferGenre(tx *gorm.DB, currentGenre, albumID, albumName string) string {
	// 1. 如果当前音乐已有流派，直接返回
	if currentGenre != "" {
		return currentGenre
	}

	// 2. 尝试从专辑中其他音乐获取流派
	if albumID != "" {
		var genre string
		err := tx.Model(&entity.Music{}).
			Select("genre").
			Where("album_id = ? AND genre != ''", albumID).
			Group("genre").
			Order("COUNT(*) DESC").
			Limit(1).
			Pluck("genre", &genre).Error

		if err == nil && genre != "" {
			return genre
		}
	}

	// 3. 根据专辑名称或目录名称推断流派
	albumLower := strings.ToLower(albumName)

	genreKeywords := map[string][]string{
		"Classical":  {"classical", "symphony", "concerto", "sonata", "古典"},
		"Pop":        {"pop", "流行"},
		"Rock":       {"rock", "摇滚"},
		"Jazz":       {"jazz", "爵士"},
		"Electronic": {"electronic", "edm", "techno", "house", "电子"},
		"Hip Hop":    {"hip hop", "rap", "说唱"},
		"Country":    {"country", "乡村"},
		"R&B":        {"r&b", "soul"},
		"Metal":      {"metal", "金属"},
		"Folk":       {"folk", "民谣"},
		"Soundtrack": {"soundtrack", "ost", "原声"},
		"Anime":      {"anime", "动漫", "アニメ"},
		"Game":       {"game", "游戏", "ゲーム"},
	}

	for genre, keywords := range genreKeywords {
		for _, keyword := range keywords {
			if strings.Contains(albumLower, keyword) {
				return genre
			}
		}
	}

	return "Unknown"
}

// GetLyrics 获取歌词
func (h *MusicHandler) GetLyrics(c *fiber.Ctx) error {
	id := c.Params("id")
	engine := c.Query("engine", "lrc.cx")

	// 查询音乐信息
	music := entity.Music{}
	if err := h.db.Preload("Album").First(&music, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "音乐不存在",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "查询音乐失败",
		})
	}

	musicPath := music.FileUrl
	ext := filepath.Ext(musicPath)
	lyricsPath := strings.TrimSuffix(musicPath, ext) + ".lrc"
	if (engine != "lrc.cx") && (engine != "netease") {
		// 1. 首先尝试从本地文件读取歌词
		lyricsContent, err := os.ReadFile(lyricsPath)
		if err == nil {
			// 本地歌词文件存在，直接返回
			return c.JSON(fiber.Map{
				"lyrics": string(lyricsContent),
				"source": "local",
			})
		}

		// 2. 本地没有歌词文件，尝试从网络获取
		if !os.IsNotExist(err) {
			// 如果是其他读取错误，返回错误信息
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "读取歌词文件失败",
			})
		}
	}

	// 从网络获取歌词
	netLyrics, err := fetchLyricsFromNetwork(engine, music.Title, music.Artist, music.Album.Name)
	if err != nil {
		fmt.Printf("从网络获取歌词失败: %v\n", err)
		return c.JSON(fiber.Map{
			"lyrics": "",
			"source": "none",
		})
	}

	// 可选：将获取的歌词保存到本地
	if netLyrics != "" {
		go saveLyricsToFile(lyricsPath, netLyrics)
	}

	return c.JSON(fiber.Map{
		"lyrics": netLyrics,
		"source": "network",
	})
}

// fetchLyricsFromNetwork 从网络获取歌词
func fetchLyricsFromNetwork(engine, title, artist, album string) (string, error) {
	if engine == "lrc.cx" || engine == "" {
		lyrics, err := fetchFromLrcCx(title, artist, album)
		if err == nil && lyrics != "" {
			return lyrics, nil
		}
		return "", err
	}

	return "", fmt.Errorf("不支持的歌词源: %s", engine)
}

// LrcCxResponse lrc.cx API 响应结构
type LrcCxResponse struct {
	Code int    `json:"code"`
	Msg  string `json:"msg"`
	Data struct {
		ID          int    `json:"id"`
		Title       string `json:"title"`
		Artist      string `json:"artist"`
		Album       string `json:"album"`
		PlainLyric  string `json:"plainLyric"`  // 纯文本歌词
		SyncedLyric string `json:"syncedLyric"` // LRC格式歌词
	} `json:"data"`
}

// LrcCxItem 表示 lrc.cx jsonapi 返回的单条歌词项
type LrcCxItem struct {
	Cover      string  `json:"cover"`
	CreateTime string  `json:"create_time"`
	Album      string  `json:"album"`
	Title      string  `json:"title"`
	Lrc        string  `json:"lrc"`
	Hash       string  `json:"hash"`
	Timestamp  float64 `json:"timestamp"`
	Score      float64 `json:"score"`
	ID         string  `json:"id"`
	Artist     string  `json:"artist"`
}

// fetchFromLrcCx 从 lrc.cx 获取歌词（适配 jsonapi 的数组返回）
func fetchFromLrcCx(title, artist, album string) (string, error) {
	client := &http.Client{Timeout: 15 * time.Second}

	apiURL := "https://api.lrc.cx/jsonapi"
	params := url.Values{}
	if strings.TrimSpace(title) != "" {
		params.Add("title", title)
	}
	if strings.TrimSpace(artist) != "" {
		params.Add("artist", artist)
	}
	if strings.TrimSpace(album) != "" {
		params.Add("album", album)
	}

	fullURL := fmt.Sprintf("%s?%s", apiURL, params.Encode())

	fmt.Printf("正在从 lrc.cx 获取歌词: %s - %s\n", title, artist)
	fmt.Printf("请求URL: %s\n", fullURL)

	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("请求失败: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP 错误: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("读取响应失败: %v", err)
	}

	// 尝试解析为数组
	var items []LrcCxItem
	if err := json.Unmarshal(body, &items); err != nil {
		// 如果不是数组，可能直接返回 LRC 文本
		if strings.HasPrefix(strings.TrimSpace(string(body)), "[") || strings.HasPrefix(strings.TrimSpace(string(body)), "[ti:") {
			// 看起来是 LRC 内容
			return string(body), nil
		}
		return "", fmt.Errorf("解析 lrc.cx 响应失败: %v", err)
	}

	if len(items) == 0 {
		return "", fmt.Errorf("lrc.cx 未返回歌词项")
	}

	// 选择分数最高的项
	best := items[0]
	for _, it := range items[1:] {
		if it.Score > best.Score {
			best = it
		}
	}

	// 可选：进一步匹配标题/艺术家以提高准确度
	if best.Lrc == "" {
		return "", fmt.Errorf("选中的歌词项不包含 LRC 内容")
	}

	// 打印预览
	lines := strings.Split(best.Lrc, "\n")
	if len(lines) > 0 {
		preview := lines
		if len(lines) > 5 {
			preview = lines[:5]
		}
		fmt.Printf("✓ lrc.cx 找到歌词（score=%.2f, id=%s）预览:\n%s\n", best.Score, best.ID, strings.Join(preview, "\n"))
	}

	return best.Lrc, nil
}

// saveLyricsToFile 将歌词保存到文件
func saveLyricsToFile(path, lyrics string) {
	// 确保目录存在
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		fmt.Printf("创建歌词目录失败: %v\n", err)
		return
	}

	// 写入文件
	if err := os.WriteFile(path, []byte(lyrics), 0644); err != nil {
		fmt.Printf("保存歌词文件失败: %v\n", err)
		return
	}

	fmt.Printf("歌词已保存到: %s\n", path)
}
