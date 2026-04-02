#ifndef OLEDDISPLAY_H
#define OLEDDISPLAY_H

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>

class OLEDDisplay {
  private:
    Adafruit_SH1106G* _display;
    
  public:
    OLEDDisplay();
    void begin();
    void updateStatus(String msg, bool locked, bool btConnected, int vol);
    // [新增] 关屏/休眠函数
    void sleep();
};

#endif
