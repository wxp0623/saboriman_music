package handler

import (
	"log"
	"saboriman-music/internal/dto"
	"saboriman-music/internal/entity"
	"saboriman-music/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/jinzhu/copier"
	"gorm.io/gorm"
)

// PlaylistHandler 播放列表处理器
type PlaylistHandler struct {
	db *gorm.DB
}

// NewPlaylistHandler 创建播放列表处理器
func NewPlaylistHandler(db *gorm.DB) *PlaylistHandler {
	return &PlaylistHandler{db: db}
}

// CreatePlaylist 创建播放列表
func (h *PlaylistHandler) CreatePlaylist(c *fiber.Ctx) error {
	var req dto.CreatePlaylistRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.SendError(c, "请求参数解析失败")
	}

	if req.Name == "" {
		return utils.SendError(c, "播放列表名称不能为空")
	}

	var playlist entity.Playlist
	copier.Copy(&playlist, &req)

	if err := h.db.Create(&playlist).Error; err != nil {
		return utils.SendError(c, "创建播放列表失败: "+err.Error())
	}

	return utils.SendSuccess(c, "播放列表创建成功", playlist)
}

// GetPlaylist 获取播放列表信息
func (h *PlaylistHandler) GetPlaylist(c *fiber.Ctx) error {
	id := c.Params("id")

	var playlist entity.Playlist
	// 预加载关联的用户和音乐信息
	if err := h.db.Preload("User").Preload("Musics").First(&playlist, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.SendError(c, "播放列表不存在")
		}
		return utils.SendError(c, "查询播放列表失败")
	}

	return utils.SendSuccess(c, "获取播放列表成功", playlist)
}

// UpdatePlaylist 更新播放列表
func (h *PlaylistHandler) UpdatePlaylist(c *fiber.Ctx) error {
	id := c.Params("id") // ID is now a string

	var playlist entity.Playlist
	if err := h.db.First(&playlist, "id = ?", id).Error; err != nil {
		return utils.SendError(c, "播放列表不存在")
	}

	var req dto.UpdatePlaylistRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.SendError(c, "请求参数解析失败")
	}

	if err := h.db.Model(&playlist).Updates(&req).Error; err != nil {
		return utils.SendError(c, "更新播放列表失败")
	}

	return utils.SendSuccess(c, "播放列表更新成功", playlist)
}

// DeletePlaylist 删除播放列表
func (h *PlaylistHandler) DeletePlaylist(c *fiber.Ctx) error {
	id := c.Params("id") // ID is now a string

	if err := h.db.Delete(&entity.Playlist{}, "id = ?", id).Error; err != nil {
		return utils.SendError(c, "删除播放列表失败")
	}

	return utils.SendSuccess(c, "播放列表删除成功", nil)
}

// ListPlaylists 获取播放列表列表
func (h *PlaylistHandler) ListPlaylists(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("page_size", 10)
	query := c.Query("q")

	var playlists []entity.Playlist
	var total int64

	dbQuery := h.db.Model(&entity.Playlist{})

	if query != "" {
		searchQuery := "%" + query + "%"
		dbQuery = dbQuery.Where("name LIKE ?", searchQuery)
	}

	if err := dbQuery.Count(&total).Error; err != nil {
		return utils.SendError(c, "获取播放列表总数失败")
	}

	offset := (page - 1) * pageSize
	if err := dbQuery.Preload("User").Offset(offset).Limit(pageSize).Find(&playlists).Error; err != nil {
		return utils.SendError(c, "获取播放列表列表失败")
	}

	totalPages := (total + int64(pageSize) - 1) / int64(pageSize)

	result := map[string]interface{}{
		"data":        playlists,
		"total":       total,
		"page":        page,
		"total_pages": totalPages,
	}
	return utils.SendSuccess(c, "获取播放列表列表成功", result)
}

