#include "SynVoice.h"
#include <HardwareSerial.h>
#include "VoiceData.h"

// 构造函数：只赋值简单的变量，不要 new 对象
SynVoice::SynVoice(int rxPin, int txPin, int busyPin) {
  // _serial = new HardwareSerial(2); // <--- 删除这行，这里分配内存太早了会崩
  _serial = NULL; // 先置空
  _busyPin = busyPin;
  _isSpeaking = false;
  _rx = rxPin;
  _tx = txPin;
}

void SynVoice::begin() {
  // 放到 begin 里初始化，这时候系统已经稳定了
  if (_serial == NULL) {
    _serial = new HardwareSerial(2);
    Serial.printf("serial初始化成功");
  }
  
  _serial->begin(9600, SERIAL_8N1, _rx, _tx); // 确保引脚号正确

  pinMode(_busyPin, INPUT_PULLUP);
}

void SynVoice::checkBusy() {
  if (_isSpeaking && digitalRead(_busyPin) == HIGH) {
    _isSpeaking = false;
  }
}

void SynVoice::setVolume(int volume) {
  // 音量设置是预定义数组
  if(volume > 13) volume = 13;
  if(volume < 5) volume = 5;
  int len = volume < 10 ? 10 : 11;
  for(int i=0; i < len; i++){
    _serial->write(V5_13[volume-5][i]);
  }
  delay(1000);
  for(int i=0; i<sizeof(SET_V); i++){
    _serial->write(SET_V[i]);
  }
  
}


// 极其简单的发送函数
void SynVoice::play(const unsigned char* data, int length) {
  if(_isSpeaking){
    return;
  }
  // --- 调试开始 ---
  Serial.print("[DEBUG] 正在发送数据 (长度 ");
  Serial.print(length);
  Serial.print("): ");
  
  for(int i = 0; i < length; i++) {
    // 打印当前字节的16进制形式，%02X 表示大写16进制，不足两位补0
    Serial.printf("%02X ", data[i]); 
    
    // 真正的发送动作
    _serial->write(data[i]);
  }
  Serial.println(); // 换行
  Serial.println("[DEBUG] 发送完毕");
  // --- 调试结束 ---
  _isSpeaking = true;
  delay(20); 
}
