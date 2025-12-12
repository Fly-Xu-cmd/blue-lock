package globals

// 自定义状态码：StatusOK = 2000，区别于 http.StatusOK = 200
const (
	StatusOK                  = 2000 // 成功
	StatusBadRequest          = 4000 //请求语法错误或无效参数
	StatusInternalServerError = 5000 // 服务器内部错误
	StatusUnauthorized        = 4010 // 未授权，token过期
)
