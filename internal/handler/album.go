package handler

import (
	"saboriman-music/internal/dto"
	"saboriman-music/internal/entity"
	"saboriman-music/internal/utils"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// AlbumHandler 专辑处理器
type AlbumHandler struct {
	db *gorm.DB
}

// NewAlbumHandler 创建专辑处理器实例
func NewAlbumHandler(db *gorm.DB) *AlbumHandler {
	return &AlbumHandler{db: db}
}

// CreateAlbum 创建专辑
func (h *AlbumHandler) CreateAlbum(c *fiber.Ctx) error {
	var req dto.CreateAlbumRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.SendError(c, "请求参数解析失败")
	}

	if req.Name == "" {
		return utils.SendError(c, "专辑名称不能为空")
	}

	album := entity.Album{
		Name:        req.Name,
		ArtistName:  req.ArtistName,
		CoverURL:    req.CoverURL,
		ReleaseDate: req.ReleaseDate,
	}

	if err := h.db.Create(&album).Error; err != nil {
		return utils.SendError(c, "创建专辑失败: "+err.Error())
	}

	return utils.SendSuccess(c, "专辑创建成功", album)
}

// GetAlbum 获取专辑信息
func (h *AlbumHandler) GetAlbum(c *fiber.Ctx) error {
	id := c.Params("id")

	var album entity.Album
	// 预加载关联的音乐列表
	if err := h.db.First(&album, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.SendError(c, "专辑不存在")
		}
		return utils.SendError(c, "查询专辑失败")
	}

	return utils.SendSuccess(c, "获取专辑成功", album)
}

// UpdateAlbum 更新专辑
func (h *AlbumHandler) UpdateAlbum(c *fiber.Ctx) error {
	id := c.Params("id")

	var album entity.Album
	if err := h.db.First(&album, "id = ?", id).Error; err != nil {
		return utils.SendError(c, "专辑不存在")
	}

	var req dto.UpdateAlbumRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.SendError(c, "请求参数解析失败")
	}

	// 手动更新字段
	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.ArtistName != "" {
		updates["artist_name"] = req.ArtistName
	}
	if req.CoverURL != "" {
		updates["cover_url"] = req.CoverURL
	}
	if req.ReleaseDate != nil {
		updates["release_date"] = req.ReleaseDate
	}

	if err := h.db.Model(&album).Updates(updates).Error; err != nil {
		return utils.SendError(c, "更新专辑失败")
	}

	return utils.SendSuccess(c, "专辑更新成功", album)
}

// DeleteAlbum 删除专辑
func (h *AlbumHandler) DeleteAlbum(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.db.Delete(&entity.Album{}, "id = ?", id).Error; err != nil {
		return utils.SendError(c, "删除专辑失败")
	}

	return utils.SendSuccess(c, "专辑删除成功", nil)
}

// ListAlbums 获取专辑列表
func (h *AlbumHandler) ListAlbums(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("page_size", 10)
	query := c.Query("q")

	var albums []entity.Album
	var total int64

	dbQuery := h.db.Model(&entity.Album{})

	if query != "" {
		searchQuery := "%" + query + "%"
		dbQuery = dbQuery.Where("name LIKE ? OR artist_name LIKE ?", searchQuery, searchQuery)
	}

	if err := dbQuery.Count(&total).Error; err != nil {
		return utils.SendError(c, "获取专辑总数失败")
	}

	offset := (page - 1) * pageSize
	if err := dbQuery.Offset(offset).Limit(pageSize).Find(&albums).Error; err != nil {
		return utils.SendError(c, "获取专辑列表失败")
	}

	totalPages := (total + int64(pageSize) - 1) / int64(pageSize)

	result := map[string]interface{}{
		"data":       albums,
		"total":      total,
		"page":       page,
		"totalPages": totalPages,
	}
	return utils.SendSuccess(c, "获取专辑列表成功", result)
}

// GetAlbumMusics 获取专辑下的所有音乐
func (h *AlbumHandler) GetAlbumMusics(c *fiber.Ctx) error {
	id := c.Params("id")

	var album entity.Album
	if err := h.db.Preload("Musics").First(&album, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.SendError(c, "专辑不存在")
		}
		return utils.SendError(c, "查询专辑失败")
	}

	return utils.SendSuccess(c, "获取专辑音乐列表成功", album.Musics)
}
