package subsonic

// 参考 Subsonic 1.16 响应结构的最小子集
type Artist struct {
	ID   string `xml:"id,attr"`
	Name string `xml:"name,attr"`
}

type Album struct {
	ID        string `xml:"id,attr"`
	Name      string `xml:"name,attr"`
	Artist    string `xml:"artist,attr,omitempty"`
	CoverArt  string `xml:"coverArt,attr,omitempty"`
	SongCount int    `xml:"songCount,attr,omitempty"`
	Duration  int    `xml:"duration,attr,omitempty"`
}

type Song struct {
	ID       string `xml:"id,attr"`
	Parent   string `xml:"parent,attr,omitempty"`
	Title    string `xml:"title,attr"`
	Artist   string `xml:"artist,attr,omitempty"`
	Album    string `xml:"album,attr,omitempty"`
	Track    int    `xml:"track,attr,omitempty"`
	Duration int    `xml:"duration,attr,omitempty"`
	CoverArt string `xml:"coverArt,attr,omitempty"`
	Type     string `xml:"type,attr,omitempty"` // "music"
}
