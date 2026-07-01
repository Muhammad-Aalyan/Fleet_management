import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Typography, Progress, Spin } from 'antd'
import {
  CarOutlined, TeamOutlined, UserOutlined, FileTextOutlined,
  ThunderboltOutlined, CheckCircleOutlined, ClockCircleOutlined, DollarOutlined,
} from '@ant-design/icons'
import api from '../api/axios'

const { Title, Text } = Typography

const statusColors: Record<string, string> = {
  PENDING: 'gold', APPROVED: 'blue', ASSIGNED: 'purple',
  IN_PROGRESS: 'processing', COMPLETED: 'green', REJECTED: 'red', CANCELLED: 'default',
}

interface Stats {
  totalDrivers: number; totalVehicles: number; pendingRequests: number; activeRides: number
  completedToday: number; totalCustomers: number; totalRequests: number; totalFuelCost: number
  vehicleUtilization: { available: number; inRide: number; maintenance: number; inactive: number }
  driverStatus: { available: number; onRide: number; offDuty: number }
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/recent-requests'),
    ]).then(([s, r]) => {
      setStats(s.data)
      setRecent(r.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { title: 'Total Drivers',     value: stats.totalDrivers,    icon: <TeamOutlined />,          color: '#1677ff', bg: '#e6f4ff' },
    { title: 'Total Vehicles',    value: stats.totalVehicles,   icon: <CarOutlined />,           color: '#52c41a', bg: '#f6ffed' },
    { title: 'Pending Requests',  value: stats.pendingRequests, icon: <ClockCircleOutlined />,   color: '#faad14', bg: '#fffbe6' },
    { title: 'Active Rides',      value: stats.activeRides,     icon: <ThunderboltOutlined />,   color: '#f5222d', bg: '#fff1f0' },
    { title: 'Completed Today',   value: stats.completedToday,  icon: <CheckCircleOutlined />,   color: '#52c41a', bg: '#f6ffed' },
    { title: 'Total Customers',   value: stats.totalCustomers,  icon: <UserOutlined />,          color: '#722ed1', bg: '#f9f0ff' },
    { title: 'Total Requests',    value: stats.totalRequests,   icon: <FileTextOutlined />,      color: '#1677ff', bg: '#e6f4ff' },
    { title: 'Fuel Cost (PKR)',   value: stats.totalFuelCost.toLocaleString(), icon: <DollarOutlined />, color: '#fa541c', bg: '#fff2e8' },
  ] : []

  const recentColumns = [
    { title: 'Customer', dataIndex: 'customerName', key: 'customer' },
    { title: 'Pickup',   dataIndex: 'pickupLocation', key: 'pickup' },
    { title: 'Drop',     dataIndex: 'dropLocation',   key: 'drop' },
    { title: 'Date',     dataIndex: 'scheduledDate',  key: 'date', render: (v: string) => new Date(v).toLocaleDateString() },
    { title: 'Status',   dataIndex: 'status',         key: 'status', render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag> },
  ]

  const v = stats?.vehicleUtilization
  const d = stats?.driverStatus

  return (
    <Spin spinning={loading}>
      <Title level={4} style={{ marginBottom: 24 }}>Overview</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((s) => (
          <Col xs={24} sm={12} md={8} lg={6} key={s.title}>
            <Card className="stat-card" style={{ borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <Statistic title={s.title} value={s.value} valueStyle={{ color: s.color, fontSize: 24, fontWeight: 700 }} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Recent Ride Requests" style={{ borderRadius: 12 }}>
            <Table dataSource={recent} columns={recentColumns} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Vehicle Utilization" style={{ borderRadius: 12, marginBottom: 16 }}>
            {v && [
              { label: 'Available',    value: v.available,    color: '#52c41a' },
              { label: 'In Ride',      value: v.inRide,       color: '#1677ff' },
              { label: 'Maintenance',  value: v.maintenance,  color: '#faad14' },
              { label: 'Inactive',     value: v.inactive,     color: '#d9d9d9' },
            ].map((item) => (
              <div key={item.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>{item.label}</Text>
                  <Text strong>{item.value}%</Text>
                </div>
                <Progress percent={item.value} strokeColor={item.color} showInfo={false} size="small" />
              </div>
            ))}
          </Card>
          <Card title="Driver Status" style={{ borderRadius: 12 }}>
            {d && [
              { label: 'Available', count: d.available, color: '#52c41a' },
              { label: 'On Ride',   count: d.onRide,    color: '#1677ff' },
              { label: 'Off Duty',  count: d.offDuty,   color: '#d9d9d9' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                  <Text>{item.label}</Text>
                </div>
                <Text strong>{item.count}</Text>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </Spin>
  )
}
