import { useState } from 'react'
import { Table, Tag, Button, Space, Input, Select, Card, Modal, Form, Descriptions, Typography } from 'antd'
import { SearchOutlined, EyeOutlined, CheckOutlined, CloseOutlined, UserAddOutlined } from '@ant-design/icons'

const { Title } = Typography
const { Option } = Select

const data = [
  { key: 1, customer: 'Ali Raza', phone: '0300-1234567', pickup: 'Gulshan-e-Iqbal', drop: 'Clifton', date: '2026-06-29', time: '09:00 AM', passengers: 3, purpose: 'Office', status: 'PENDING' },
  { key: 2, customer: 'Sara Khan', phone: '0312-9876543', pickup: 'DHA Phase 5', drop: 'Saddar', date: '2026-06-29', time: '10:30 AM', passengers: 1, purpose: 'Meeting', status: 'APPROVED' },
  { key: 3, customer: 'Umar Farooq', phone: '0321-5556789', pickup: 'PECHS Block 6', drop: 'Jinnah Airport', date: '2026-06-28', time: '06:00 AM', passengers: 2, purpose: 'Travel', status: 'ASSIGNED' },
  { key: 4, customer: 'Nadia Ahmed', phone: '0333-1112222', pickup: 'Nazimabad', drop: 'Korangi', date: '2026-06-28', time: '02:00 PM', passengers: 4, purpose: 'Personal', status: 'COMPLETED' },
  { key: 5, customer: 'Bilal Sheikh', phone: '0345-3334444', pickup: 'North Karachi', drop: 'Malir', date: '2026-06-27', time: '08:00 AM', passengers: 2, purpose: 'Office', status: 'REJECTED' },
]

const statusColors: Record<string, string> = {
  PENDING: 'gold', APPROVED: 'blue', ASSIGNED: 'purple', IN_PROGRESS: 'processing', COMPLETED: 'green', REJECTED: 'red',
}

export default function RideRequests() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selected, setSelected] = useState<typeof data[0] | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = data.filter(r =>
    (statusFilter === 'ALL' || r.status === statusFilter) &&
    (r.customer.toLowerCase().includes(search.toLowerCase()) || r.pickup.toLowerCase().includes(search.toLowerCase()))
  )

  const columns = [
    { title: '#', dataIndex: 'key', key: 'key', width: 50 },
    { title: 'Customer', dataIndex: 'customer', key: 'customer' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Pickup', dataIndex: 'pickup', key: 'pickup' },
    { title: 'Drop', dataIndex: 'drop', key: 'drop' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Time', dataIndex: 'time', key: 'time' },
    { title: 'Pax', dataIndex: 'passengers', key: 'passengers', width: 60 },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: typeof data[0]) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setSelected(record); setModalOpen(true) }} />
          {record.status === 'PENDING' && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => alert(`Approved: ${record.customer}`)} />
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => alert(`Rejected: ${record.customer}`)} />
            </>
          )}
          {record.status === 'APPROVED' && (
            <Button size="small" icon={<UserAddOutlined />} onClick={() => alert(`Assign driver to: ${record.customer}`)}>Assign</Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>Ride Requests</Title>

      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search customer or location..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 280 }}
          />
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 160 }}>
            <Option value="ALL">All Status</Option>
            <Option value="PENDING">Pending</Option>
            <Option value="APPROVED">Approved</Option>
            <Option value="ASSIGNED">Assigned</Option>
            <Option value="IN_PROGRESS">In Progress</Option>
            <Option value="COMPLETED">Completed</Option>
            <Option value="REJECTED">Rejected</Option>
          </Select>
        </Space>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={filtered} columns={columns} rowKey="key" size="middle" />
      </Card>

      <Modal title="Request Details" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={600}>
        {selected && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Customer">{selected.customer}</Descriptions.Item>
            <Descriptions.Item label="Phone">{selected.phone}</Descriptions.Item>
            <Descriptions.Item label="Pickup">{selected.pickup}</Descriptions.Item>
            <Descriptions.Item label="Drop">{selected.drop}</Descriptions.Item>
            <Descriptions.Item label="Date">{selected.date}</Descriptions.Item>
            <Descriptions.Item label="Time">{selected.time}</Descriptions.Item>
            <Descriptions.Item label="Passengers">{selected.passengers}</Descriptions.Item>
            <Descriptions.Item label="Purpose">{selected.purpose}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={statusColors[selected.status]}>{selected.status}</Tag></Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
