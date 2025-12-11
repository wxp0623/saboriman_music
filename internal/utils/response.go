package utils

import (
	"saboriman-music/internal/dto"

	"github.com/gofiber/fiber/v2"
)

// SendError 是一个全局辅助函数，用于发送标准化的 JSON 错误响应。
func SendError(c *fiber.Ctx, message string) error {
	return c.Status(fiber.StatusInternalServerError).JSON(dto.Error(message))
}

// SendSuccess 是一个全局辅助函数，用于发送标准化的 JSON 成功响应。
// 如果 data 为 nil，它会发送不带数据的成功响应。
func SendSuccess(c *fiber.Ctx, message string, data interface{}) error {
	if data != nil {
		return c.Status(fiber.StatusOK).JSON(dto.SuccessWithData(message, data))
	}
	return c.Status(fiber.StatusOK).JSON(dto.Success(message))
}

func SendSuccessNoData(c *fiber.Ctx, statusCode int, message string) error {
	return SendSuccess(c, message, nil)
}

func SendSuccessWithData(c *fiber.Ctx, message string, data interface{}) error {
	return SendSuccess(c, message, data)
}

func SendErrorMessage(c *fiber.Ctx, message string) error {
	return SendError(c, message)
}

func SendErrorWithStatus(c *fiber.Ctx, statusCode int, message string) error {
	return c.Status(statusCode).JSON(dto.Error(message))
}
