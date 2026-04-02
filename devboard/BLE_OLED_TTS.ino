#include "Config.h"
#include "OLEDDisplay.h"
#include "LockCtrl.h"
#include "BLEManager.h"
#include <sys/time.h>      

// --- 根据开关决定是否引入语音库 ---
#ifdef ENABLE_VOICE
  #include "VoiceData.h" 
  #include "SynVoice.h"
#endif

// --- 模块实例化 ---
OLEDDisplay oled;
LockCtrl lock(LOCK_PIN);
BLEManager ble;

#ifdef ENABLE_VOICE
  // 只有开启语音时才创建对象
  SynVoice voice(SYN6288_RX, SYN6288_TX, SYN6288_BUSY);
#endif

// --- RTC 变量 ---
RTC_DATA_ATTR bool isTimerRunning = false;       
RTC_DATA_ATTR time_t targetUnlockTime = 0;       
RTC_DATA_ATTR time_t timerStartTime = 0;         
RTC_DATA_ATTR int currentVolume = 10; 

// --- 全局变量 ---
unsigned long lastUiUpdate = 0;
unsigned long advertiseStartTime = 0; 

// --- 前向声明 ---
void handleCommand(String cmd);
void handleBleStatus(bool connected);
void touchCallback() {} 
void goToSleep(unsigned long seconds);

// 辅助：时间格式化
String formatTime(unsigned long totalSeconds) {
  unsigned long h = totalSeconds / 3600;
  unsigned long m = (totalSeconds % 3600) / 60;
  unsigned long s = totalSeconds % 60;
  char buffer[12];
  sprintf(buffer, "%02lu:%02lu:%02lu", h, m, s); 
  return String(buffer);
}

void setup() {
  setCpuFrequencyMhz(80); 
  Serial.begin(115200);
  delay(500);

  lock.begin();
  oled.begin();

  // 1. 初始化语音 (如果有)
  #ifdef ENABLE_VOICE
    voice.begin();
  #endif

  esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();

  // --- A: 时间到自动唤醒 ---
  if (wakeup_reason == ESP_SLEEP_WAKEUP_TIMER) {
    Serial.println(">>> 时间到，自动开锁！");
    lock.open();
    oled.updateStatus("Time Up! Open", true, false, currentVolume);
    
    // 语音播报
    #ifdef ENABLE_VOICE
      voice.play(RAW_UNLOCK_SUCCESS, sizeof(RAW_UNLOCK_SUCCESS));
    #endif
    
    delay(5000);
    lock.close();
    
    // 关锁语音
    #ifdef ENABLE_VOICE
      voice.play(RAW_LOCK_SUCCESS, sizeof(RAW_LOCK_SUCCESS));
    #endif

    isTimerRunning = false;
    targetUnlockTime = 0;
    timerStartTime = 0;
    
    goToSleep(0); 
  }
  
  // --- B: 触摸唤醒 ---
  else if (wakeup_reason == ESP_SLEEP_WAKEUP_TOUCHPAD) {
    Serial.println(">>> 触摸唤醒");
    
    if (isTimerRunning) {
       time_t now;
       time(&now);
       long remaining = targetUnlockTime - now;
       
       if (remaining > 0) {
         oled.updateStatus("Left: " + formatTime(remaining), lock.isOpen(), false, currentVolume);
       } else {
         oled.updateStatus("Checking...", lock.isOpen(), false, currentVolume);
       }
    } else {
       oled.updateStatus("Wake Up!", lock.isOpen(), false, currentVolume);
    }
  }
  
  // --- C: 冷启动 ---
  else {
    Serial.println(">>> 冷启动");
    oled.updateStatus("System Ready", lock.isOpen(), false, currentVolume);
    
    #ifdef ENABLE_VOICE
      voice.play(RAW_SYSTEM_START, sizeof(RAW_SYSTEM_START));
    #endif
  }

  ble.begin(handleCommand, handleBleStatus);
  advertiseStartTime = millis();
}

void loop() {
  // 1. 自动休眠
  if (!ble.isConnected()) {
    if (millis() - advertiseStartTime > SLEEP_TIMEOUT) {
      goToSleep(0); 
    }
  }
  
  // 2. 蓝牙连接超时
  if (ble.isConnected()) {
    if (millis() - advertiseStartTime > BLE_SLEEP_TIMEOUT) { 
       goToSleep(0);
    }
  }
  
  // 3. 屏幕刷新
  if (isTimerRunning && millis() - lastUiUpdate > 1000) {
      lastUiUpdate = millis();
      time_t now;
      time(&now);
      long remaining = targetUnlockTime - now;
      if (remaining > 0) {
        oled.updateStatus("Left: " + formatTime(remaining), lock.isOpen(), ble.isConnected(), currentVolume);
      } else {
        goToSleep(1); 
      }
  }
  
  // 4. 语音忙闲检查 (只有开启时才检查)
  #ifdef ENABLE_VOICE
    voice.checkBusy();
  #endif

  delay(50); 
}

void goToSleep(unsigned long manualSeconds) {
  unsigned long wakeupTime = 0;

  if (manualSeconds > 0) {
    wakeupTime = manualSeconds; 
  } 
  else if (isTimerRunning) {
    time_t now;
    time(&now);
    long remaining = targetUnlockTime - now;
    if (remaining > 0) wakeupTime = remaining;
    else wakeupTime = 1; 
  }

  oled.sleep(); 
  
  touchAttachInterrupt(TOUCH_PIN, touchCallback, TOUCH_THRESHOLD);
  esp_sleep_enable_touchpad_wakeup();
  
  if (wakeupTime > 0) {
    uint64_t time_us = (uint64_t)wakeupTime * 1000000ULL;
    esp_sleep_enable_timer_wakeup(time_us);
  }
  
  Serial.println("进入深度睡眠...");
  esp_deep_sleep_start();
}

