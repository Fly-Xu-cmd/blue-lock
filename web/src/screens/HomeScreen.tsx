import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import "./HomeScreen.css";

// 使用Web Bluetooth API提供的BluetoothDevice类型，而不是自定义接口

/**
 * 主屏幕组件
 * 提供蓝牙设备扫描、连接、锁定和解锁功能
 */
const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<
    Array<{ id: string; name: string; rssi?: number }>
  >([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showDeviceList, setShowDeviceList] = useState<boolean>(false);
  const [selectedDevice, setSelectedDevice] = useState<{
    id: string;
    name: string;
    rssi?: number;
  } | null>(null);
  const [isLocking, setIsLocking] = useState<boolean>(false);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  const [deviceName, setDeviceName] = useState<string>("未连接设备");
  const [bluetoothDevice, setBluetoothDevice] =
    useState<BluetoothDevice | null>(null);
  const [gattServer, setGattServer] =
    useState<BluetoothRemoteGATTServer | null>(null);
  const [controlCharacteristic, setControlCharacteristic] =
    useState<BluetoothRemoteGATTCharacteristic | null>(null);

  // 检查是否已登录
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // 扫描蓝牙设备
  const scanForDevices = useCallback(async () => {
    if (isScanning) return;

    setIsScanning(true);
    setDevices([]);
    setErrorMessage("");
    setShowDeviceList(true);

    try {
      // 使用Web Bluetooth API扫描设备
      if (!navigator.bluetooth) {
        setErrorMessage("您的浏览器不支持蓝牙功能");
        setIsScanning(false);
        return;
      }

      // 扫描ESP32 BLE设备，指定服务UUID
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: "ESP32_BLE_LED" }],
        optionalServices: ["4fafc201-1fb5-459e-8fcc-c5c9c331914b"], // ESP32的服务UUID
      });

      // 保存真实的蓝牙设备对象
      setBluetoothDevice(device);

      // 添加到设备列表
      const newDevice = {
        id: device.id,
        name: device.name || "未知设备",
        rssi: 0, // Web Bluetooth API 不直接提供RSSI
      };

      setDevices((prev) => [...prev, newDevice]);
      setSelectedDevice(newDevice);

      // 自动连接设备
      connectToDevice(newDevice);
    } catch (error: any) {
      console.error("Scan error:", error);
      if (error.name !== "NotFoundError") {
        setErrorMessage(error.message || "扫描设备失败");
      }
    } finally {
      setIsScanning(false);
    }
  }, [isScanning]);

  // 连接设备
  const connectToDevice = useCallback(
    async (device: { id: string; name: string; rssi?: number }) => {
      if (!navigator.bluetooth || !bluetoothDevice) {
        setErrorMessage("您的浏览器不支持蓝牙功能或未选择设备");
        return;
      }

      try {
        setErrorMessage("正在连接设备...");

        // 1. 连接到GATT服务器
        const server = await bluetoothDevice.gatt?.connect();
        if (!server) {
          throw new Error("无法连接到设备");
        }
        setGattServer(server);

        // 2. 获取ESP32的服务
        const service = await server.getPrimaryService(
          "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
        );

        // 3. 获取控制特征
        const characteristic = await service.getCharacteristic(
          "beb5483e-36e1-4688-b7f5-ea07361b26a8"
        );
        setControlCharacteristic(characteristic);

        // 4. 更新状态
        setIsConnected(true);
        setDeviceName(device.name);
        setShowDeviceList(false);
        setErrorMessage("");
        message.success("设备连接成功");
      } catch (error: any) {
        console.error("Connection error:", error);
        setErrorMessage("连接设备失败: " + error.message);
      }
    },
    [bluetoothDevice]
  );

  // 锁定设备
  const lockDevice = useCallback(async () => {
    if (!isConnected || !controlCharacteristic) {
      setErrorMessage("请先连接设备");
      return;
    }

    setIsLocking(true);
    setErrorMessage("正在锁定设备...");

    try {
      // 向ESP32发送锁定命令（0表示锁定）
      await controlCharacteristic.writeValue(new Uint8Array([0]));

      // 读取当前状态确认
      const value = await controlCharacteristic.readValue();
      const currentState = value.getUint8(0);

      if (currentState === 0) {
        setIsLocking(false);
        setErrorMessage("设备已锁定");
        setTimeout(() => setErrorMessage(""), 2000);
        message.success("设备锁定成功");
      } else {
        throw new Error("锁定命令发送失败");
      }
    } catch (error: any) {
      console.error("Lock error:", error);
      setErrorMessage("锁定设备失败: " + error.message);
      setIsLocking(false);
    }
  }, [isConnected, controlCharacteristic]);

  // 解锁设备
  const unlockDevice = useCallback(async () => {
    if (!isConnected || !controlCharacteristic) {
      setErrorMessage("请先连接设备");
      return;
    }

    setIsUnlocking(true);
    setErrorMessage("正在解锁设备...");

    try {
      // 向ESP32发送解锁命令（1表示解锁）
      await controlCharacteristic.writeValue(new Uint8Array([1]));

      // 读取当前状态确认
      const value = await controlCharacteristic.readValue();
      const currentState = value.getUint8(0);

      if (currentState === 1) {
        setIsUnlocking(false);
        setErrorMessage("设备已解锁");
        setTimeout(() => setErrorMessage(""), 2000);
        message.success("设备解锁成功");
      } else {
        throw new Error("解锁命令发送失败");
      }
    } catch (error: any) {
      console.error("Unlock error:", error);
      setErrorMessage("解锁设备失败: " + error.message);
      setIsUnlocking(false);
    }
  }, [isConnected, controlCharacteristic]);

  // 断开连接
  const disconnectDevice = useCallback(() => {
    // 断开GATT连接
    if (gattServer && gattServer.connected) {
      gattServer.disconnect();
    }

    // 重置状态
    setIsConnected(false);
    setSelectedDevice(null);
    setBluetoothDevice(null);
    setGattServer(null);
    setControlCharacteristic(null);
    setDeviceName("未连接设备");
    setErrorMessage("设备已断开连接");
    setTimeout(() => setErrorMessage(""), 2000);
  }, [gattServer]);

  // 导航到分析页面
  const navigateToAnalysis = useCallback(() => {
    navigate("/analysis");
  }, [navigate]);

  // 退出登录
  const handleLogout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  }, [navigate]);

  return (
    <div className="home-container">
      {/* 顶部导航栏 */}
      <header className="home-header">
        <div className="header-left">
          <h1 className="app-title">蓝牙密码箱</h1>
        </div>
        <div className="header-right">
          <button className="nav-btn" onClick={navigateToAnalysis}>
            数据分析
          </button>
          <button className="nav-btn logout-btn" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="home-main">
        {/* 设备连接状态 */}
        <div className="device-status-card">
          <h2 className="section-title">设备状态</h2>
          <div className="device-info">
            <div className="device-name">
              <span className="label">当前设备：</span>
              <span className="value">{deviceName}</span>
            </div>
            <div className="connection-status">
              <span
                className={`status-indicator ${
                  isConnected ? "connected" : "disconnected"
                }`}
              >
                {isConnected ? "已连接" : "未连接"}
              </span>
            </div>
          </div>

          {/* 设备操作按钮 */}
          <div className="device-actions">
            {!isConnected ? (
              <button
                className="action-btn scan-btn"
                onClick={scanForDevices}
                disabled={isScanning}
              >
                {isScanning ? "扫描中..." : "扫描设备"}
              </button>
            ) : (
              <button
                className="action-btn disconnect-btn"
                onClick={disconnectDevice}
              >
                断开连接
              </button>
            )}
          </div>

          {/* 锁定解锁按钮 */}
          {isConnected && (
            <div className="lock-actions">
              <button
                className="action-btn lock-btn"
                onClick={lockDevice}
                disabled={isLocking || isUnlocking}
              >
                {isLocking ? "锁定中..." : "锁定设备"}
              </button>
              <button
                className="action-btn unlock-btn"
                onClick={unlockDevice}
                disabled={isLocking || isUnlocking}
              >
                {isUnlocking ? "解锁中..." : "解锁设备"}
              </button>
            </div>
          )}
        </div>

        {/* 错误信息显示 */}
        {errorMessage && <div className="error-message">{errorMessage}</div>}

        {/* 设备列表 */}
        {showDeviceList && devices.length > 0 && (
          <div className="device-list-card">
            <h3 className="list-title">可用设备</h3>
            <div className="device-list">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className={`device-item ${
                    selectedDevice?.id === device.id ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedDevice(device);
                    connectToDevice(device);
                  }}
                >
                  <div className="device-item-info">
                    <div className="device-item-name">{device.name}</div>
                    <div className="device-item-id">{device.id}</div>
                  </div>
                  {device.rssi !== undefined && (
                    <div className="device-item-rssi">{device.rssi} dBm</div>
                  )}
                </div>
              ))}
            </div>
            <button
              className="close-list-btn"
              onClick={() => setShowDeviceList(false)}
            >
              关闭列表
            </button>
          </div>
        )}

        {/* 使用说明 */}
        <div className="instructions-card">
          <h2 className="section-title">使用说明</h2>
          <div className="instructions-list">
            <div className="instruction-item">
              <span className="instruction-number">1</span>
              <span className="instruction-text">
                点击"扫描设备"按钮搜索附近的蓝牙设备
              </span>
            </div>
            <div className="instruction-item">
              <span className="instruction-number">2</span>
              <span className="instruction-text">从列表中选择要连接的设备</span>
            </div>
            <div className="instruction-item">
              <span className="instruction-number">3</span>
              <span className="instruction-text">
                连接成功后，可使用"锁定设备"和"解锁设备"功能
              </span>
            </div>
            <div className="instruction-item">
              <span className="instruction-number">4</span>
              <span className="instruction-text">
                点击"数据分析"查看设备使用记录
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomeScreen;
