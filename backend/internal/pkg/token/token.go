package token

import (
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"time"
)

type TokenClaims struct {
	UserID    uint64 `json:"user_id"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

type Config struct {
	SecretKey          string        // jwt签名密钥
	AccessTokenExpiry  time.Duration // Access Token过期时间
	RefreshTokenExpiry time.Duration // Refresh Token过期时间
}

// Service token服务
type Service struct {
	config Config
}

// NewService 创建Token服务
func NewService(config Config) *Service {
	return &Service{config: config}
}

// GenerateAccessToken 生成访问令牌
func (s *Service) GenerateAccessToken(userID uint64) (string, error) {
	return s.generateToken(userID, "access", s.config.AccessTokenExpiry)
}

// GenerateRefreshToken 生成刷新令牌
func (s *Service) GenerateRefreshToken(userID uint64) (string, error) {
	return s.generateToken(userID, "refresh", s.config.RefreshTokenExpiry)
}

// generateToken 生成访问令牌
func (s *Service) generateToken(userID uint64, tokenType string, expires time.Duration) (string, error) {
	now := time.Now()
	claims := TokenClaims{
		UserID:    userID,
		TokenType: tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(expires)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    "bluetooth-safe-box",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.config.SecretKey))
	if err != nil {
		return "", fmt.Errorf("签名令牌失败：%w", err)
	}
	return tokenString, nil
}

// ParseToken 解析并验证令牌
func (s *Service) ParseToken(tokenString string) (*TokenClaims, error) {
	// 解析jwt字符串并验证签名
	token, err := jwt.ParseWithClaims(
		tokenString,    // 要解析的字符串
		&TokenClaims{}, // 结构体实例，将jwt的payload部分反序列化到该结构体
		func(token *jwt.Token) (interface{}, error) {
			// 确保令牌使用的是HMAC算法，防止攻击者使用其他算法绕过验证
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("意外的签名方法：%v", token.Header["alg"])
			}
			return []byte(s.config.SecretKey), nil
		}, // 提供签名所需要的密钥
	)
	if err != nil {
		return nil, fmt.Errorf("解析令牌失败：%w", err)
	}
	// 验证令牌有效性：签名，过期时间，生效时间
	if !token.Valid {
		return nil, fmt.Errorf("无效的令牌")
	}
	claims, ok := token.Claims.(*TokenClaims)
	if !ok {
		return nil, fmt.Errorf("无法提取令牌声明")
	}
	return claims, nil
}

// IsAccessToken 检查是否是访问令牌
func IsAccessToken(claims *TokenClaims) bool {
	return claims.TokenType == "access"
}

// IsRefreshToken 检查是否是刷新令牌
func IsRefreshToken(claims *TokenClaims) bool {
	return claims.TokenType == "refresh"
}
