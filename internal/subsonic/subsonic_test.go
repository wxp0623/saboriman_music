package subsonic_test

import (
	"fmt"
	"io"
	"net/http/httptest"
	"strings"
	"testing"

	"saboriman-music/internal/router"

	"github.com/gofiber/fiber/v2"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// 定义用于测试的最小实体（与你项目的 entity 对应字段保持一致）
type Music struct {
	ID          uint `gorm:"primaryKey"`
	Title       string
	Artist      string
	AlbumName   string
	Duration    int
	CoverUrl    string
	FilePath    string
	TrackNumber int
}
type Album struct {
	ID         uint `gorm:"primaryKey"`
	Name       string
	ArtistName string
	CoverURL   string
	Musics     []Music `gorm:"foreignKey:AlbumName;references:Name"`
}

func setup(t *testing.T) (*fiber.App, *gorm.DB) {
	t.Helper()
	// 内存 DB
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	// 迁移与准备数据
	if err := db.AutoMigrate(&Album{}, &Music{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	al := Album{ID: 1, Name: "Test Album", ArtistName: "Artist A", CoverURL: "/uploads/covers/test.jpg"}
	if err := db.Create(&al).Error; err != nil {
		t.Fatalf("seed album: %v", err)
	}
	musics := []Music{
		{ID: 1, Title: "Song 1", Artist: "Artist A", AlbumName: "Test Album", Duration: 240, CoverUrl: "/uploads/covers/test.jpg", FilePath: "/music/song1.mp3", TrackNumber: 1},
		{ID: 2, Title: "Song 2", Artist: "Band B", AlbumName: "Test Album", Duration: 200, CoverUrl: "/uploads/covers/test.jpg", FilePath: "/music/song2.mp3", TrackNumber: 2},
		{ID: 3, Title: "Song 3", Artist: "3 Doors Down", AlbumName: "Test Album", Duration: 180, CoverUrl: "/uploads/covers/test.jpg", FilePath: "/music/song3.mp3", TrackNumber: 3},
	}
	if err := db.Create(&musics).Error; err != nil {
		t.Fatalf("seed musics: %v", err)
	}

	// Fiber app + 注册子声波路由
	app := fiber.New()
	router.RegisterSubsonic(app, db) // 你已有此函数

	return app, db
}

func get(app *fiber.App, path string) (int, string) {
	req := httptest.NewRequest("GET", path, nil)
	res, _ := app.Test(req, -1)
	body, _ := io.ReadAll(res.Body)
	return res.StatusCode, string(body)
}

func TestPing(t *testing.T) {
	app, _ := setup(t)
	code, body := get(app, "/rest/ping.view?u=test&p=enc:74657374&v=1.16.1&c=test")
	if code != 200 {
		t.Fatalf("status=%d body=%s", code, body)
	}
	if !strings.Contains(body, `<subsonic-response status="ok"`) {
		t.Fatalf("unexpected body: %s", body)
	}
}

func TestGetLicense(t *testing.T) {
	app, _ := setup(t)
	code, body := get(app, "/rest/getLicense.view")
	if code != 200 || !strings.Contains(body, `<license valid="true"`) {
		t.Fatalf("unexpected: %d %s", code, body)
	}
}

func TestGetArtists(t *testing.T) {
	app, _ := setup(t)
	// getArtists 需要返回分组索引
	code, body := get(app, "/rest/getArtists.view?u=test&p=enc:74657374&v=1.16.1&c=test")
	if code != 200 {
		t.Fatalf("status=%d body=%s", code, body)
	}
	// 包含 A/0-9 分组与 artist 节点
	if !(strings.Contains(body, `<artists>`) && strings.Contains(body, `name="A"`) && strings.Contains(body, `name="0-9"`)) {
		t.Fatalf("unexpected getArtists body: %s", body)
	}
}

func TestGetAlbum(t *testing.T) {
	app, _ := setup(t)
	code, body := get(app, "/rest/getAlbum.view?id=1&u=test&p=enc:74657374&v=1.16.1&c=test")
	if code != 200 {
		t.Fatalf("status=%d body=%s", code, body)
	}
	// 验证 album 节点与 RandomSongs（我们把 songs 返回在 RandomSongs）
	if !(strings.Contains(body, `<album>`) && strings.Contains(body, `<song`)) {
		t.Fatalf("unexpected getAlbum body: %s", body)
	}
}

func TestGetCoverArt_NotFound(t *testing.T) {
	app, _ := setup(t)
	code, body := get(app, "/rest/getCoverArt.view?id=999")
	if code != 404 {
		t.Fatalf("expected 404, got %d body=%s", code, body)
	}
}

func TestStream_NotFound(t *testing.T) {
	app, _ := setup(t)
	code, body := get(app, "/rest/stream.view?id=999")
	if code != 404 {
		t.Fatalf("expected 404, got %d body=%s", code, body)
	}
}

// 可选：随机歌曲接口（当前实现用 DB 随机并映射为 Subsonic Song）
func TestGetRandomSongs(t *testing.T) {
	app, _ := setup(t)
	code, body := get(app, "/rest/getRandomSongs.view?size=2&u=test&p=enc:74657374&v=1.16.1&c=test")
	if code != 200 {
		t.Fatalf("status=%d body=%s", code, body)
	}
	if !strings.Contains(body, `<randomSongs>`) {
		t.Fatalf("unexpected randomSongs body: %s", body)
	}
}

// 便于在容器里本地查看 XML
func ExampleBrowse() {
	app, _ := setup(&testing.T{})
	_, _ = get(app, "/rest/ping.view?u=test&p=enc:74657374&v=1.16.1&c=test")
	fmt.Println("ok")
	// Output: ok
}
