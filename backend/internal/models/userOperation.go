package models

import "gorm.io/gorm"

// UserOperation 用户操作记录表
type UserOperation struct {
	gorm.Model
	UserID           uint   `json:"user_id"`
	UserName         string `json:"user_name" gorm:"type:varchar(20);not null"`
	OperationType    uint   `json:"operation_type" gorm:"type:varchar(20)"` // 1:关锁，2：开锁
	OperationDes     string `json:"operation_des" gorm:"type:varchar(20)"`  // 开关锁
	OperationContent string `json:"operation_content" gorm:"type:text"`     // 操作描述
}
