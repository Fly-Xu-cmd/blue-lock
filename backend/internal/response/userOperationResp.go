package response

// UserResponse 添加用户操作记录返回响应结构体
type UserResponse struct {
	ID               uint   `json:"id"`
	UserName         string `json:"user_name"`
	OperationDes     string `json:"operation_des"`
	OperationContent string `json:"operation_content"`
	OperateTime      string `json:"operate_time"`
}

// GetOperationRecord 获取所有用户操作记录
type GetOperationRecord struct {
	Total       uint           `json:"total"`        // 总操作次数
	LockCount   uint           `json:"lock_count"`   // 总锁定次数
	UnlockCount uint           `json:"unlock_count"` //总解锁次数
	RecordList  []UserResponse `json:"recordList"`
}
