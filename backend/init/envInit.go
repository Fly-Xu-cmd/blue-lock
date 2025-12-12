package inits

import (
	"blueLock/backend/internal/pkg/globals"
)

func EnvInit() {
	// 项目配置环境 本地 local.yaml
	if len(globals.Env) == 0 {
		globals.Env = "dev"
	}
}
