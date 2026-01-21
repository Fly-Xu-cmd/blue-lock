import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

/**
 * 用户行为分析页面
 * 显示用户的设备使用情况、操作记录等分析数据
 */
const AnalysisScreen: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');

  // 模拟用户行为数据
  const mockBehaviorData = {
    week: {
      totalScans: 24,
      totalConnections: 18,
      totalLocks: 32,
      totalUnlocks: 28,
      dailyData: [
        { day: '周一', scans: 4, connections: 3, locks: 5, unlocks: 4 },
        { day: '周二', scans: 3, connections: 2, locks: 4, unlocks: 3 },
        { day: '周三', scans: 5, connections: 4, locks: 6, unlocks: 5 },
        { day: '周四', scans: 4, connections: 3, locks: 5, unlocks: 4 },
        { day: '周五', scans: 5, connections: 4, locks: 7, unlocks: 6 },
        { day: '周六', scans: 2, connections: 2, locks: 3, unlocks: 4 },
        { day: '周日', scans: 1, connections: 0, locks: 2, unlocks: 2 },
      ],
      recentActions: [
        { time: '10:30', action: '解锁设备', device: '蓝牙锁-001' },
        { time: '昨天 22:10', action: '锁定设备', device: '蓝牙锁-001' },
        { time: '昨天 21:30', action: '解锁设备', device: '蓝牙锁-001' },
      ],
    },
    month: {
      totalScans: 96,
      totalConnections: 72,
      totalLocks: 128,
      totalUnlocks: 112,
      dailyData: [
        { day: '第1周', scans: 24, connections: 18, locks: 32, unlocks: 28 },
        { day: '第2周', scans: 22, connections: 17, locks: 30, unlocks: 26 },
        { day: '第3周', scans: 25, connections: 19, locks: 34, unlocks: 29 },
        { day: '第4周', scans: 25, connections: 18, locks: 32, unlocks: 29 },
      ],
      recentActions: [
        { time: '10:30', action: '解锁设备', device: '蓝牙锁-001' },
        { time: '昨天 22:10', action: '锁定设备', device: '蓝牙锁-001' },
        { time: '昨天 21:30', action: '解锁设备', device: '蓝牙锁-001' },
      ],
    },
  };

  // 计算当前选择的时间范围数据
  const currentData =
    mockBehaviorData[selectedTimeRange as keyof typeof mockBehaviorData];

  return (
    <ScrollView style={styles.container}>
      <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />

      {/* 时间范围选择 */}
      <View style={styles.timeRangeContainer}>
        <TouchableOpacity
          style={[
            styles.timeRangeButton,
            selectedTimeRange === 'week' && styles.timeRangeButtonActive,
          ]}
          onPress={() => setSelectedTimeRange('week')}
        >
          <Text
            style={[
              styles.timeRangeText,
              selectedTimeRange === 'week' && styles.timeRangeTextActive,
            ]}
          >
            本周
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.timeRangeButton,
            selectedTimeRange === 'month' && styles.timeRangeButtonActive,
          ]}
          onPress={() => setSelectedTimeRange('month')}
        >
          <Text
            style={[
              styles.timeRangeText,
              selectedTimeRange === 'month' && styles.timeRangeTextActive,
            ]}
          >
            本月
          </Text>
        </TouchableOpacity>
      </View>

      {/* 数据概览卡片 */}
      <View style={styles.overviewContainer}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>总锁定次数</Text>
          <Text style={styles.overviewValue}>{currentData.totalLocks}</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>总解锁次数</Text>
          <Text style={styles.overviewValue}>{currentData.totalUnlocks}</Text>
        </View>
      </View>

      {/* 每日数据表格 */}
      <View style={styles.tableContainer}>
        <Text style={styles.sectionTitle}>
          {selectedTimeRange === 'week' ? '每日数据' : '每周数据'}
        </Text>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>时间</Text>
          <Text style={styles.tableHeaderText}>锁定</Text>
          <Text style={styles.tableHeaderText}>解锁</Text>
        </View>
        {currentData.dailyData.map((item, index) => (
          <View
            key={index}
            style={[
              styles.tableRow,
              index % 2 === 1 && styles.tableRowAlternate,
            ]}
          >
            <Text style={styles.tableCell}>{item.day}</Text>
            <Text style={styles.tableCell}>{item.locks}</Text>
            <Text style={styles.tableCell}>{item.unlocks}</Text>
          </View>
        ))}
      </View>

      {/* 最近操作记录 */}
      <View style={styles.recentActionsContainer}>
        <Text style={styles.sectionTitle}>最近操作记录</Text>
        {currentData.recentActions.map((action, index) => (
          <View key={index} style={styles.actionItem}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>
                {action.action === '解锁设备'
                  ? '🔓'
                  : action.action === '锁定设备'
                  ? '🔒'
                  : action.action === '连接设备'
                  ? '📲'
                  : '🔍'}
              </Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionText}>{action.action}</Text>
              <Text style={styles.actionDevice}>{action.device}</Text>
            </View>
            <Text style={styles.actionTime}>{action.time}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timeRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  timeRangeButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  timeRangeTextActive: {
    color: '#ffffff',
  },
  overviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    marginBottom: 15,
  },
  overviewCard: {
    width: '45%',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  overviewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableRowAlternate: {
    backgroundColor: '#fafafa',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  recentActionsContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginBottom: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionContent: {
    flex: 1,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  actionDevice: {
    fontSize: 14,
    color: '#666',
  },
  actionTime: {
    fontSize: 14,
    color: '#999',
  },
});

export default AnalysisScreen;
