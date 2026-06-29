import { Table, Tag, Card, Statistic, Row, Col, Typography } from 'antd'
import { CarOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'

const { Title } = Typography

const data = [
  { key: 1, pickup: 'DHA Phase 5', drop: 'Saddar', date: '2026-06-25', driver: 'Ahmed Khan', status: 'COMPLETED' },
  { key: 2, pickup: 'Gulshan', drop: 'Clifton', date: '2026-06-20', driver: 'Rashid Ali', status: 'COMPLETED' },
  { key: 3, pickup: 'PECHS', drop: 'Airport', date: '2026-06-15', driver: 'Tariq Mehmood', status: 'COMPLETED' },
  { key: 4, pickup: 'Nazimabad', drop: 'Korangi', date: '2026-06-10', driver: '-', status: 'CANCELLED' },
  { key: 5, pickup: 'North Karachi', drop: 'Malir', date: '2026-06-05', driver: 'Ahmed Khan', status: 'COMPLETED' },
]

const statusColors: Record<string, string> = { COMPLETED: 'green', CANCELLED: 'red' }

const columns = [
  { title: 'Pickup', dataIndex: 'pickup', key: 'pickup' },
  { title: 'Drop', dataIndex: 'drop', key: 'drop' },
  { title: 'Date', dataIndex: 'date', key: 'date' },
  { title: 'Driver', dataIndex: 'driver', key: 'driver' },
  {
    title: 'Status', dataIndex: 'status', key: 'status',
    render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
  },
]

export default function RideHistory() {
  const completed = data.filter(r => r.status === 'COMPLETED').length
  const cancelled = data.filter(r => r.status === 'CANCELLED').length

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>Ride History</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card style={{ border: '1px solid #ede9fe', textAlign: 'center' }}>
            <Statistic title="Total Rides" value={data.length} prefix={<CarOutlined style={{ color: '#7c3aed' }} />} valueStyle={{ color: '#7c3aed' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ border: '1px solid #ede9fe', textAlign: 'center' }}>
            <Statistic title="Completed" value={completed} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#22c55e' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ border: '1px solid #ede9fe', textAlign: 'center' }}>
            <Statistic title="Cancelled" value={cancelled} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#ef4444' }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ border: '1px solid #ede9fe' }}>
        <Table dataSource={data} columns={columns} rowKey="key" size="middle" />
      </Card>
    </div>
  )
}
