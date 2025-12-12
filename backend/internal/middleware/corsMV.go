package middleware

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

// CorsMiddleware 跨域中间件
func CorsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method
		origin := c.Request.Header.Get("Origin")

		// 允许前端的域名列表
		allowedOrigins := map[string]bool{
			"http://127.0.0.1:7000": true,
			"http://localhost:7000": true,
		}

		// 判断 origin 是否在允许列表内
		if allowedOrigins[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
			// 设置允许的 HTTP 方法，浏览器会校验请求方法是否在以下列表
			c.Header(
				"Access-Control-Allow-Methods",
				"POST, GET, OPTIONS, PUT, DELETE, UPDATE, PATCH",
			)
			// 设置可以暴露出来的响应头
			c.Header(
				"Access-Control-Expose-Headers",
				"Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers, "+
					"Cache-Control, Content-Language, Content-Type, X-Csrf-Token",
			)
			// 允许跨域请求携带 Cookie
			c.Header("Access-Control-Allow-Credentials", "true")
		}
		// 处理预检请求（一种探路请求，不带body）
		if method == "OPTIONS" {
			// 直接返回 204 状态码，表示接受预检请求，然后等待浏览器下一次发送请求
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