// AddMusicToPlaylist 添加音乐到播放列表
func (h *PlaylistHandler) AddMusicToPlaylist(c *fiber.Ctx) error {
	playlistID := c.Params("id")

	var req dto.AddMusicToPlaylistRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.SendError(c, "请求参数解析失败")
	}

	// 检查音乐是否存在
	var musicExists bool
	if err := h.db.Model(&entity.Music{}).
		Select("count(*) > 0").
		Where("id = ?", req.MusicID).
		Find(&musicExists).Error; err != nil {
		return utils.SendError(c, "查询音乐失败")
	}

	if !musicExists {
		return utils.SendError(c, "音乐不存在")
	}

	// 查找播放列表
	var playlist entity.Playlist
	if err := h.db.First(&playlist, "id = ?", playlistID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.SendError(c, "播放列表不存在")
		}
		return utils.SendError(c, "查询播放列表失败")
	}

	// 检查音乐是否已在播放列表中
	var existingCount int64
	if err := h.db.Table("playlist_musics").
		Where("playlist_id = ? AND music_id = ?", playlist.ID, req.MusicID).
		Count(&existingCount).Error; err != nil {
		return utils.SendError(c, "检查关联失败")
	}

	if existingCount > 0 {
		// 存在的话直接删除关联取消我的喜爱
		if err := h.db.Exec(
			"DELETE FROM playlist_musics WHERE playlist_id = ? AND music_id = ?",
			playlist.ID,
			req.MusicID,
		).Error; err != nil {
			return utils.SendError(c, "移除音乐失败: "+err.Error())
		}

		// 取消点赞计数
		RES := h.db.Model(&entity.Music{}).Where("id = ?", req.MusicID).Update("like_count", gorm.Expr("like_count - 1"))
		if RES.Error != nil {
			return utils.SendError(c, "点赞失败")
		}

		result := map[string]interface{}{
			"playlist": playlist,
			"message":  "已移除",
			"action":   "removed",
		}
		return utils.SendSuccess(c, "移除成功", result)
	}

	// 点赞计数
	RES := h.db.Model(&entity.Music{}).Where("id = ?", req.MusicID).Update("like_count", gorm.Expr("like_count - 1"))
	if RES.Error != nil {
		return utils.SendError(c, "点赞失败")
	}

	// 直接插入关联表
	if err := h.db.Exec(
		"INSERT INTO playlist_musics (playlist_id, music_id) VALUES (?, ?)",
		playlist.ID,
		req.MusicID,
	).Error; err != nil {
		return utils.SendError(c, "添加音乐到播放列表失败: "+err.Error())
	}

	result := map[string]interface{}{
		"playlist": playlist,
		"message":  "添加成功",
		"action":   "added",
	}

	return utils.SendSuccess(c, "添加成功", result)
}

// RemoveMusicFromPlaylist 从播放列表删除音乐
func (h *PlaylistHandler) RemoveMusicFromPlaylist(c *fiber.Ctx) error {
	playlistID := c.Params("id") // ID is now a string

	var req dto.RemoveMusicFromPlaylistRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.SendError(c, "请求参数解析失败")
	}

	var playlist entity.Playlist
	if err := h.db.First(&playlist, "id = ?", playlistID).Error; err != nil {
		return utils.SendError(c, "播放列表不存在")
	}

	var music entity.Music
	if err := h.db.First(&music, "id = ?", req.MusicID).Error; err != nil {
		return utils.SendError(c, "音乐不存在")
	}

	if err := h.db.Model(&playlist).Association("Musics").Delete(&music); err != nil {
		return utils.SendError(c, "从播放列表删除音乐失败")
	}

	return utils.SendSuccess(c, "删除成功", nil)
}

