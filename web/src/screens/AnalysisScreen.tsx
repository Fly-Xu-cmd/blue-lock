import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Button,
  Card,
  Table,
  Typography,
  Row,
  Col,
  Space,
  Tag,
  message,
  Empty,
} from "antd";
import {
  BarChartOutlined,
  LockOutlined,
  UnlockOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import "./AnalysisScreen.css";
import { getAnalysis } from "@/apis/analysis";
import { logoutApi } from "@/apis/register";
import type { AnalysisResponse } from "@/apis/types/analysis";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// interface DailyData {
//   day: string;
//   scans: number;
//   connections: number;
//   locks: number;
//   unlocks: number;
// }

// interface RecentAction {
//   time: string;
//   action: string;
//   device: string;
// }

/**
 * 数据分析屏幕组件
 * 显示用户的设备使用情况、操作记录等分析数据
 */
const AnalysisScreen: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<2 | 3>(2);
  const [behaviorData, setBehaviorData] = useState<AnalysisResponse>();
  const [dayData, setDayData] = useState<AnalysisResponse>();
  const navigate = useNavigate();

  // 模拟用户行为数据
  // const mockBehaviorData: Record<string, BehaviorData> = {
  //   week: {
  //     totalScans: 24,
  //     totalConnections: 18,
  //     totalLocks: 32,
  //     totalUnlocks: 28,
  //     dailyData: [
  //       { day: "周一", scans: 4, connections: 3, locks: 5, unlocks: 4 },
  //       { day: "周二", scans: 3, connections: 2, locks: 4, unlocks: 3 },
  //       { day: "周三", scans: 5, connections: 4, locks: 6, unlocks: 5 },
  //       { day: "周四", scans: 4, connections: 3, locks: 5, unlocks: 4 },
  //       { day: "周五", scans: 5, connections: 4, locks: 7, unlocks: 6 },
  //       { day: "周六", scans: 2, connections: 2, locks: 3, unlocks: 4 },
  //       { day: "周日", scans: 1, connections: 0, locks: 2, unlocks: 2 },
  //     ],
  //     recentActions: [
  //       { time: "10:30", action: "解锁设备", device: "蓝牙锁-001" },
  //       { time: "昨天 22:10", action: "锁定设备", device: "蓝牙锁-001" },
  //       { time: "昨天 21:30", action: "解锁设备", device: "蓝牙锁-001" },
  //       { time: "昨天 14:20", action: "锁定设备", device: "蓝牙锁-001" },
  //       { time: "昨天 10:00", action: "解锁设备", device: "蓝牙锁-001" },
  //     ],
  //   },
  //   month: {
  //     totalScans: 96,
  //     totalConnections: 72,
  //     totalLocks: 128,
  //     totalUnlocks: 112,
  //     dailyData: [
  //       { day: "第1周", scans: 24, connections: 18, locks: 32, unlocks: 28 },
  //       { day: "第2周", scans: 22, connections: 17, locks: 30, unlocks: 26 },
  //       { day: "第3周", scans: 25, connections: 19, locks: 34, unlocks: 29 },
  //       { day: "第4周", scans: 25, connections: 18, locks: 32, unlocks: 29 },
  //     ],
  //     recentActions: [
  //       { time: "10:30", action: "解锁设备", device: "蓝牙锁-001" },
  //       { time: "昨天 22:10", action: "锁定设备", device: "蓝牙锁-001" },
  //       { time: "昨天 21:30", action: "解锁设备", device: "蓝牙锁-001" },
  //       { time: "昨天 14:20", action: "锁定设备", device: "蓝牙锁-001" },
  //       { time: "昨天 10:00", action: "解锁设备", device: "蓝牙锁-001" },
  //     ],
  //   },
  // };

  // 检查是否已登录
  useEffect(() => {
    const token = localStorage.getItem("blue_lock:access_token");
    if (!token) {
      message.error("您需要先登录才能访问");
      navigate("/login");
    }
    const params = {
      time_period: selectedTimeRange as number,
      page: 1,
      page_size: 10,
    };
    getAnalysis(params).then((res) => {
      console.log("分析数据:", res);
      setBehaviorData(res.data);
    });
    // 每日数据
    getAnalysis({
      time_period: 1,
      page: 1,
      page_size: 10,
    }).then((res) => {
      console.log("分析数据:", res);
      setDayData(res.data);
    });
  }, [navigate, selectedTimeRange]);

  // 导航回首页
  const navigateToHome = () => {
    navigate("/home");
  };

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem("blue_lock:access_token");
    localStorage.removeItem("blue_lock:refresh_token");
    logoutApi().then(() => {
      message.success("退出登录成功");
      navigate("/login");
    });
  };

  // 表格列配置
  const tableColumns = [
    {
      title: "时间",
      dataIndex: "operate_time",
      key: "operate_time",
      width: 100,
    },
    {
      title: "操作",
      dataIndex: "operation_content",
      key: "operation_content",
      align: "center" as const,
    },
    {
      title: "描述",
      dataIndex: "operation_des",
      key: "operation_des",
      align: "center" as const,
    },
  ];

  // 统计卡片数据
  const statCards = [
    {
      title: "总锁定次数",
      value: behaviorData?.lock_count || 0,
      icon: <LockOutlined style={{ fontSize: 24, color: "#1890ff" }} />,
      color: "#1890ff",
    },
    {
      title: "总解锁次数",
      value: behaviorData?.unlock_count || 0,
      icon: <UnlockOutlined style={{ fontSize: 24, color: "#52c41a" }} />,
      color: "#52c41a",
    },
    {
      title: "总操作次数",
      value: behaviorData?.total || 0,
      icon: <LinkOutlined style={{ fontSize: 24, color: "#f5222d" }} />,
      color: "#f5222d",
    },
  ];

  return (
    <Layout className="analysis-layout">
      {/* 顶部导航栏 */}
      <Header className="analysis-header">
        <div className="header-left">
          <Title level={3} style={{ color: "#000", margin: 0 }}>
            <BarChartOutlined style={{ marginRight: 8 }} />
            蓝牙密码箱
          </Title>
        </div>
        <div className="header-right">
          <Space>
            <Button
              type="primary"
              onClick={navigateToHome}
              size="middle"
              style={{ marginRight: 8 }}
            >
              返回首页
            </Button>
            <Button danger onClick={handleLogout} size="middle">
              退出登录
            </Button>
          </Space>
        </div>
      </Header>

      {/* 主内容区 */}
      <Content className="analysis-main">
        <div className="analysis-content">
          {/* 页面标题和时间范围选择 */}
          <div style={{ marginBottom: 24 }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={2} style={{ margin: 0 }}>
                  用户行为分析
                </Title>
              </Col>
              <Col>
                <Space>
                  <Button
                    type={selectedTimeRange === 2 ? "primary" : "default"}
                    onClick={() => setSelectedTimeRange(2)}
                  >
                    本周
                  </Button>
                  <Button
                    type={selectedTimeRange === 3 ? "primary" : "default"}
                    onClick={() => setSelectedTimeRange(3)}
                  >
                    本月
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

          {/* 数据概览卡片 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {statCards.map((card, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <Card hoverable={false} className="stat-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <Text style={{ fontSize: 14, color: "#8c8c8c" }}>
                        {card.title}
                      </Text>
                      <div
                        style={{
                          fontSize: 32,
                          fontWeight: "bold",
                          color: card.color,
                          marginTop: 8,
                        }}
                      >
                        {card.value}
                      </div>
                    </div>
                    <div>{card.icon}</div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* 数据表格和最近操作记录并排显示 */}
          <Row gutter={[16, 16]}>
            {/* 每日数据表格 */}
            <Col xs={24} lg={14}>
              <Card title={"每日数据"}>
                <Table
                  columns={tableColumns}
                  dataSource={dayData?.recordList || []}
                  rowKey="operate_time"
                  pagination={false}
                  size="middle"
                />
              </Card>
            </Col>

            {/* 最近操作记录 */}
            <Col xs={24} lg={10}>
              <Card title="最近操作记录">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {behaviorData?.recordList?.length > 0 ? (
                    behaviorData?.recordList.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="action-item"
                        style={{
                          padding: "12px",
                          border: "1px solid #f0f0f0",
                          borderRadius: "4px",
                          transition: "all 0.3s",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "4px",
                          }}
                        >
                          <Text
                            strong
                          >{`${item.user_name}：${item.operation_content}`}</Text>
                          <Tag color="blue">{"蓝牙密码箱"}</Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          {item.operate_time}
                        </Text>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: "12px",
                        border: "1px solid #f0f0f0",
                        borderRadius: "4px",
                        transition: "all 0.3s",
                      }}
                    >
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        style={{ height: 60 }}
                        description={
                          <span>
                            <Text type="secondary">暂无操作记录</Text>
                          </span>
                        }
                      />
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default AnalysisScreen;
