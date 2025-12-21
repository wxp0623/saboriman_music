package router

import (
	"saboriman-music/internal/subsonic"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func RegisterSubsonic(app *fiber.App, db *gorm.DB) {
	subsonic := subsonic.NewMusicHandler(db)

	rest := app.Group("/rest")

	rest.Get("/ping.view", subsonic.HandlePing)
	rest.Get("/getLicense.view", subsonic.HandleGetLicense)

	// Browsing
	rest.Get("/getArtists.view", subsonic.HandleGetArtists)
	rest.Get("/getAlbum.view", subsonic.HandleGetAlbum)
	rest.Get("/getRandomSongs.view", subsonic.HandleGetRandomSongs)

	// Media
	rest.Get("/getCoverArt.view", subsonic.HandleGetCoverArt)
	rest.Get("/stream.view", subsonic.HandleStream)
}
