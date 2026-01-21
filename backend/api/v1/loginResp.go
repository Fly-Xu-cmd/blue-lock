package v1

type LoginResponseData struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	UserID       uint   `json:"user_id"`
	UserName     string `json:"user_name"`
	UserEmail    string `json:"user_email"`
	Avatar       string `json:"avatar"`
}
