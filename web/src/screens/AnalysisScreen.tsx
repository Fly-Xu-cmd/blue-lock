import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AnalysisScreen.css';

interface DailyData {
  day: string;
  scans: number;
  connections: number;
  locks: number;
  unlocks: number;
}

interface RecentAction {
  time: string;
  action: string;
  device: string;
}

interface BehaviorData {
  totalScans: number;
  totalConnections: number;
  totalLocks: number;
  totalUnlocks: number;
  dailyData: DailyData[];
  recentActions: RecentAction[];
}

/**
 * 数据分析屏幕组件
 * 显示用户的设备使用情况、操作记录等分析数据
 */
const AnalysisScreen: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month'>('week');
  const navigate = useNavigate();

  // 模拟用户行为数据
  const mockBehaviorData: Record<string, BehaviorData> = {
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
        { time: '昨天 14:20', action: '锁定设备', device: '蓝牙锁-001' },
        { time: '昨天 10:00', action: '解锁设备', device: '蓝牙锁-001' },
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
        { time: '昨天 14:20', action: '锁定设备', device: '蓝牙锁-001' },
        { time: '昨天 10:00', action: '解锁设备', device: '蓝牙锁-001' },
      ],
    },
  };

  // 检查是否已登录
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // 计算当前选择的时间范围数据
  const currentData = mockBehaviorData[selectedTimeRange];

  // 导航回首页
  const navigateToHome = () => {
    navigate('/home');
  };

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <div className="analysis-container">
      {/* 顶部导航栏 */}
      <header className="analysis-header">
        <div className="header-left">
          <h1 className="app-title">蓝牙密码箱</h1>
        </div>
        <div className="header-right">
          <button 
            className="nav-btn"
            onClick={navigateToHome}
          >
            返回首页
          </button>
          <button 
            className="nav-btn logout-btn"
            onClick={handleLogout}
          >
            退出登录
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="analysis-main">
        <div className="analysis-content">
          {/* 页面标题 */}
          <h2 className="page-title">用户行为分析</h2>

          {/* 时间范围选择 */}
          <div className="time-range-container">
            <button
              className={`time-range-btn ${selectedTimeRange === 'week' ? 'active' : ''}`}
              onClick={() => setSelectedTimeRange('week')}
            >
              本周
            </button>
            <button
              className={`time-range-btn ${selectedTimeRange === 'month' ? 'active' : ''}`}
              onClick={() => setSelectedTimeRange('month')}
            >
              本月
            </button>
          </div>

          {/* 数据概览卡片 */}
          <div className="overview-container">
            <div className="overview-card">
              <div className="overview-label">总锁定次数</div>
              <div className="overview-value">{currentData.totalLocks}</div>
            </div>
            <div className="overview-card">
              <div className="overview-label">总解锁次数</div>
              <div className="overview-value">{currentData.totalUnlocks}</div>
            </div>
            <div className="overview-card">
              <div className="overview-label">总扫描次数</div>
              <div className="overview-value">{currentData.totalScans}</div>
            </div>
            <div className="overview-card">
              <div className="overview-label">总连接次数</div>
              <div className="overview-value">{currentData.totalConnections}</div>
            </div>
          </div>

          {/* 数据表格和最近操作记录并排显示 */}
          <div className="data-section">
            {/* 每日数据表格 */}
            <div className="table-card">
              <h3 className="section-title">
                {selectedTimeRange === 'week' ? '每日数据' : '每周数据'}
              </h3>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>时间</th>
                      <th>扫描</th>
                      <th>连接</th>
                      <th>锁定</th>
                      <th>解锁</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.dailyData.map((item, index) => (
                      <tr key={index} className={index % 2 === 1 ? 'alternate' : ''}>
                        <td>{item.day}</td>
                        <td>{item.scans}</td>
                        <td>{item.connections}</td>
                        <td>{item.locks}</td>
                        <td>{item.unlocks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 最近操作记录 */}
            <div className="actions-card">
              <h3 className="section-title">最近操作记录</h3>
              <div className="actions-list">
                {currentData.recentActions.map((action, index) => (
                  <div key={index} className="action-item">
                    <div className="action-time">{action.time}</div>
                    <div className="action-content">
                      <span className="action-type">{action.action}</span>
                      <span className="action-device">{action.device}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalysisScreen;
