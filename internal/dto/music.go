package dto

import (
	"saboriman-music/internal/entity"
)

type ListMusicResponse struct {
	entity.Music
	Favorited bool `json:"favorited"`
}

type LyricRequest struct {
	Title  string `json:"title"`
	Artist string `json:"artist"`
	Album  string `json:"album"`
}
