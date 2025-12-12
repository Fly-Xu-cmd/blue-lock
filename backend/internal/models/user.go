package models

import "gorm.io/gorm"

// User 用户表
type User struct {
	gorm.Model
	Email    string `gorm:"type:varchar(255);not null;uniqueIndex" json:"email"`
	PassWord string `json:"password"    gorm:"size:100"`
}
