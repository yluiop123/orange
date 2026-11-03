package auth

import (
	"net/http"
	"strings"

	"github.com/orange/backend-go-gin-gorm/internal/config"
)

const RefreshCookieName = "refresh_token"

// CookieManager writes the HttpOnly rotating refresh cookie. JavaScript never
// sees the token.
type CookieManager struct {
	cfg    config.Cookie
	maxAge int
}

func NewCookieManager(cfg config.Cookie, refreshTTLSeconds int) *CookieManager {
	return &CookieManager{cfg: cfg, maxAge: refreshTTLSeconds}
}

func (m *CookieManager) SetRefresh(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     RefreshCookieName,
		Value:    token,
		Path:     m.cfg.Path,
		Domain:   m.cfg.Domain,
		MaxAge:   m.maxAge,
		HttpOnly: true,
		Secure:   m.cfg.Secure,
		SameSite: parseSameSite(m.cfg.SameSite),
	})
}

func (m *CookieManager) Clear(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     RefreshCookieName,
		Value:    "",
		Path:     m.cfg.Path,
		Domain:   m.cfg.Domain,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   m.cfg.Secure,
		SameSite: parseSameSite(m.cfg.SameSite),
	})
}

func parseSameSite(value string) http.SameSite {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	case "lax":
		return http.SameSiteLaxMode
	default:
		return http.SameSiteDefaultMode
	}
}
