package inits

func Init() {
	// 选择环境
	EnvInit()
	// 根据环境初始化配置文件
	ConfigInit()
	// 日志初始化
	LogInit()
	// mysql初始化
	DBInit()
	// 表结构初始化
	TableInit()
	// redis初始化
	RedisInit()
	// jwt 初始化
	jwtInit()
}
