import { Table, Tag, Card, Badge, Typography } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'

const { Title } = Typography

const data = [
  { key: 1, customer: 'Sara Khan', driver: 'Ahmed Khan', vehicle: 'KHI-001', pickup: 'DHA Phase 5', drop: 'Saddar', started: '10:45 AM', passengers: 1 },
  { key: 2, customer: 'Umar Farooq', driver: 'Rashid Ali', vehicle: 'KHI-002', pickup: 'PECHS Block 6', drop: 'Airport', started: '06:10 AM', passengers: 2 },
  { key: 3, customer: 'Kamran Siddiqui', driver: 'Tariq Mehmood', vehicle: 'KHI-005', pickup: 'Gulshan', drop: 'Korangi', started: '11:20 AM', passengers: 3 },
]

const columns = [
  { title: 'Customer', dataIndex: 'customer', key: 'customer' },
  { title: 'Driver', dataIndex: 'driver', key: 'driver' },
  { title: 'Vehicle', dataIndex: 'vehicle', key: 'vehicle' },
  { title: 'Pickup', dataIndex: 'pickup', key: 'pickup' },
  { title: 'Drop', dataIndex: 'drop', key: 'drop' },
  { title: 'Started', dataIndex: 'started', key: 'started' },
  { title: 'Pax', dataIndex: 'passengers', key: 'passengers' },
  {
    title: 'Status', key: 'status',
    render: () => <Tag color="processing" icon={<ThunderboltOutlined />}>IN PROGRESS</Tag>,
  },
]

export default function ActiveRides() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Active Rides</Title>
        <Badge count={data.length} style={{ background: '#f5222d' }} />
      </div>
      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={data} columns={columns} rowKey="key" size="middle" />
      </Card>
    </div>
  )
}
