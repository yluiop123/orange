package auth

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"github.com/orange/backend-go-gin-gorm/internal/config"
)

const (
	TokenTypeAccess  = "access"
	TokenTypeRefresh = "refresh"
)

// Claims is the JWT payload. `ver` embeds sys_user.token_version so bumping the
// column invalidates every token for that user.
type Claims struct {
	Type     string `json:"typ"`
	Version  int    `json:"ver"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

type IssuedToken struct {
	Value     string
	JTI       string
	ExpiresAt time.Time
}

type TokenService struct {
	method     jwt.SigningMethod
	secret     []byte
	privateKey *rsa.PrivateKey
	publicKey  *rsa.PublicKey
	issuer     string
	accessTTL  time.Duration
	refreshTTL time.Duration
}

func NewTokenService(cfg config.JWT) (*TokenService, error) {
	service := &TokenService{
		issuer:     cfg.Issuer,
		accessTTL:  cfg.AccessTTL,
		refreshTTL: cfg.RefreshTTL,
	}

	privatePEM, publicPEM, err := readKeys(cfg)
	if err != nil {
		return nil, err
	}
	if (len(privatePEM) > 0) != (len(publicPEM) > 0) {
		return nil, errors.New("JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be set together")
	}
	if len(privatePEM) > 0 {
		privateKey, err := parsePrivateKey(privatePEM)
		if err != nil {
			return nil, fmt.Errorf("parse JWT private key: %w", err)
		}
		publicKey, err := parsePublicKey(publicPEM)
		if err != nil {
			return nil, fmt.Errorf("parse JWT public key: %w", err)
		}
		service.method = jwt.SigningMethodRS256
		service.privateKey = privateKey
		service.publicKey = publicKey
		return service, nil
	}
	if cfg.Secret == "" {
		return nil, errors.New("JWT_SECRET is required when RSA keys are not configured")
	}
	service.method = jwt.SigningMethodHS256
	service.secret = []byte(cfg.Secret)
	return service, nil
}

// readKey accepts inline PEM or a filesystem path, the same rule every backend
// uses. The historical `JWT_*_KEY_PATH` variables remain as aliases.
func readKey(material, pathAlias, label string) ([]byte, error) {
	value := strings.TrimSpace(material)
	if value == "" {
		value = strings.TrimSpace(pathAlias)
	}
	if value == "" {
		return nil, nil
	}
	if strings.Contains(value, "-----BEGIN") {
		return []byte(value), nil
	}
	content, err := os.ReadFile(value)
	if err != nil {
		return nil, fmt.Errorf("read JWT %s key: %w", label, err)
	}
	return content, nil
}

func readKeys(cfg config.JWT) ([]byte, []byte, error) {
	privatePEM, err := readKey(cfg.PrivateKeyPEM, cfg.PrivateKeyPath, "private")
	if err != nil {
		return nil, nil, err
	}
	publicPEM, err := readKey(cfg.PublicKeyPEM, cfg.PublicKeyPath, "public")
	if err != nil {
		return nil, nil, err
	}
	return privatePEM, publicPEM, nil
}

func parsePrivateKey(content []byte) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode(content)
	if block == nil {
		return nil, errors.New("no PEM block")
	}
	if key, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return key, nil
	}
	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	key, ok := parsed.(*rsa.PrivateKey)
	if !ok {
		return nil, errors.New("not an RSA private key")
	}
	return key, nil
}

func parsePublicKey(content []byte) (*rsa.PublicKey, error) {
	block, _ := pem.Decode(content)
	if block == nil {
		return nil, errors.New("no PEM block")
	}
	if key, err := x509.ParsePKCS1PublicKey(block.Bytes); err == nil {
		return key, nil
	}
	parsed, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	key, ok := parsed.(*rsa.PublicKey)
	if !ok {
		return nil, errors.New("not an RSA public key")
	}
	return key, nil
}

func (s *TokenService) AccessTTL() time.Duration  { return s.accessTTL }
func (s *TokenService) RefreshTTL() time.Duration { return s.refreshTTL }

func (s *TokenService) IssueAccess(userID, username string, version int) (IssuedToken, error) {
	return s.issue(userID, username, version, TokenTypeAccess, s.accessTTL)
}

func (s *TokenService) IssueRefresh(userID, username string, version int) (IssuedToken, error) {
	return s.issue(userID, username, version, TokenTypeRefresh, s.refreshTTL)
}

func (s *TokenService) issue(userID, username string, version int, tokenType string, ttl time.Duration) (IssuedToken, error) {
	now := time.Now()
	expiresAt := now.Add(ttl)
	jti := uuid.NewString()
	claims := Claims{
		Type:     tokenType,
		Version:  version,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        jti,
			Subject:   userID,
			Issuer:    s.issuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}
	token, err := jwt.NewWithClaims(s.method, claims).SignedString(s.signingKey())
	if err != nil {
		return IssuedToken{}, err
	}
	return IssuedToken{Value: token, JTI: jti, ExpiresAt: expiresAt}, nil
}

func (s *TokenService) signingKey() any {
	if s.method == jwt.SigningMethodRS256 {
		return s.privateKey
	}
	return s.secret
}

func (s *TokenService) verificationKey() any {
	if s.method == jwt.SigningMethodRS256 {
		return s.publicKey
	}
	return s.secret
}

// Parse validates the signature, issuer and expiry, then checks the token type.
func (s *TokenService) Parse(raw, expectedType string) (*Claims, error) {
	claims := &Claims{}
	parser := jwt.NewParser(
		jwt.WithValidMethods([]string{s.method.Alg()}),
		jwt.WithIssuer(s.issuer),
		jwt.WithExpirationRequired(),
	)
	token, err := parser.ParseWithClaims(raw, claims, func(token *jwt.Token) (any, error) {
		return s.verificationKey(), nil
	})
	if err != nil {
		return nil, err
	}
	if !token.Valid {
		return nil, errors.New("invalid token")
	}
	if claims.Type != expectedType {
		return nil, fmt.Errorf("not a %s token", expectedType)
	}
	if claims.ID == "" || claims.Subject == "" {
		return nil, errors.New("token missing id or subject")
	}
	return claims, nil
}
