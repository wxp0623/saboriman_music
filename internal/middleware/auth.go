package middleware

import (
	"saboriman-music/internal/entity"
	"saboriman-music/internal/utils"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// AuthMiddleware JWT 认证中间件
func AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 获取 Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"code":    401,
				"message": "未提供认证令牌",
				"data":    nil,
			})
		}

		// 检查格式：Bearer <token>
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"code":    401,
				"message": "认证令牌格式错误",
				"data":    nil,
			})
		}

		// 解析 token
		claims, err := utils.ParseToken(parts[1])
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"code":    401,
				"message": "无效的认证令牌",
				"data":    nil,
			})
		}

		// 将用户信息存储到 context 中
		c.Locals("userID", claims.UserID)
		c.Locals("username", claims.Username)
		c.Locals("email", claims.Email)
		c.Locals("role", entity.RoleFromString(claims.Role))

		return c.Next()
	}
}

// AdminMiddleware 管理员权限中间件
func AdminMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(entity.Role)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"code":    403,
				"message": "无法获取用户角色",
				"data":    nil,
			})
		}

		if !role.IsAdmin() {
			// return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			// 	"code":    403,
			// 	"message": "权限不足，需要管理员权限",
			// 	"data":    nil,
			// })
		}

		return c.Next()
	}
}

// RoleMiddleware 创建角色权限中间件
func RoleMiddleware(allowedRoles ...entity.Role) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(entity.Role)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"code":    403,
				"message": "无法获取用户角色",
				"data":    nil,
			})
		}

		// 检查角色是否在允许列表中
		for _, allowedRole := range allowedRoles {
			if role == allowedRole {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"code":    403,
			"message": "权限不足",
			"data":    nil,
		})
	}
}
