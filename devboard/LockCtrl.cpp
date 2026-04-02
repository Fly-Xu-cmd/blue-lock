#include "LockCtrl.h"

LockCtrl::LockCtrl(int pin) {
  _pin = pin;
  _isOpen = false;
  _timerActive = false;
}

void LockCtrl::begin() {
  pinMode(_pin, OUTPUT);
  digitalWrite(_pin, LOW);
}

bool LockCtrl::open() {
  // 1. 检查是否正在倒计时
  if (_timerActive) {
    // 如果倒计时没结束，拒绝开锁，返回失败
    return false; 
  }
  
  // 2. 正常开锁逻辑
  digitalWrite(_pin, HIGH);
  _isOpen = true;
  stopTimer(); // 这里的 stopTimer 其实是双重保险
  
  // 3. 返回成功
  return true;
}

void LockCtrl::close() {
  digitalWrite(_pin, LOW);
  _isOpen = false;
  stopTimer();
}

bool LockCtrl::isOpen() { return _isOpen; }

void LockCtrl::startTimer(int seconds) {
  _timerActive = true;
  _timerEndTime = millis() + (seconds * 1000);
}

void LockCtrl::stopTimer() { _timerActive = false; }

bool LockCtrl::isTimerRunning() { return _timerActive; }

int LockCtrl::getRemainingSeconds() {
  if (!_timerActive) return 0;
  long remaining = (_timerEndTime - millis()) / 1000;
  return (remaining < 0) ? 0 : remaining;
}

bool LockCtrl::checkTimer() {
  if (_timerActive && millis() > _timerEndTime) {
    _timerActive = false;
    return true; // 时间到
  }
  return false;
}
