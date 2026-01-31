package middleware

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CorsMiddleware() gin.HandlerFunc {
	config := cors.DefaultConfig()

	// 允许的域名列表
	config.AllowOrigins = []string{
		"http://localhost:7000",
		"http://127.0.0.1:7000",
		"http://bluebox.xylxf.xyz",
		"https://bluebox.xylxf.xyz",
		// 如果你需要允许所有域名（开发环境），可以用 config.AllowAllOrigins = true
	}

	// 允许的请求头（这一步非常关键！）
	// 必须包含 Authorization (鉴权) 和 Content-Type (JSON数据)
	config.AllowHeaders = []string{
		"Origin",
		"Content-Length",
		"Content-Type",
		"Authorization",
		"X-Requested-With",
	}

	// 允许携带 Cookie
	config.AllowCredentials = true

	// 允许前端读取的响应头
	config.ExposeHeaders = []string{
		"Content-Length",
		"Access-Control-Allow-Origin",
		"Access-Control-Allow-Headers",
		"Content-Type",
	}

	// 预检请求缓存时间（减少 OPTIONS 请求频率）
	// config.MaxAge = 12 * time.Hour

	return cors.New(config)
}
