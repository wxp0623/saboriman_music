package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"golang.org/x/net/html"
)

// func main() {
// 	artist := ""
// 	song := "There's No Moonlight This Night"

// 	l := lyrics.New(
// 		lyrics.WithoutProviders(),
// 		lyrics.WithGeniusLyrics("Zun7TK6NggeBT3dz0hWK-AlKwdrJBsRiPR2z0SyYL9pzEXwCBVLpeaN8-U4LArF9"),
// 	) // 使用所有支持的 provider
// 	lyric, err := l.Search(artist, song)
// 	if err != nil {
// 		fmt.Printf("Lyrics not found: %v\n", err)
// 		return
// 	}
// 	fmt.Println("Lyrics:", lyric)
// }

// package main

// fetchGeniusLyrics 抓取给定 Genius 歌词页面 URL 的歌词文本
func fetchGeniusLyrics(url string) (string, error) {
	// 1. 发起 HTTP 请求
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}
	// 设置 User-Agent，避免被阻拦
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; LyricsScraper/1.0)")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("non-OK HTTP status: %s", resp.Status)
	}

	// 2. 解析 HTML
	body := resp.Body
	// 使用 net/html 解析
	doc, err := html.Parse(body)
	if err != nil {
		return "", err
	}

	// 3. 遍历 HTML tree，查找歌词所在 DOM 节点
	var lyricsBuilder strings.Builder
	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "div" {
			// Genius 的旧版歌词页面可能是 <div class="lyrics">，新版可能使用不同 class /结构
			for _, a := range n.Attr {
				if a.Key == "class" && strings.Contains(a.Val, "Lyrics__Container") {
					// 找到歌词容器，提取其文本 (包括子文本)
					text := extractText(n)
					lyricsBuilder.WriteString(text)
					lyricsBuilder.WriteString("\n")
					return
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(doc)

	result := lyricsBuilder.String()
	if strings.TrimSpace(result) == "" {
		return "", fmt.Errorf("lyrics not found in page")
	}
	return result, nil
}

// extractText 递归提取一个 HTML 节点及其子节点的文本内容
func extractText(n *html.Node) string {
	var buf strings.Builder
	var g func(*html.Node)
	g = func(x *html.Node) {
		if x.Type == html.TextNode {
			buf.WriteString(x.Data)
		}
		for c := x.FirstChild; c != nil; c = c.NextSibling {
			g(c)
		}
	}
	g(n)
	return buf.String()
}

func main() {
	url := "https://genius.com/Wuthering-waves-and-kendra-dantes-theres-no-moonlight-this-night-lyrics" // TODO: 替换成真实 URL
	lyrics, err := fetchGeniusLyrics(url)
	if err != nil {
		log.Fatalf("Error: %v\n", err)
	}
	fmt.Println("Lyrics:\n", lyrics)
}
