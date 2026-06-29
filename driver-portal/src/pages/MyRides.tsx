import { Table, Tag, Button, Space, Card, Typography, Select } from 'antd'
import { useState } from 'react'
import { CheckOutlined, PlayCircleOutlined } from '@ant-design/icons'

const { Title } = Typography
const { Option } = Select

const data = [
  { key: 1, customer: 'Sara Khan', pickup: 'DHA Phase 5', drop: 'Saddar', date: '2026-06-29', time: '10:30 AM', passengers: 1, status: 'IN_PROGRESS' },
  { key: 2, customer: 'Ali Raza', pickup: 'Gulshan', drop: 'Clifton', date: '2026-06-29', time: '02:00 PM', passengers: 3, status: 'ASSIGNED' },
  { key: 3, customer: 'Umar Farooq', pickup: 'PECHS', drop: 'Airport', date: '2026-06-28', time: '06:00 AM', passengers: 2, status: 'COMPLETED' },
  { key: 4, customer: 'Nadia Ahmed', pickup: 'Nazimabad', drop: 'Korangi', date: '2026-06-27', time: '11:00 AM', passengers: 4, status: 'COMPLETED' },
]

const statusColors: Record<string, string> = { ASSIGNED: 'blue', IN_PROGRESS: 'orange', COMPLETED: 'green' }

export default function MyRides() {
  const [filter, setFilter] = useState('ALL')

  const filtered = data.filter(r => filter === 'ALL' || r.status === filter)

  const columns = [
    { title: 'Customer', dataIndex: 'customer', key: 'customer' },
    { title: 'Pickup', dataIndex: 'pickup', key: 'pickup' },
    { title: 'Drop', dataIndex: 'drop', key: 'drop' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Time', dataIndex: 'time', key: 'time' },
    { title: 'Pax', dataIndex: 'passengers', key: 'passengers', width: 60 },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={statusColors[s]}>{s.replace('_', ' ')}</Tag>,
    },
    {
      title: 'Action', key: 'action',
      render: (_: unknown, r: typeof data[0]) => (
        <Space>
          {r.status === 'ASSIGNED' && <Button size="small" type="primary" icon={<PlayCircleOutlined />} style={{ background: '#f97316', border: 'none' }}>Start</Button>}
          {r.status === 'IN_PROGRESS' && <Button size="small" icon={<CheckOutlined />} style={{ color: '#22c55e', borderColor: '#22c55e' }}>Complete</Button>}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ color: '#fff', marginBottom: 24 }}>My Rides</Title>
      <Card style={{ borderRadius: 12, border: '1px solid #2a2a3f', background: '#1e1e2e', marginBottom: 16 }}>
        <Select value={filter} onChange={setFilter} style={{ width: 180 }}>
          <Option value="ALL">All Rides</Option>
          <Option value="ASSIGNED">Assigned</Option>
          <Option value="IN_PROGRESS">In Progress</Option>
          <Option value="COMPLETED">Completed</Option>
        </Select>
      </Card>
      <Card style={{ borderRadius: 12, border: '1px solid #2a2a3f', background: '#1e1e2e' }}>
        <Table dataSource={filtered} columns={columns} rowKey="key" size="middle" />
      </Card>
    </div>
  )
}
