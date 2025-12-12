package request

// SendVerificationCodeRequest 发送验证码的请求体
type SendVerificationCodeRequest struct {
	Email string `json:"email"`
}

// RegisterByVerificationCodeRequest 邮箱注册的请求体
type RegisterByVerificationCodeRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Code     string `json:"code" binding:"required"`
}

// LoginByPassORCode 登录的请求体
type LoginByPassORCode struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Code     string `json:"code"`
}

// RefreshTokenRequest 刷新令牌请求体
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}
