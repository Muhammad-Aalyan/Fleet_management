import { Row, Col, Card, Statistic, Table, Tag, Typography, Progress } from 'antd'
import {
  CarOutlined, TeamOutlined, UserOutlined, FileTextOutlined,
  ThunderboltOutlined, CheckCircleOutlined, ClockCircleOutlined, DollarOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

const stats = [
  { title: 'Total Drivers', value: 24, icon: <TeamOutlined />, color: '#1677ff', bg: '#e6f4ff' },
  { title: 'Total Vehicles', value: 18, icon: <CarOutlined />, color: '#52c41a', bg: '#f6ffed' },
  { title: 'Pending Requests', value: 7, icon: <ClockCircleOutlined />, color: '#faad14', bg: '#fffbe6' },
  { title: 'Active Rides', value: 5, icon: <ThunderboltOutlined />, color: '#f5222d', bg: '#fff1f0' },
  { title: 'Completed Today', value: 12, icon: <CheckCircleOutlined />, color: '#52c41a', bg: '#f6ffed' },
  { title: 'Total Customers', value: 89, icon: <UserOutlined />, color: '#722ed1', bg: '#f9f0ff' },
  { title: 'Total Requests', value: 143, icon: <FileTextOutlined />, color: '#1677ff', bg: '#e6f4ff' },
  { title: 'Fuel Cost (PKR)', value: '48,500', icon: <DollarOutlined />, color: '#fa541c', bg: '#fff2e8' },
]

const recentRequests = [
  { key: 1, customer: 'Ali Raza', pickup: 'Gulshan', drop: 'Clifton', date: '2026-06-29', status: 'PENDING' },
  { key: 2, customer: 'Sara Khan', pickup: 'DHA', drop: 'Saddar', date: '2026-06-29', status: 'APPROVED' },
  { key: 3, customer: 'Umar Farooq', pickup: 'PECHS', drop: 'Airport', date: '2026-06-28', status: 'ASSIGNED' },
  { key: 4, customer: 'Nadia Ahmed', pickup: 'Nazimabad', drop: 'Korangi', date: '2026-06-28', status: 'COMPLETED' },
  { key: 5, customer: 'Bilal Sheikh', pickup: 'North Karachi', drop: 'Malir', date: '2026-06-27', status: 'REJECTED' },
]

const statusColors: Record<string, string> = {
  PENDING: 'gold', APPROVED: 'blue', ASSIGNED: 'purple',
  IN_PROGRESS: 'processing', COMPLETED: 'green', REJECTED: 'red',
}

const columns = [
  { title: 'Customer', dataIndex: 'customer', key: 'customer' },
  { title: 'Pickup', dataIndex: 'pickup', key: 'pickup' },
  { title: 'Drop', dataIndex: 'drop', key: 'drop' },
  { title: 'Date', dataIndex: 'date', key: 'date' },
  {
    title: 'Status', dataIndex: 'status', key: 'status',
    render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
  },
]

export default function Dashboard() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>Overview</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((s) => (
          <Col xs={24} sm={12} md={8} lg={6} key={s.title}>
            <Card className="stat-card" style={{ borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                  {s.icon}
                </div>
                <Statistic title={s.title} value={s.value} valueStyle={{ color: s.color, fontSize: 24, fontWeight: 700 }} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Recent Ride Requests" style={{ borderRadius: 12 }}>
            <Table dataSource={recentRequests} columns={columns} pagination={false} size="small" />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Vehicle Utilization" style={{ borderRadius: 12, marginBottom: 16 }}>
            {[
              { label: 'Available', value: 55, color: '#52c41a' },
              { label: 'In Ride', value: 28, color: '#1677ff' },
              { label: 'Maintenance', value: 11, color: '#faad14' },
              { label: 'Inactive', value: 6, color: '#d9d9d9' },
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
            {[
              { label: 'Available', count: 10, color: '#52c41a' },
              { label: 'On Ride', count: 8, color: '#1677ff' },
              { label: 'Off Duty', count: 6, color: '#d9d9d9' },
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
    </div>
  )
}
