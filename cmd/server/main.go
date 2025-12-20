package main

import (
	"fmt"
	"log"
	"saboriman-music/config"
	"saboriman-music/internal/db"
	"saboriman-music/internal/handler" // 1. 导入 handler 包
	"saboriman-music/internal/router"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	// 加载全局配置
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("无法加载配置: %v", err)
	}

	// 2. 创建一个 db.Config 实例，并从全局配置中填充它
	dbConfig := db.Config{
		Driver:   cfg.Database.Type,
		Host:     cfg.Database.Host,
		Port:     cfg.Database.Port,
		Username: cfg.Database.User,
		Password: cfg.Database.Password,
		Database: cfg.Database.Name,
		FilePath: cfg.Database.Path, // for sqlite
		Charset:  "utf8mb4",         // 默认值
	}

	// 3. 调用正确的 NewDatabase 函数
	database, err := db.NewDatabase(dbConfig)
	if err != nil {
		log.Fatalf("无法初始化数据库: %v", err)
	}

	// 4. 从返回的 *db.Database 结构体中获取 *gorm.DB
	gormDB := database.DB

	// 自动迁移数据库
	if err := database.AutoMigrate(); err != nil {
		log.Printf("警告: 数据库自动迁移失败: %v", err)
	}

	// 2. 在程序启动时执行一次音乐库扫描
	if cfg.MusicFolder != "" {
		log.Println("🚀 服务启动，开始执行后台音乐库扫描...")
		go handler.ScanLibraryInBackground(gormDB, cfg.MusicFolder)
	} else {
		log.Println("⚠️  配置中未指定 MusicFolder，跳过启动时扫描。")
	}

	app := fiber.New()

	// 中间件
	app.Use(cors.New())
	app.Use(logger.New())

	// 静态文件服务
	app.Static("/uploads", "./uploads")
	app.Static("/music/.covers", "/music/.covers")
	app.Static("/", "./frontend/dist")
	// 静态文件服务 - 提供音乐文件访问

	appBasePath := config.AppConfig.AppBasePath
	app.Static("/music", appBasePath+"/music", fiber.Static{
		Browse:    false,
		ByteRange: true, // 支持断点续传
	})

	// 5. 将 *gorm.DB 实例传递给路由设置函数
	router.SetupRoutes(app, gormDB)

	// SPA 路由回退：把非 /api 开头的所有请求回退到 index.html
	app.Use(func(c *fiber.Ctx) error {
		// 已处理的或 API 请求直接继续
		if c.Path() == "/" || c.Path() == "/index.html" || strings.HasPrefix(c.Path(), "/api") {
			return c.Next()
		}
		// 如果是静态资源存在则直接返回
		if strings.HasPrefix(c.Path(), "/assets") {
			return c.Next()
		}
		// 回退到 index.html
		c.Set("Content-Type", "text/html; charset=utf-8")
		return c.SendFile("./frontend/dist/index.html")
	})

	// 启动服务器
	addr := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("🚀 服务器启动成功! 监听于 %s", addr)
	log.Printf("🎵 音乐库路径: %s", cfg.MusicFolder)
	log.Fatal(app.Listen(addr))
}
