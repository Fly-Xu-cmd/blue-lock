#ifndef LOCKCTRL_H
#define LOCKCTRL_H

#include <Arduino.h>

class LockCtrl {
  private:
    int _pin;
    bool _isOpen;
    // 倒计时变量
    bool _timerActive;
    unsigned long _timerEndTime;
    
  public:
    LockCtrl(int pin);
    void begin();
    bool open();
    void close();
    bool isOpen();
    
    // 倒计时功能
    void startTimer(int seconds);
    void stopTimer();
    bool isTimerRunning();
    int getRemainingSeconds();
    bool checkTimer(); // 在 loop 中调用，返回 true 表示倒计时结束触发了动作
};

#endif