void handleBleStatus(bool connected) {
  if (connected) {
    oled.updateStatus("BLE Connected", lock.isOpen(), true, currentVolume);
    #ifdef ENABLE_VOICE
      voice.play(RAW_BLE_CONNECTED, sizeof(RAW_BLE_CONNECTED));
    #endif
    advertiseStartTime = millis(); 
  } else {
    oled.updateStatus("Waiting...", lock.isOpen(), false, currentVolume);
    #ifdef ENABLE_VOICE
      voice.play(RAW_BLE_DISCONNECTED, sizeof(RAW_BLE_DISCONNECTED));
    #endif
    advertiseStartTime = millis(); 
  }
}

void handleCommand(String cmd) {
  advertiseStartTime = millis(); 
  cmd.toUpperCase();
  Serial.print("Cmd: "); Serial.println(cmd);

  if (cmd == "OPEN" || cmd == "1" || cmd == "ON") {
    if (!isTimerRunning) {
        lock.open();
        oled.updateStatus("Unlocked", true, ble.isConnected(), currentVolume);
        
        #ifdef ENABLE_VOICE
          voice.play(RAW_UNLOCK_SUCCESS, sizeof(RAW_UNLOCK_SUCCESS));
        #endif
        
        delay(5000); 
        lock.close();
        oled.updateStatus("Auto Locked", false, ble.isConnected(), currentVolume);
        
        #ifdef ENABLE_VOICE
          voice.play(RAW_LOCK_SUCCESS, sizeof(RAW_LOCK_SUCCESS));
        #endif
    } else {
        oled.updateStatus("Timer Running!", lock.isOpen(), ble.isConnected(), currentVolume);
        #ifdef ENABLE_VOICE
          voice.play(OPERATION_FAILED, sizeof(OPERATION_FAILED));
        #endif
    }
  }
  
  else if (cmd == "CLOSE" || cmd == "0") {
    if (!isTimerRunning) {
        lock.close();
        oled.updateStatus("Locked", false, ble.isConnected(), currentVolume);
        #ifdef ENABLE_VOICE
          voice.play(RAW_LOCK_SUCCESS, sizeof(RAW_LOCK_SUCCESS));
        #endif
    } 
    else {
        time_t now;
        time(&now);
        long elapsed = now - timerStartTime; 
        
        if (elapsed < 300) {
            lock.close();
            isTimerRunning = false;
            targetUnlockTime = 0;
            timerStartTime = 0;
            Serial.println("后悔期内，已取消");
            oled.updateStatus("Cancelled", false, ble.isConnected(), currentVolume);
            #ifdef ENABLE_VOICE
               // voice.play(OPERATION_SUCCESS, ...); // 可选
            #endif
        } else {
            Serial.println("拒绝：已过后悔期");
            oled.updateStatus("Too Late!", lock.isOpen(), ble.isConnected(), currentVolume);
            #ifdef ENABLE_VOICE
              voice.play(OPERATION_FAILED, sizeof(OPERATION_FAILED));
            #endif
            delay(2000);
            goToSleep(0);
        }
    }
  }
  
  else if (cmd.startsWith("TIMER:")) {
    float hours = cmd.substring(6).toFloat();
    if (hours >= 0.1 && hours <= 12.0) {
      unsigned long totalSeconds = (unsigned long)(hours * 3600);
      
      isTimerRunning = true;
      time_t now;
      time(&now);
      targetUnlockTime = now + totalSeconds;
      timerStartTime = now; 
      
      oled.updateStatus("Timer: " + formatTime(totalSeconds), lock.isOpen(), ble.isConnected(), currentVolume);
      
      #ifdef ENABLE_VOICE
        voice.play(RAW_TIMER_START, sizeof(RAW_TIMER_START));
      #endif
      
      delay(3000); 
      goToSleep(totalSeconds);
    } else {
      oled.updateStatus("Time Error", lock.isOpen(), ble.isConnected(), currentVolume);
      #ifdef ENABLE_VOICE
        voice.play(OPERATION_FAILED, sizeof(OPERATION_FAILED));
      #endif
    }
  }

  else if (cmd == "VOL+") {
     if (currentVolume < 13) currentVolume++;
     oled.updateStatus("Vol Up", lock.isOpen(), ble.isConnected(), currentVolume);
     // 只有开语音时才去调语音模块的设置
     #ifdef ENABLE_VOICE
       // 这里可以加原来的 updateVolumeVoice() 逻辑
       // voice.setVolume... 
     #endif
  }
  else if (cmd == "VOL-") {
     if (currentVolume > 5) currentVolume--;
     oled.updateStatus("Vol Down", lock.isOpen(), ble.isConnected(), currentVolume);
  }
  
  else if (cmd == "XYLXF_999") { 
      isTimerRunning = false;
      targetUnlockTime = 0;
      timerStartTime = 0;
      
      oled.updateStatus("EMERGENCY!!!", true, ble.isConnected(), currentVolume);
      delay(1000);
      lock.open();
      delay(5000); 
      lock.close();
      oled.updateStatus("System Reset", false, ble.isConnected(), currentVolume);
      goToSleep(0);
  }
}
