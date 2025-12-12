package response

type ErrorResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Error   string `json:"error"`
}

type Success struct {
	Code int `json:"code"`
	Data any `json:"data"`
}
