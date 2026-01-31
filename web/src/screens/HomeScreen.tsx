import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  message,
  Layout,
  Button,
  Card,
  Badge,
  List,
  Alert,
  Steps,
  Space,
  Typography,
  InputNumber,
} from "antd";
import {
  BarChartOutlined,
  LogoutOutlined,
  SearchOutlined,
  DisconnectOutlined,
  LockOutlined,
  UnlockOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import "./HomeScreen.css";

const { Title } = Typography;

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
  const [isSettingLockTime, setIsSettingLockTime] = useState<boolean>(false);
  const [lockTime, setSelectedLockTime] = useState<number>(1.0);
  const [deviceName, setDeviceName] = useState<string>("未连接设备");
  const [bluetoothDevice, setBluetoothDevice] =
    useState<BluetoothDevice | null>(null);
  const [gattServer, setGattServer] =
    useState<BluetoothRemoteGATTServer | null>(null);
  const [controlCharacteristic, setControlCharacteristic] =
    useState<BluetoothRemoteGATTCharacteristic | null>(null);

  // 检查是否已登录
  useEffect(() => {
    const token = localStorage.getItem("blue_lock:access_token");
    if (!token) {
      message.error("您需要先登录才能访问");
      navigate("/login");
    }
  }, [navigate]);

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
          "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
        );

        // 3. 获取控制特征
        const characteristic = await service.getCharacteristic(
          "beb5483e-36e1-4688-b7f5-ea07361b26a8",
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
    [bluetoothDevice],
  );

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
        filters: [{ name: "智能门锁" }],
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
  }, [isScanning, connectToDevice]);

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

  // 设定锁定时间
  // 设置锁定时间
  const setLockTime = useCallback(
    async (time: number) => {
      if (!isConnected || !controlCharacteristic) {
        setErrorMessage("请先连接设备");
        return;
      }

      if (time < 1 || time > 12) {
        setErrorMessage("锁定时间必须在1到12小时之间");
        return;
      }

      setIsSettingLockTime(true);
      setErrorMessage("正在设置锁定时间...");

      try {
        // // 向ESP32发送锁定时间命令
        // 命令格式为："TIMER:时间"，例如："TIMER:1.5"
        const command = `TIMER:${time.toFixed(1)}`;
        const encoder = new TextEncoder();
        await controlCharacteristic.writeValue(encoder.encode(command));

        // 读取当前状态确认
        const value = await controlCharacteristic.readValue();
        const currentState = value.getUint8(0);

        if (currentState === 2) {
          setIsSettingLockTime(false);
          setErrorMessage(`锁定时间已设置为${time}小时`);
          setTimeout(() => setErrorMessage(""), 2000);
          message.success(`锁定时间设置成功：${time}小时`);
        } else {
          throw new Error("锁定时间设置失败");
        }
      } catch (error: any) {
        console.error("Set lock time error:", error);
        setErrorMessage("设置锁定时间失败: " + error.message);
        setIsSettingLockTime(false);
      }
    },
    [isConnected, controlCharacteristic],
  );

  // 导航到分析页面
  const navigateToAnalysis = useCallback(() => {
    navigate("/analysis");
  }, [navigate]);

  // 退出登录
  const handleLogout = useCallback(() => {
    localStorage.removeItem("blue_lock:access_token");
    localStorage.removeItem("blue_lock:refresh_token");

    navigate("/login");
  }, [navigate]);

  const { Header, Content } = Layout;

  return (
    <Layout className="home-container">
      {/* 顶部导航栏 */}
      <Header className="home-header">
        <div className="header-left">
          <Title level={3} style={{ color: "#000", margin: 0 }}>
            <BarChartOutlined style={{ marginRight: 8 }} />
            蓝牙密码箱
          </Title>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<BarChartOutlined />}
            onClick={navigateToAnalysis}
            className="nav-btn"
          >
            数据分析
          </Button>
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            className="nav-btn logout-btn"
          >
            退出登录
          </Button>
        </Space>
      </Header>

      {/* 主内容区 */}
      <Content className="home-main">
        {/* 设备连接状态 */}
        <Card title="设备状态" className="device-status-card" hoverable>
          <div className="device-info">
            <div className="device-name">
              <span className="label">当前设备：</span>
              <span className="value">{deviceName}</span>
            </div>
            <div className="connection-status">
              <Badge
                status={isConnected ? "success" : "error"}
                text={isConnected ? "已连接" : "未连接"}
              />
            </div>
          </div>

          {/* 设备操作按钮 */}
          <div className="device-actions">
            {!isConnected ? (
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={scanForDevices}
                disabled={isScanning}
                className="action-btn scan-btn"
                loading={isScanning}
              >
                {isScanning ? "扫描中..." : "扫描设备"}
              </Button>
            ) : (
              <Button
                danger
                icon={<DisconnectOutlined />}
                onClick={disconnectDevice}
                className="action-btn disconnect-btn"
              >
                断开连接
              </Button>
            )}
          </div>

          {/* 锁定解锁按钮 */}
          {isConnected && (
            <>
              <div className="lock-actions">
                <Button
                  type="default"
                  icon={<LockOutlined />}
                  onClick={lockDevice}
                  disabled={isLocking || isUnlocking}
                  className="action-btn lock-btn"
                  loading={isLocking}
                >
                  {isLocking ? "锁定中..." : "锁定设备"}
                </Button>
                <Button
                  type="primary"
                  icon={<UnlockOutlined />}
                  onClick={unlockDevice}
                  disabled={isLocking || isUnlocking}
                  className="action-btn unlock-btn"
                  loading={isUnlocking}
                >
                  {isUnlocking ? "解锁中..." : "解锁设备"}
                </Button>
              </div>

              {/* 锁定时间设置 */}
              <div className="lock-time-setting" style={{ marginTop: "24px" }}>
                <div style={{ marginBottom: "12px" }}>
                  <Title level={5} style={{ margin: 0 }}>
                    设置锁定时间
                  </Title>
                </div>
                <Space align="center">
                  <InputNumber
                    min={1}
                    max={12}
                    step={0.1}
                    precision={1}
                    value={lockTime}
                    onChange={(value) => setSelectedLockTime(value as number)}
                    style={{ width: 120 }}
                  />
                  <span style={{ margin: "0 8px" }}>小时</span>
                  <Button
                    type="primary"
                    onClick={() => setLockTime(lockTime)}
                    disabled={isSettingLockTime || isLocking || isUnlocking}
                    loading={isSettingLockTime}
                  >
                    确认设置
                  </Button>
                </Space>
              </div>
            </>
          )}
        </Card>

        {/* 错误信息显示 */}
        {errorMessage && (
          <Alert
            title="提示"
            description={errorMessage}
            type={
              errorMessage.includes("失败") || errorMessage.includes("错误")
                ? "error"
                : "info"
            }
            showIcon
            closable
            className="error-alert"
          />
        )}

        {/* 设备列表 */}
        {showDeviceList && devices.length > 0 && (
          <Card
            title="可用设备"
            className="device-list-card"
            extra={
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => setShowDeviceList(false)}
              >
                关闭
              </Button>
            }
          >
            <List
              dataSource={devices}
              renderItem={(device) => (
                <List.Item
                  key={device.id}
                  className={selectedDevice?.id === device.id ? "selected" : ""}
                  onClick={() => {
                    setSelectedDevice(device);
                    connectToDevice(device);
                  }}
                  actions={
                    device.rssi !== undefined ? [`${device.rssi} dBm`] : []
                  }
                >
                  <List.Item.Meta title={device.name} description={device.id} />
                </List.Item>
              )}
              bordered
            />
          </Card>
        )}

        {/* 使用说明 */}
        <Card title="使用说明" className="instructions-card">
          <Steps
            items={[
              {
                title: "扫描设备",
                content: "点击'扫描设备'按钮搜索附近的蓝牙设备",
              },
              {
                title: "选择设备",
                content: "从列表中选择要连接的设备",
              },
              {
                title: "操作设备",
                content: "连接成功后，可使用'锁定设备'和'解锁设备'功能",
              },
              {
                title: "数据分析",
                content: "点击'数据分析'查看设备使用记录",
              },
            ]}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default HomeScreen;
