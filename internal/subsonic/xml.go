package subsonic

import (
	"encoding/xml"
	"net/http"

	"github.com/gofiber/fiber/v2"
)

type Response struct {
	XMLName xml.Name `xml:"subsonic-response"`
	Status  string   `xml:"status,attr"`  // "ok" or "failed"
	Version string   `xml:"version,attr"` // e.g. "1.16.1"
	Type    string   `xml:"type,attr,omitempty"`
	Server  string   `xml:"serverVersion,attr,omitempty"`

	Error   *Error   `xml:"error,omitempty"`
	Ping    *Ping    `xml:"ping,omitempty"`
	License *License `xml:"license,omitempty"`

	// Browsing
	Indexes       *IndexesResponse `xml:"indexes,omitempty"`
	Artists       *ArtistsResponse `xml:"artists,omitempty"`
	Album         *AlbumResponse   `xml:"album,omitempty"`
	Playlists     *Playlists       `xml:"playlists,omitempty"`
	Playlist      *Playlist        `xml:"playlist,omitempty"`
	NowPlaying    *NowPlaying      `xml:"nowPlaying,omitempty"`
	RandomSongs   *SongsResponse   `xml:"randomSongs,omitempty"`
	SearchResult2 *SearchResult2   `xml:"searchResult2,omitempty"`
}

// Standard error format
type Error struct {
	Code    int    `xml:"code,attr"`
	Message string `xml:"message,attr"`
}

type License struct {
	Valid bool `xml:"valid,attr"`
}

type Ping struct{}

type IndexesResponse struct {
	LastModified int64    `xml:"lastModified,attr,omitempty"`
	Children     []Artist `xml:"artist"`
}

type ArtistsResponse struct {
	Index []ArtistIndex `xml:"index"`
}

type ArtistIndex struct {
	Name    string   `xml:"name,attr"`
	Artists []Artist `xml:"artist"`
}

type AlbumResponse struct {
	Album Album `xml:"album"`
}

type SongsResponse struct {
	Song []Song `xml:"song"`
}

type Playlists struct{}
type Playlist struct{}
type NowPlaying struct{}
type SearchResult2 struct{}

func WriteXML(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "text/xml; charset=utf-8")
	enc := xml.NewEncoder(w)
	enc.Indent("", "  ")
	_ = enc.Encode(v)
}

func WriteXMLFiber(c *fiber.Ctx, v any) error {
	c.Type("xml", "utf-8")
	enc := xml.NewEncoder(c)
	enc.Indent("", "  ")
	if err := enc.Encode(v); err != nil {
		return err
	}
	return nil
}
