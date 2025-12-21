package subsonic

import (
	"fmt"
	"path/filepath"
	"saboriman-music/config"
	"saboriman-music/internal/entity"
	"sort"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// MusicHandler 音乐处理器
type SubsonicHandler struct {
	db *gorm.DB
}

// NewMusicHandler 创建音乐处理器
func NewMusicHandler(db *gorm.DB) *SubsonicHandler {
	return &SubsonicHandler{db: db}
}

// GET /rest/ping.view
func (h *SubsonicHandler) HandlePing(c *fiber.Ctx) error {
	_, err := ParseAuthFromFiber(c)
	resp := Response{
		Status:  "ok",
		Version: "1.16.1",
		Ping:    &Ping{},
	}
	if err != nil {
		resp.Status = "failed"
		resp.Error = &Error{Code: ErrRequiredParam, Message: err.Error()}
	}
	return WriteXMLFiber(c, resp)
}

// GET /rest/getLicense.view
func (h *SubsonicHandler) HandleGetLicense(c *fiber.Ctx) error {
	resp := Response{
		Status:  "ok",
		Version: "1.16.1",
		License: &License{Valid: true},
	}
	return WriteXMLFiber(c, resp)
}

// GET /rest/getArtists.view
func (h *SubsonicHandler) HandleGetArtists(c *fiber.Ctx) error {
	// 1) 从音乐表中查询所有非空艺术家并去重
	var artistNames []string
	if err := h.db.
		Model(&entity.Music{}).
		Where("artist IS NOT NULL AND artist <> ''").
		Pluck("DISTINCT artist", &artistNames).Error; err != nil {
		return WriteXMLFiber(c, Response{
			Status: "failed", Version: "1.16.1",
			Error: &Error{Code: ErrGeneric, Message: fmt.Sprintf("db error: %v", err)},
		})
	}

	// 2) 映射为 Subsonic Artist（ID 用规范化名称或哈希）
	// 如果你有 Artist 表和真实 ID，可改为用真实 ID
	makeID := func(name string) string {
		// 简单规范化 ID（避免空格和大小写差异）
		return strings.ToLower(strings.ReplaceAll(strings.TrimSpace(name), " ", "-"))
	}
	all := make([]Artist, 0, len(artistNames))
	seen := map[string]struct{}{}
	for _, name := range artistNames {
		n := strings.TrimSpace(name)
		if n == "" {
			continue
		}
		id := makeID(n)
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		all = append(all, Artist{ID: id, Name: n})
	}

	// 3) 分组：A-Z、0-9、其他(#)
	groups := map[string][]Artist{}
	for _, a := range all {
		initial := "#"
		runes := []rune(strings.TrimSpace(a.Name))
		if len(runes) > 0 {
			up := strings.ToUpper(string(runes[0]))
			if up[0] >= 'A' && up[0] <= 'Z' {
				initial = up
			} else if up[0] >= '0' && up[0] <= '9' {
				initial = "0-9"
			} else {
				initial = "#"
			}
		}
		groups[initial] = append(groups[initial], a)
	}

	// 4) 分组名排序，组内按名称排序
	keys := make([]string, 0, len(groups))
	for k := range groups {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	indexes := make([]ArtistIndex, 0, len(keys))
	for _, k := range keys {
		artists := groups[k]
		sort.Slice(artists, func(i, j int) bool {
			return strings.ToLower(artists[i].Name) < strings.ToLower(artists[j].Name)
		})
		indexes = append(indexes, ArtistIndex{
			Name:    k,
			Artists: artists,
		})
	}

	// 5) 返回 XML
	resp := Response{
		Status:  "ok",
		Version: "1.16.1",
		Artists: &ArtistsResponse{Index: indexes},
	}
	return WriteXMLFiber(c, resp)
}

// GET /rest/getAlbum.view?id=albumId
func (h *SubsonicHandler) HandleGetAlbum(c *fiber.Ctx) error {
	id := c.Query("id")
	if id == "" {
		return WriteXMLFiber(c, Response{
			Status:  "failed",
			Version: "1.16.1",
			Error:   &Error{Code: ErrRequiredParam, Message: "missing id"},
		})
	}

	// 查询专辑，预加载 Musics
	var album entity.Album
	if err := h.db.Preload("Musics").First(&album, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return WriteXMLFiber(c, Response{
				Status:  "failed",
				Version: "1.16.1",
				Error:   &Error{Code: ErrGeneric, Message: "album not found"},
			})
		}
		return WriteXMLFiber(c, Response{
			Status:  "failed",
			Version: "1.16.1",
			Error:   &Error{Code: ErrGeneric, Message: fmt.Sprintf("db error: %v", err)},
		})
	}

	// 汇总专辑总时长
	totalDuration := 0
	songs := make([]Song, 0, len(album.Musics))
	for _, m := range album.Musics {
		// 兼容你的实体字段命名
		// entity.Music 典型字段: ID, Title, Artist, AlbumName/AlbumTitle, Duration, CoverURL
		title := m.Title
		artist := m.Artist
		track := m.TrackNumber // 如无 Track 字段，可置 0
		duration := m.Duration
		cover := m.CoverUrl
		parent := id

		totalDuration += duration

		songs = append(songs, Song{
			ID:       fmt.Sprintf("%v", m.ID),
			Parent:   fmt.Sprintf("%v", parent),
			Title:    title,
			Artist:   artist,
			Album:    album.Name,
			Track:    track,
			Duration: duration,
			CoverArt: h.coverIDFromURLOrAlbum(cover, album.ID), // 生成 coverArt id（可用 URL 或专辑 ID）
			Type:     "music",
		})
	}

	resp := Response{
		Status:  "ok",
		Version: "1.16.1",
		Album: &AlbumResponse{
			Album: Album{
				ID:        fmt.Sprintf("%v", album.ID),
				Name:      album.Name,
				Artist:    album.ArtistName,
				CoverArt:  h.coverIDFromURLOrAlbum(album.CoverURL, album.ID),
				SongCount: len(songs),
				Duration:  totalDuration,
			},
		},
	}
	// Subsonic 规范中 album 下通常还需要包含 <song> 子节点；
	// 如果你在 Response/AlbumResponse 结构中未内嵌 song 列表，可考虑扩展：
	// 例如在 Response 加一个 AlbumSongs 字段，或修改 AlbumResponse 以携带 Songs。
	// 这里将随机/占位接口之外的真实歌曲列表作为 RandomSongs 返回，便于客户端使用：
	resp.RandomSongs = &SongsResponse{Song: songs}

	return WriteXMLFiber(c, resp)
}

// 辅助：从封面 URL 或专辑 ID 生成 coverArt 引用
func (h *SubsonicHandler) coverIDFromURLOrAlbum(url string, albumID any) string {
	if strings.TrimSpace(url) != "" {
		// 有 URL 时可直接用 URL 或 hash；这里直接返回 URL 以兼容 getCoverArt?id=<url>
		return url
	}
	var album entity.Album
	if err := h.db.First(&album, "id = ?", albumID).Error; err != nil {
		return fmt.Sprintf("cover-%v", album.CoverURL)
	}
	return fmt.Sprintf("cover-%v", album.CoverURL)
}

// GET /rest/getRandomSongs.view?size=10
func (h *SubsonicHandler) HandleGetRandomSongs(c *fiber.Ctx) error {
	size, _ := strconv.Atoi(c.Query("size"))
	if size <= 0 {
		size = 10
	}
	songs := make([]Song, 0, size)
	if err := h.db.Model(&entity.Music{}).
		Order("RANDOM()").
		Limit(size).
		Find(&songs).Error; err != nil {
		return WriteXMLFiber(c, Response{
			Status: "failed", Version: "1.16.1",
			Error: &Error{Code: ErrGeneric, Message: fmt.Sprintf("db error: %v", err)},
		})
	}
	resp := Response{
		Status:      "ok",
		Version:     "1.16.1",
		RandomSongs: &SongsResponse{Song: songs},
	}
	return WriteXMLFiber(c, resp)
}

// GET /rest/getCoverArt.view?id=coverId
func (h *SubsonicHandler) HandleGetCoverArt(c *fiber.Ctx) error {
	id := c.Query("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).SendString("missing id")
	}
	// 1) 查询 album 的封面 URL（字符串）
	var coverURL string
	if err := h.db.Model(&entity.Album{}).
		Where("id = ?", id).
		Pluck("cover_url", &coverURL).Error; err != nil {
		return c.Status(fiber.StatusNotFound).SendString("cover art not found")
	}
	if strings.TrimSpace(coverURL) == "" {
		return c.Status(fiber.StatusNotFound).SendString("cover art not set")
	}

	// 2) 否则当作本地文件路径（相对或绝对）
	// 例如你保存为 /app/music/.covers/<filename>.jpg
	// 注意：请确保路径安全且存在
	// 推断 Content-Type
	ext := strings.ToLower(filepath.Ext(coverURL))
	switch ext {
	case ".png":
		c.Type("png")
	case ".webp":
		c.Type("webp")
	default:
		c.Type("jpeg")
	}

	// 如果 coverURL 是相对路径，拼上你的基准目录
	// baseDir 可来自配置，如 /app
	// DB保存路径是/music./.covers/xxx.jpg
	AppBasePath := config.AppConfig.AppBasePath
	baseDir := AppBasePath
	fullPath := coverURL
	if !strings.HasPrefix(coverURL, "/") {
		fullPath = filepath.Join(baseDir, coverURL)
	}
	return c.SendFile(fullPath)
}

// GET /rest/stream.view?id=songId
func (h *SubsonicHandler) HandleStream(c *fiber.Ctx) error {
	id := c.Query("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).SendString("missing id")
	}
	// 1) 查询音乐文件路径
	var filePath string
	if err := h.db.Model(&entity.Music{}).
		Where("id = ?", id).
		Pluck("cover_url", &filePath).Error; err != nil {
		return c.Status(fiber.StatusNotFound).SendString("music not found")
	}
	if strings.TrimSpace(filePath) == "" {
		return c.Status(fiber.StatusNotFound).SendString("music file path not set")
	}

	// 2) 否则当作本地文件路径（相对或绝对）
	// 例如你保存为 /app/music/<filename>.mp3
	// 注意：请确保路径安全且存在
	// 推断 Content-Type
	ext := strings.ToLower(filepath.Ext(filePath))
	switch ext {
	case ".flac":
		c.Type("audio/flac")
	case ".wav":
		c.Type("audio/wav")
	default:
		c.Type("audio/mpeg") // 默认 mp3
	}

	// 如果 filePath 是相对路径，拼上你的基准目录
	// baseDir 可来自配置，如 /app/music
	// DB保存路径是/music/xxx.mp3
	AppBasePath := config.AppConfig.AppBasePath
	baseDir := filepath.Join(AppBasePath)
	fullPath := filePath
	if !strings.HasPrefix(filePath, "/") {
		fullPath = filepath.Join(baseDir, filePath)
	}
	return c.SendFile(fullPath)
}
