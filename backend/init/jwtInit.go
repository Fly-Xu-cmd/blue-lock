package inits

import (
	"blueLock/backend/internal/pkg/globals"

	"github.com/spf13/viper"
)

func jwtInit() {
	if err := viper.UnmarshalKey("jwt", &globals.AppConfig.JWT); err != nil {
		globals.Log.Panicf("无法解码为结构: %s", err)
	}
}
