package middleware

import (
	"blueLock/backend/internal/pkg/token"
	"github.com/gin-gonic/gin"
	"strings"
)

// AuthMiddleware 认证中间件
func AuthMiddleware(tokenService *token.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 提取token
		tokenString := extractToken(c)
		if tokenString == "" {
			sendAuthError(c, "未提供认证信息")
			return
		}

		// 解析token
		claims, err := tokenService.ParseToken(tokenString)
		if err != nil {
			sendAuthError(c, "令牌无效或已过期")
			return
		}

		// 必须是访问令牌
		if !token.IsAccessToken(claims) {
			sendAuthError(c, "无效的令牌类型")
			return
		}

		// 设置用户id到上下文
		c.Set("user_id", claims.UserID)
		c.Next()
	}
}

func extractToken(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return ""
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}
	return parts[1]
}

// sendAuthError 发送认证错误响应
func sendAuthError(c *gin.Context, msg string) {
	c.JSON(401, gin.H{
		"code":    401,
		"message": msg,
		"data":    nil,
	})
	c.Abort()
}