// PlayPlaylist 播放播放列表（增加播放次数）
func (h *PlaylistHandler) PlayPlaylist(c *fiber.Ctx) error {
	id := c.Params("id") // ID is now a string

	// 使用 gorm.Expr 进行原子更新，避免竞态条件
	result := h.db.Model(&entity.Playlist{}).Where("id = ?", id).Update("play_count", gorm.Expr("play_count + 1"))
	if result.Error != nil {
		return utils.SendError(c, "增加播放次数失败")
	}
	if result.RowsAffected == 0 {
		return utils.SendError(c, "播放列表不存在")
	}

	return utils.SendSuccess(c, "播放列表播放次数增加成功", nil)
}

// AddToFavoritePlaylist 添加到"我的喜爱"播放列表（支持切换）
func (h *PlaylistHandler) AddToFavoritePlaylist(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return utils.SendError(c, "未认证的用户")
	}

	// 从请求体获取要添加的音乐ID
	var req dto.AddMusicToPlaylistRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.SendError(c, "请求参数解析失败")
	}

	log.Printf("[DEBUG] 请求的音乐ID: '%s'", req.MusicID)

	// 检查音乐是否存在
	var musicExists bool
	if err := h.db.Model(&entity.Music{}).
		Select("count(*) > 0").
		Where("id = ?", req.MusicID).
		Find(&musicExists).Error; err != nil {
		return utils.SendError(c, "查询音乐失败")
	}

	if !musicExists {
		return utils.SendError(c, "音乐不存在")
	}

	// 查找或创建"我的喜爱"播放列表
	var playlist entity.Playlist
	err := h.db.Where("name = ? AND user_id = ?", "我的喜爱", userID).First(&playlist).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			playlist = entity.Playlist{
				Name:        "我的喜爱",
				Description: "我喜欢的音乐",
				UserID:      userID,
			}

			if err := h.db.Create(&playlist).Error; err != nil {
				return utils.SendError(c, "创建播放列表失败: "+err.Error())
			}
			log.Printf("[DEBUG] 创建新的'我的喜爱'播放列表: %s", playlist.ID)
		} else {
			return utils.SendError(c, "查询播放列表失败")
		}
	}

	// 检查音乐是否已在播放列表中（直接查询关联表）
	var existingCount int64
	if err := h.db.Table("playlist_musics").
		Where("playlist_id = ? AND music_id = ?", playlist.ID, req.MusicID).
		Count(&existingCount).Error; err != nil {
		return utils.SendError(c, "检查关联失败")
	}

	if existingCount > 0 {
		// 存在的话直接删除关联取消我的喜爱
		if err := h.db.Exec(
			"DELETE FROM playlist_musics WHERE playlist_id = ? AND music_id = ?",
			playlist.ID,
			req.MusicID,
		).Error; err != nil {
			log.Printf("[ERROR] 移除关联失败: %v", err)
			return utils.SendError(c, "取消喜爱失败: "+err.Error())
		}

		log.Printf("[DEBUG] 成功从播放列表 %s 移除音乐 %s", playlist.ID, req.MusicID)

		result := map[string]interface{}{
			"playlist":  playlist,
			"music_id":  req.MusicID,
			"favorited": false,
			"action":    "removed",
			"message":   "已取消喜爱",
		}

		return utils.SendSuccess(c, "取消喜爱成功", result)
	}

	// 直接插入关联表，避免操作 music 表
	if err := h.db.Exec(
		"INSERT INTO playlist_musics (playlist_id, music_id) VALUES (?, ?)",
		playlist.ID,
		req.MusicID,
	).Error; err != nil {
		log.Printf("[ERROR] 添加关联失败: %v", err)
		return utils.SendError(c, "添加音乐到播放列表失败: "+err.Error())
	}

	log.Printf("[DEBUG] 成功添加音乐 %s 到播放列表 %s", req.MusicID, playlist.ID)

	// 获取完整的音乐信息用于返回
	var music entity.Music
	h.db.First(&music, "id = ?", req.MusicID)

	result := map[string]interface{}{
		"playlist":  playlist,
		"music":     music,
		"favorited": true,
		"action":    "added",
		"message":   "添加到我的喜爱成功",
	}

	return utils.SendSuccess(c, "添加成功", result)
}
