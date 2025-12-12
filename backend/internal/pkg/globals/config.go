package globals

import "time"

// DatabaseConfig mysql配置
type DatabaseConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	Name     string `mapstructure:"name"`
}

// LogConfig 日志配置
type LogConfig struct {
	LogPath string `mapstructure:"logPath"`
	AppName string `mapstructure:"appName"`
}

// JWTConfig JWT配置
type JWTConfig struct {
	SecretKey          string        `mapstructure:"secret_key"`
	AccessTokenExpiry  time.Duration `mapstructure:"access_token_expiry"`
	RefreshTokenExpiry time.Duration `mapstructure:"refresh_token_expiry"`
}

// App 配置
type App struct {
	Host   string `mapstructure:"host"`
	Port   int    `mapstructure:"port"`
	Domain string `mapstructure:"domain"`
}

// RedisConfig redis配置
type RedisConfig struct {
	Host         string        `mapstructure:"host"`
	Port         int           `mapstructure:"port"`
	Password     string        `mapstructure:"password"`
	DB           int           `mapstructure:"db"`
	PoolSize     int           `mapstructure:"pool_size"`      // Redis 连接池中的最大连接数
	MinIdleConns int           `mapstructure:"min_idle_conns"` // Redis 连接池中的最小空闲连接数
	IdleTimeout  time.Duration `mapstructure:"idle_timeout"`   // Redis 连接池中空闲连接的最大超时时间
	DialTimeout  time.Duration `mapstructure:"dial_timeout"`   // Redis 连接超时
	ReadTimeout  time.Duration `mapstructure:"read_timeout"`   // Redis 读取数据超时
	WriteTimeout time.Duration `mapstructure:"write_timeout"`  // Redis 写入数据超时
	MaxRetries   int           `mapstructure:"max_retries"`    // Redis 最大重试次数
}

// Config 总配置
type Config struct {
	Database DatabaseConfig `mapstructure:"database"`
	Redis    RedisConfig    `mapstructure:"redis"`
	Log      LogConfig      `mapstructure:"log"`
	App      App            `mapstructure:"app"`
	JWT      JWTConfig      `mapstructure:"jwt"`
}
