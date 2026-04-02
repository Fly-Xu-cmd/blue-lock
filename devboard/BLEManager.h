#ifndef BLEMANAGER_H
#define BLEMANAGER_H

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include "Config.h"

// 定义回调函数类型：主程序处理命令的函数签名
typedef void (*CommandCallback)(String);
typedef void (*StatusCallback)(bool);

class BLEManager {
  private:
    CommandCallback _cmdCallback;
    StatusCallback _statusCallback;
    
  public:
    void begin(CommandCallback cmdCb, StatusCallback statusCb);
    bool isConnected();
    // 内部使用的回调需要设为 public 或者用 friend class，这里简化为静态或友元
    // 为了简单，我们将 Callback 类放在 cpp 中，通过全局指针访问
};

#endif
