import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  BackHandler,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
// import { logoutApi } from '../apis/register';
import { HeaderButton } from '@react-navigation/elements';
import AntDesign from 'react-native-vector-icons/AntDesign';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [manager] = useState<BleManager>(new BleManager());
  const [device, setDevice] = useState<Device | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [bluetoothState, setBluetoothState] = useState<string>('Unknown');
  const [showDeviceList, setShowDeviceList] = useState<boolean>(false);

  // 请求权限
  const requestBluetoothPermission = async (
    showAlert: boolean = false,
  ): Promise<boolean> => {
    if (Platform.OS === 'ios') return true;

    try {
      const apiLevel = parseInt(Platform.Version.toString(), 10);
      let granted = false;

      if (apiLevel < 31) {
        // Android 11 及以下版本
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '蓝牙权限请求',
            message: '应用需要位置权限来扫描蓝牙设备',
            buttonNeutral: '稍后询问',
            buttonNegative: '拒绝',
            buttonPositive: '允许',
          },
        );
        granted = result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // Android 12 及以上版本
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        granted =
          result['android.permission.BLUETOOTH_SCAN'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_CONNECT'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.ACCESS_FINE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED;
      }

      if (!granted && showAlert) {
        Alert.alert(
          '权限被拒绝',
          '应用需要蓝牙相关权限才能正常工作，请在设置中允许权限',
          [
            { text: '取消', style: 'cancel' },
            {
              text: '去设置',
              onPress: () => {
                // 这里可以添加跳转到设置的逻辑
                Alert.alert('提示', '请手动前往设置页面开启权限');
              },
            },
          ],
        );
      }

      return granted;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  useEffect(() => {
    requestBluetoothPermission();
  }, []);

  // 禁用返回功能
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // 返回true表示禁用默认返回行为
        return true;
      };

      // 注册Android物理返回按钮事件
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => {
        // 清理事件监听器
        subscription.remove();
      };
    }, []),
  );

  // 扫描设备
  const scanForDevices = useCallback(async () => {
    if (isScanning) return;

    // 检查权限
    const hasPermission = await requestBluetoothPermission(true);
    if (!hasPermission) {
      setErrorMessage('权限不足，无法扫描蓝牙设备');
      setTimeout(() => setErrorMessage(''), 2000);
      return;
    }

    // 检查蓝牙状态
    const state = await manager.state();
    if (state !== 'PoweredOn') {
      Alert.alert('蓝牙未开启', '请先打开蓝牙');
      return;
    }

    setIsScanning(true);
    setDevices([]);
    setErrorMessage('');

    const foundDevices: Device[] = [];

    try {
      manager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error, scannedDevice) => {
          if (error) {
            console.log('Scan error:', error);
            setErrorMessage(error.message);
            setIsScanning(false);
            return;
          }

          if (scannedDevice && scannedDevice.name) {
            setDevices(prev => {
              const updatedDevices = prev.some(d => d.id === scannedDevice.id)
                ? prev
                : [...prev, scannedDevice].sort(
                    (a, b) => (b.rssi || 0) - (a.rssi || 0), // 按 RSSI 降序
                  );

              // 更新本地数组以获取准确的设备数量
              foundDevices.length = 0;
              foundDevices.push(...updatedDevices);
              return updatedDevices;
            });
          }
        },
      );

      // 10秒后自动停止扫描
      setTimeout(() => {
        manager.stopDeviceScan();
        setIsScanning(false);
        console.log('Scan completed, found', foundDevices.length, 'devices');

        // 如果没有找到设备，显示提示
        if (foundDevices.length === 0) {
          setErrorMessage('未发现任何蓝牙设备');
          setTimeout(() => setErrorMessage(''), 2000);
        }
      }, 10000);
    } catch (error: any) {
      console.error('Scan exception:', error);
      setErrorMessage(`扫描失败: ${error.message}`);
      setIsScanning(false);
      setTimeout(() => setErrorMessage(''), 2000);
    }
  }, [isScanning, manager]);

  // 蓝牙状态监听
  useEffect(() => {
    const subscription = manager.onStateChange(state => {
      setBluetoothState(state);
    }, true);

    return () => {
      manager.stopDeviceScan();
      subscription.remove();
      manager.destroy();
    };
  }, [manager]);

  // 连接设备
  const connectToDevice = async (targetDevice?: Device) => {
    const deviceToConnect = targetDevice || device;
    if (!deviceToConnect) {
      Alert.alert('错误', '未选择设备!');
      return;
    }

    try {
      setErrorMessage('');
      setIsConnected(false);

      // 如果当前有连接的设备，先断开
      if (isConnected && device && device.id !== deviceToConnect.id) {
        await device.cancelConnection();
      }

      // 连接设备
      await deviceToConnect.connect();
      setIsConnected(true);
      setDevice(deviceToConnect);

      // 发现服务和特征
      const servicesAndCharacteristics =
        await deviceToConnect.discoverAllServicesAndCharacteristics();
      console.log(
        '已连接并发现服务和特征:',
        deviceToConnect.name,
        servicesAndCharacteristics,
      );

      // 隐藏设备列表
      setShowDeviceList(false);
    } catch (error: any) {
      console.log('连接失败:', error);
      setErrorMessage(`连接失败: ${error.message}`);
      setIsConnected(false);

      // 1.5秒后自动清除错误信息
      setTimeout(() => {
        setErrorMessage('');
      }, 1500);
    }
  };

  // 发送命令
  const sendCommand = async (value: number) => {
    if (!device) {
      Alert.alert('错误', '未找到设备!');
      return;
    }

    const buffer = Buffer.from([value]);
    const base64 = buffer.toString('base64');

    try {
      await device.writeCharacteristicWithoutResponseForService(
        '4fafc201-1fb5-459e-8fcc-c5c9c331914b', // 服务UUID
        'beb5483e-36e1-4688-b7f5-ea07361b26a8', // 特征UUID
        base64,
      );
      Alert.alert('成功', value === 1 ? '锁定命令已发送' : '解锁命令已发送');
    } catch (error: any) {
      console.log('发送命令失败:', error);
      setErrorMessage(`发送命令失败: ${error.message}`);
    }
  };
  // 蓝牙状态样式
  const getBluetoothStateStyle = () => {
    switch (bluetoothState) {
      case 'PoweredOn':
        return styles.stateIndicatorOn;
      case 'PoweredOff':
      case 'Unauthorized':
      case 'Unsupported':
        return styles.stateIndicatorOff;
      default:
        return styles.stateIndicatorUnknown;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f5f5f5" barStyle="dark-content" />
      {/* 导航栏 */}
      <View style={[styles.header]}>
        <Text style={styles.headerTitle}>操作页</Text>
        <HeaderButton
          accessibilityLabel="More options"
          onPress={() => console.log('button pressed')}
        >
          <AntDesign name="logout" size={24} />
        </HeaderButton>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>蓝牙设备控制器</Text>

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>蓝牙状态:</Text>
          <View style={[styles.stateIndicator, getBluetoothStateStyle()]} />
          <Text style={styles.statusValue}>{bluetoothState}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>设备信息</Text>
          {isScanning ? (
            <View style={styles.scanningContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.scanningText}>扫描中...</Text>
            </View>
          ) : device ? (
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{device.name}</Text>
              <Text style={styles.deviceId}>{device.id}</Text>
              <TouchableOpacity
                style={styles.changeDeviceButton}
                onPress={() => setShowDeviceList(true)}
              >
                <Text style={styles.changeDeviceText}>切换设备</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.noDeviceText}>
              {devices.length > 0 ? '请选择设备' : '未找到设备'}
            </Text>
          )}
        </View>

        {(showDeviceList || (!device && devices.length > 0)) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>可用设备 ({devices.length})</Text>
            {devices.length > 0 ? (
              <ScrollView style={styles.deviceList}>
                {devices.map(dev => {
                  // 计算信号强度百分比 (RSSI范围通常为-100到-30)
                  const rssiValue = dev.rssi || -100;
                  const signalStrength = Math.max(
                    0,
                    Math.min(100, ((rssiValue + 100) / 70) * 100),
                  );

                  // 计算信号条样式
                  const getSignalBarStyle = (index: number) => {
                    return {
                      height: 8 + index * 4,
                      backgroundColor:
                        signalStrength > (index + 1) * 25
                          ? '#4CD964'
                          : '#C7C7CC',
                      opacity: signalStrength > (index + 1) * 25 ? 1 : 0.5,
                    };
                  };

                  return (
                    <TouchableOpacity
                      key={dev.id}
                      style={styles.deviceItem}
                      onPress={() => connectToDevice(dev)}
                    >
                      <View style={styles.deviceItemLeft}>
                        <View style={styles.signalContainer}>
                          {[...Array(4)].map((_, index) => (
                            <View
                              key={index}
                              style={[
                                styles.signalBar,
                                getSignalBarStyle(index),
                              ]}
                            />
                          ))}
                        </View>

                        <View style={styles.deviceItemContent}>
                          <Text style={styles.deviceItemName}>{dev.name}</Text>
                          <Text style={styles.deviceItemId}>{dev.id}</Text>
                        </View>
                      </View>

                      <Text style={styles.deviceItemRssi}>
                        RSSI: {rssiValue} dBm
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.noDeviceText}>没有可用设备</Text>
                <TouchableOpacity
                  style={styles.scanAgainButton}
                  onPress={scanForDevices}
                  disabled={isScanning}
                >
                  <Text style={styles.scanAgainButtonText}>
                    {isScanning ? '扫描中...' : '重新扫描'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.controlsContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.button,
                isScanning || isConnected
                  ? styles.buttonDisabled
                  : styles.scanButton,
              ]}
              onPress={scanForDevices}
              disabled={isScanning || isConnected}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>
                {isScanning ? '搜索中...' : '搜索设备'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                !device || isScanning || isConnected
                  ? styles.buttonDisabled
                  : styles.connectButton,
              ]}
              onPress={() => connectToDevice()}
              disabled={!device || isScanning || isConnected}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>连接设备</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.button,
                !isConnected ? styles.buttonDisabled : styles.lockButton,
              ]}
              onPress={() => sendCommand(1)}
              disabled={!isConnected}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>锁定设备</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                !isConnected ? styles.buttonDisabled : styles.unlockButton,
              ]}
              onPress={() => sendCommand(0)}
              disabled={!isConnected}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>解锁设备</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.connectionStatus}>
          <Text style={styles.statusLabel}>连接状态:</Text>
          <Text
            style={[
              styles.statusValue,
              isConnected ? styles.connectedText : styles.disconnectedText,
            ]}
          >
            {isConnected ? '已连接' : '未连接'}
          </Text>
        </View>

        {/* 分析页面导航按钮 */}
        <TouchableOpacity
          style={styles.analysisButton}
          onPress={() => navigation.navigate('Analysis' as never)}
          activeOpacity={0.7}
        >
          <Text style={styles.analysisButtonText}>查看行为分析</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    // paddingHorizontal: 10,
    paddingTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    fontSize: 20,
  },

  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#2d3748',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#718096',
    marginRight: 10,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginLeft: 10,
  },
  stateIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  stateIndicatorOn: { backgroundColor: '#38a169' },
  stateIndicatorOff: { backgroundColor: '#e53e3e' },
  stateIndicatorUnknown: { backgroundColor: '#d69e2e' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#2d3748',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scanningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  scanningText: {
    marginTop: 15,
    fontSize: 18,
    color: '#718096',
  },
  deviceInfo: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  deviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4299e1',
    marginBottom: 8,
  },
  deviceId: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 15,
  },
  noDeviceText: {
    fontSize: 16,
    color: '#a0aec0',
    textAlign: 'center',
    marginBottom: 15,
  },
  changeDeviceButton: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4299e1',
    borderRadius: 12,
    elevation: 2,
  },
  changeDeviceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deviceList: {
    // maxHeight: 250,
    borderRadius: 12,
    overflow: 'hidden',
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  deviceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  deviceItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  deviceItemId: {
    fontSize: 12,
    color: '#718096',
  },
  deviceItemRssi: {
    fontSize: 14,
    color: '#4299e1',
    fontWeight: '600',
  },
  signalContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: 40,
    height: 24,
  },
  signalBar: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  errorContainer: {
    backgroundColor: '#fed7d7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
  },
  errorText: {
    color: '#c53030',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  controlsContainer: {
    marginBottom: 25,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 7,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: '#4299e1',
  },
  connectButton: {
    backgroundColor: '#38a169',
  },
  lockButton: {
    backgroundColor: '#e53e3e',
  },
  unlockButton: {
    backgroundColor: '#38a169',
  },
  buttonDisabled: {
    backgroundColor: '#cbd5e0',
    elevation: 0,
    shadowOpacity: 0,
  },
  connectionStatus: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  connectedText: {
    color: '#38a169',
    fontWeight: '600',
  },
  disconnectedText: {
    color: '#e53e3e',
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f7fafc',
    borderRadius: 12,
  },
  scanAgainButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4299e1',
    borderRadius: 12,
    elevation: 2,
  },
  scanAgainButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  analysisButton: {
    backgroundColor: '#4299e1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  analysisButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
