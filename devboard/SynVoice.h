#ifndef SYNVOICE_H
#define SYNVOICE_H

#include <Arduino.h>
#include <HardwareSerial.h>

class SynVoice {
  private:
    HardwareSerial* _serial;
    int _busyPin,_rx, _tx;
    bool _isSpeaking;

  public:
    SynVoice(int rxPin, int txPin, int busyPin);
    void begin();
    void setVolume(int volume);
    void checkBusy();
    
    // 只需要这一个函数：发送做好的数组
    void play(const unsigned char* data, int length);

};

#endif
