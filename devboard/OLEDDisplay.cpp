#include "OLEDDisplay.h"

OLEDDisplay::OLEDDisplay() {
  _display = new Adafruit_SH1106G(128, 64, &Wire, -1);
}

void OLEDDisplay::begin() {
  Wire.begin(21, 22);
  if(!_display->begin(0x3C, true)) {
    _display->begin(0x3D, true);
  }
  _display->clearDisplay();
  _display->setTextColor(SH110X_WHITE);
  _display->setTextSize(1);
}

void OLEDDisplay::updateStatus(String msg, bool locked, bool btConnected, int vol) {
  _display->clearDisplay();
  _display->setCursor(0,0);
  _display->println("Smart Lock System");
  _display->println("--------------");
  _display->println(msg);
  _display->println("--------------");
  _display->print("Lock: "); _display->println(locked ? "OPEN" : "CLOSED");
  _display->print("BLE:  "); _display->println(btConnected ? "ON" : "OFF");
  _display->print("Vol:  "); _display->println(vol);
  _display->display();
}

// [新增] 实现关屏逻辑
void OLEDDisplay::sleep() {
  _display->clearDisplay(); // 清除显存
  _display->display();      // 刷新屏幕（此时屏幕变全黑）
  // 某些库支持 _display->oled_command(0xAE); // 发送关屏指令，更省电
}
