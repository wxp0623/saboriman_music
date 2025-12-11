package router

import (
	"saboriman-music/internal/handler"
	"saboriman-music/internal/middleware"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func SetupRoutes(app *fiber.App, db *gorm.DB) {
	// 创建处理器
	userHandler := handler.NewUserHandler(db)
	musicHandler := handler.NewMusicHandler(db)
	lyricsHandler := handler.NewLyricsHandler(db)
	albumHandler := handler.NewAlbumHandler(db)
	playlistHandler := handler.NewPlaylistHandler(db)

	api := app.Group("/api")

	// 公开路由（不需要认证）
	auth := api.Group("/auth")
	auth.Post("/register", userHandler.Register)
	auth.Post("/login", userHandler.Login)

	// 在音乐相关路由中添加
	lyrics := api.Group("/lyrics")
	lyrics.Get("/search", lyricsHandler.SearchLyricsProxy)
	lyrics.Get("/get", lyricsHandler.GetLyricsByIdProxy)

	// 需要认证的路由
	protected := api.Group("", middleware.AuthMiddleware())

	// 用户相关
	users := protected.Group("/users")
	users.Get("/me", userHandler.GetCurrentUser)
	users.Put("/me/password", userHandler.ChangePassword)
	users.Post("/logout", userHandler.Logout)

	// 管理员路由
	admin := protected.Group("", middleware.AdminMiddleware())
	adminUsers := admin.Group("/users")
	adminUsers.Get("", userHandler.ListUsers)
	adminUsers.Post("", userHandler.CreateUser)
	adminUsers.Get("/:id", userHandler.GetUser)
	adminUsers.Put("/:id", userHandler.UpdateUser)
	adminUsers.Delete("/:id", userHandler.DeleteUser)

	// 音乐相关（需要认证）
	musics := protected.Group("/musics")
	musics.Get("", musicHandler.ListMusics)
	musics.Post("", musicHandler.CreateMusic)
	musics.Get("/:id", musicHandler.GetMusic)
	musics.Put("/:id", musicHandler.UpdateMusic)
	musics.Delete("/:id", musicHandler.DeleteMusic)
	musics.Get("/:id/lyrics", musicHandler.GetLyrics)   // 新增：获取歌词
	musics.Post("/:id/lyrics", musicHandler.SaveLyrics) // 新增：保存歌词
	musics.Post("/:id/play", musicHandler.PlayMusic)
	musics.Post("/:id/like", musicHandler.LikeMusic)
	musics.Post("/scan", musicHandler.ScanLibrary)

	// 专辑相关
	albums := protected.Group("/albums")
	albums.Get("", albumHandler.ListAlbums)
	albums.Post("", albumHandler.CreateAlbum)
	albums.Get("/:id", albumHandler.GetAlbum)
	albums.Put("/:id", albumHandler.UpdateAlbum)
	albums.Delete("/:id", albumHandler.DeleteAlbum)
	albums.Get("/:id/musics", albumHandler.GetAlbumMusics)

	// 播放列表相关
	playlists := protected.Group("/playlists")
	playlists.Get("", playlistHandler.ListPlaylists)
	playlists.Post("", playlistHandler.CreatePlaylist)
	playlists.Get("/:id", playlistHandler.GetPlaylist)
	playlists.Put("/:id", playlistHandler.UpdatePlaylist)
	playlists.Delete("/:id", playlistHandler.DeletePlaylist)
	playlists.Post("/:id/musics", playlistHandler.AddMusicToPlaylist)
	playlists.Delete("/:id/musics", playlistHandler.RemoveMusicFromPlaylist)
	playlists.Post("/:id/play", playlistHandler.PlayPlaylist)
	playlists.Post("/favorite", playlistHandler.AddToFavoritePlaylist)
}
