package inits

import (
	"blueLock/backend/internal/models"
	"blueLock/backend/internal/pkg/globals"
	"fmt"
	"github.com/spf13/viper"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
	"time"
)

func DBInit() {
	if err := viper.UnmarshalKey("database", &globals.AppConfig.Database); err != nil {
		globals.Log.Fatalf("解码失败, %v", err.Error())
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		globals.AppConfig.Database.User,     // 数据库用户名
		globals.AppConfig.Database.Password, // 数据库密码
		globals.AppConfig.Database.Host,     // 数据库主机名
		globals.AppConfig.Database.Port,     // 数据库端口号
		globals.AppConfig.Database.Name,     // 数据库名字
	)

	var err error
	globals.DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
		NamingStrategy: schema.NamingStrategy{
			TablePrefix: "b_",
		},
	})
	if err != nil {
		globals.Log.Fatalf("连接数据库失败: %v", err)
		return
	}
	// 修改点3：获取底层SQL DB对象以配置连接池和进行Ping测试
	sqlDB, err := globals.DB.DB()
	if err != nil {
		globals.Log.Fatalf("获取数据库底层实例失败: %v", err)
	}

	// 修改点4：重要！验证连接是否真正可用
	if err := sqlDB.Ping(); err != nil {
		globals.Log.Fatalf("数据库连通性测试失败(Ping不通): %v", err)
	}

	// 修改点5：配置连接池参数（预防连接超时等问题）
	sqlDB.SetMaxOpenConns(100)          // 最大打开连接数
	sqlDB.SetMaxIdleConns(10)           // 最大空闲连接数
	sqlDB.SetConnMaxLifetime(time.Hour) // 连接的最大可复用时间

	globals.Log.Info("数据库连接初始化及测试成功")
}

// TableInit 初始化表
func TableInit() {
	// 新增：防御性检查
	if globals.DB == nil {
		globals.Log.Fatal("初始化表失败：数据库连接为空 (nil)，请确保 DBInit() 已成功执行。")
		return
	}
	err := globals.DB.AutoMigrate(
		&models.User{},
	)
	if err != nil {
		fmt.Println("初始化表失败:", err)
		globals.Log.Errorf("初始化表失败: %v", err.Error())
		return
	}
	globals.Log.Info("数据库表初始化成功")
}
