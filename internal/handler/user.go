package handler

import (
	"saboriman-music/internal/dto"
	"saboriman-music/internal/entity"
	"saboriman-music/internal/utils"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jinzhu/copier"
	"gorm.io/gorm"
)

// UserHandler 用户处理器
type UserHandler struct {
	db *gorm.DB
}

// NewUserHandler 创建用户处理器实例
func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{db: db}
}

// Register 用户注册
func (h *UserHandler) Register(c *fiber.Ctx) error {
	var req dto.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.SendError(c, "请求参数解析失败")
	}

	// 验证用户名是否已存在
	var existingUser entity.User
	if err := h.db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		return utils.SendError(c, "用户名已存在")
	}

	// 验证邮箱是否已存在
	if err := h.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return utils.SendError(c, "邮箱已被注册")
	}

	// 创建用户
	user := entity.User{
		Username: req.Username,
		Email:    req.Email,
		Role:     entity.RoleUser, // 使用枚举
		Status:   1,
	}

	// 加密密码
	if err := user.HashPassword(req.Password); err != nil {
		return utils.SendError(c, "密码加密失败")
	}

	if err := h.db.Create(&user).Error; err != nil {
		return utils.SendError(c, "注册失败: "+err.Error())
	}

	// 生成 token
	token, err := utils.GenerateToken(user.ID, user.Username, user.Email, string(user.Role))
	if err != nil {
		return utils.SendError(c, "生成 token 失败")
	}

	response := dto.LoginResponse{
		Token:     token,
		ExpiresAt: time.Now().Add(utils.JWTExpiration).Unix(),
		User: dto.UserInfo{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			Avatar:   user.Avatar,
			Role:     string(user.Role), // 转换为字符串
		},
	}

	return utils.SendSuccess(c, "注册成功", response)
}

// Login 用户登录
func (h *UserHandler) Login(c *fiber.Ctx) error {
	var req dto.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.SendError(c, "请求参数解析失败")
	}

	// 查找用户（支持用户名或邮箱登录）
	var user entity.User
	if err := h.db.Where("username = ? OR email = ?", req.Username, req.Username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.SendError(c, "用户名或密码错误")
		}
		return utils.SendError(c, "登录失败")
	}

	// 验证密码
	if !user.CheckPassword(req.Password) {
		return utils.SendError(c, "用户名或密码错误")
	}

	// 生成 token
	token, err := utils.GenerateToken(user.ID, user.Username, user.Email, string(user.Role))
	if err != nil {
		return utils.SendError(c, "生成 token 失败")
	}

	response := dto.LoginResponse{
		Token:     token,
		ExpiresAt: time.Now().Add(utils.JWTExpiration).Unix(),
		User: dto.UserInfo{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			Avatar:   user.Avatar,
			Role:     string(user.Role),
		},
	}

	return utils.SendSuccess(c, "登录成功", response)
}

// GetCurrentUser 获取当前登录用户信息
func (h *UserHandler) GetCurrentUser(c *fiber.Ctx) error {
	// 从 context 中获取用户信息（由中间件设置）
	userID := c.Locals("userID").(string)

	var user entity.User
	if err := h.db.First(&user, "id = ?", userID).Error; err != nil {
		return utils.SendError(c, "用户不存在")
	}

	userInfo := dto.UserInfo{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		Avatar:   user.Avatar,
		Role:     string(user.Role),
	}

	return utils.SendSuccess(c, "获取用户信息成功", userInfo)
}

// ChangePassword 修改密码
func (h *UserHandler) ChangePassword(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	var req dto.ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.SendError(c, "请求参数解析失败")
	}

	var user entity.User
	if err := h.db.First(&user, "id = ?", userID).Error; err != nil {
		return utils.SendError(c, "用户不存在")
	}

	// 验证旧密码
	if !user.CheckPassword(req.OldPassword) {
		return utils.SendError(c, "原密码错误")
	}

	// 设置新密码
	if err := user.HashPassword(req.NewPassword); err != nil {
		return utils.SendError(c, "密码加密失败")
	}

	if err := h.db.Save(&user).Error; err != nil {
		return utils.SendError(c, "修改密码失败")
	}

	return utils.SendSuccess(c, "密码修改成功", nil)
}

// Logout 用户登出（可选，主要在前端清除 token）
func (h *UserHandler) Logout(c *fiber.Ctx) error {
	// JWT 是无状态的，登出主要在前端处理
	// 如果需要服务端处理，可以维护一个黑名单
	return utils.SendSuccess(c, "登出成功", nil)
}

// CreateUser 创建用户
func (h *UserHandler) CreateUser(c *fiber.Ctx) error {
	var req dto.CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.SendError(c, "请求参数解析失败")
	}

	if req.Username == "" {
		return utils.SendError(c, "用户名不能为空")
	}
	if req.Email == "" {
		return utils.SendError(c, "邮箱不能为空")
	}

	var user entity.User
	copier.Copy(&user, &req)

	if err := h.db.Create(&user).Error; err != nil {
		return utils.SendError(c, "创建用户失败: "+err.Error())
	}

	return utils.SendSuccess(c, "用户创建成功", user)
}

// GetUser 获取用户信息
func (h *UserHandler) GetUser(c *fiber.Ctx) error {
	id := c.Params("id")

	var user entity.User
	if err := h.db.First(&user, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.SendError(c, "用户不存在")
		}
		return utils.SendError(c, "查询用户失败")
	}

	return utils.SendSuccess(c, "获取用户成功", user)
}

// UpdateUser 更新用户
func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	id := c.Params("id")

	var user entity.User
	if err := h.db.First(&user, "id = ?", id).Error; err != nil {
		return utils.SendError(c, "用户不存在")
	}

	var req dto.UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.SendError(c, "请求参数解析失败")
	}

	if err := h.db.Model(&user).Updates(&req).Error; err != nil {
		return utils.SendError(c, "更新用户失败")
	}

	return utils.SendSuccess(c, "用户更新成功", user)
}

// DeleteUser 删除用户
func (h *UserHandler) DeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.db.Delete(&entity.User{}, "id = ?", id).Error; err != nil {
		return utils.SendError(c, "删除用户失败")
	}

	return utils.SendSuccess(c, "用户删除成功", nil)
}

// ListUsers 获取用户列表
func (h *UserHandler) ListUsers(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("page_size", 10)
	query := c.Query("q")

	var users []entity.User
	var total int64

	dbQuery := h.db.Model(&entity.User{})

	if query != "" {
		searchQuery := "%" + query + "%"
		dbQuery = dbQuery.Where("username LIKE ? OR email LIKE ?", searchQuery, searchQuery)
	}

	if err := dbQuery.Count(&total).Error; err != nil {
		return utils.SendError(c, "获取用户总数失败")
	}

	offset := (page - 1) * pageSize
	if err := dbQuery.Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
		return utils.SendError(c, "获取用户列表失败")
	}

	totalPages := (total + int64(pageSize) - 1) / int64(pageSize)

	result := map[string]interface{}{
		"data":        users,
		"total":       total,
		"page":        page,
		"total_pages": totalPages,
	}
	return utils.SendSuccess(c, "获取用户列表成功", result)
}
