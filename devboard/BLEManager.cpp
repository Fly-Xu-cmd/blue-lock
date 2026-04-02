#include "BLEManager.h"

// 静态指针用于连接 C++ 类和 BLE 库的回调
static CommandCallback globalCmdCb = nullptr;
static StatusCallback globalStatusCb = nullptr;
static bool _connected = false;

class ServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      _connected = true;
      if(globalStatusCb) globalStatusCb(true);
    }
    void onDisconnect(BLEServer* pServer) {
      _connected = false;
      if(globalStatusCb) globalStatusCb(false);

      // --- 建议增加的稳定性修改 ---
      // 给蓝牙协议栈一点时间处理断开逻辑
      delay(500);
      pServer->startAdvertising();
    }
};

class CharCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      String value = pCharacteristic->getValue().c_str();
      if (value.length() > 0 && globalCmdCb) {
        globalCmdCb(value); // 调用主程序处理函数
      }
    }
};

void BLEManager::begin(CommandCallback cmdCb, StatusCallback statusCb) {
  globalCmdCb = cmdCb;
  globalStatusCb = statusCb;

  BLEDevice::init("智能门锁");
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  
  BLEService *pService = pServer->createService(SERVICE_UUID);
  BLECharacteristic *pChar = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_WRITE |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  
  pChar->setCallbacks(new CharCallbacks());
  pService->start();
  BLEDevice::startAdvertising();
}

bool BLEManager::isConnected() {
  return _connected;
}
