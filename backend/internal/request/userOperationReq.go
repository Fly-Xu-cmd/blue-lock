package request

// UserOperationReq 用户操作记录的请求体
type UserOperationReq struct {
	UserID           uint   `json:"user_id"`
	UserName         string `json:"user_name"`
	Type             int    `json:"type" binding:"required"` // 操作种类1:关锁，2：开锁
	OperationContent string `json:"operation_content"`       // 操作描述
}

// GetOperationRecordReq 获取用户操作记录请求体
type GetOperationRecordReq struct {
	UserID        uint   `json:"user_id"`
	UserName      string `json:"user_name"`
	OperationType uint   `json:"operation_type"`
	Operation     string `json:"operation"`
	TimePeriod    int    `json:"time_period" form:"time_period"`
	Page          int    `json:"page"        form:"page"`
	PageSize      int    `json:"page_size"   form:"page_size"`
}
