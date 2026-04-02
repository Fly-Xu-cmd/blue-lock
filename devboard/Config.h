#ifndef CONFIG_H
#define CONFIG_H

// ==========================================
//              功能开关设置
// ==========================================
// 如果想开启语音，请取消下面这行的注释 (//)
// 如果想极致省电，请注释掉下面这行
// #define ENABLE_VOICE  
// ==========================================

// --- 引脚定义 ---
#define LOCK_PIN      15
#define TOUCH_PIN     4      

// --- 参数配置 ---
#define TOUCH_THRESHOLD 800 
#define SLEEP_TIMEOUT     60000   // 60秒无操作休眠
#define BLE_SLEEP_TIMEOUT 600000  // 蓝牙连接10分钟无操作休眠

// --- 蓝牙 UUID ---
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// --- 串口波特率 ---
#define SERIAL_BAUD    115200

#endif
