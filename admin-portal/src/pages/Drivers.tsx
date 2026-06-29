import { useState } from 'react'
import { Table, Tag, Button, Space, Input, Card, Modal, Form, Descriptions, Avatar, Typography } from 'antd'
import { SearchOutlined, EyeOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons'

const { Title } = Typography

const data = [
  { key: 1, name: 'Ahmed Khan', cnic: '42101-1234567-1', phone: '0300-1111111', license: 'LIC-001', expiry: '2027-12-31', vehicle: 'KHI-001', status: 'AVAILABLE' },
  { key: 2, name: 'Rashid Ali', cnic: '42101-2345678-2', phone: '0312-2222222', license: 'LIC-002', expiry: '2026-08-15', vehicle: 'KHI-002', status: 'ON_RIDE' },
  { key: 3, name: 'Tariq Mehmood', cnic: '42201-3456789-3', phone: '0321-3333333', license: 'LIC-003', expiry: '2025-03-20', vehicle: 'KHI-003', status: 'OFF_DUTY' },
  { key: 4, name: 'Kamran Baig', cnic: '42101-4567890-4', phone: '0333-4444444', license: 'LIC-004', expiry: '2028-06-10', vehicle: 'KHI-004', status: 'AVAILABLE' },
]

const statusColors: Record<string, string> = { AVAILABLE: 'green', ON_RIDE: 'blue', OFF_DUTY: 'default' }

export default function Drivers() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<typeof data[0] | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = data.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.cnic.includes(search))

  const columns = [
    {
      title: 'Driver', key: 'driver',
      render: (_: unknown, r: typeof data[0]) => (
        <Space><Avatar icon={<UserOutlined />} style={{ background: '#1677ff' }} />{r.name}</Space>
      ),
    },
    { title: 'CNIC', dataIndex: 'cnic', key: 'cnic' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'License', dataIndex: 'license', key: 'license' },
    { title: 'Expiry', dataIndex: 'expiry', key: 'expiry' },
    { title: 'Vehicle', dataIndex: 'vehicle', key: 'vehicle' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={statusColors[s]}>{s.replace('_', ' ')}</Tag>,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: typeof data[0]) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => { setSelected(record); setModalOpen(true) }} />
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Drivers</Title>
        <Button type="primary" icon={<PlusOutlined />}>Add Driver</Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Input placeholder="Search by name or CNIC..." prefix={<SearchOutlined />} value={search} onChange={e => setSearch(e.target.value)} style={{ width: 300 }} />
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={filtered} columns={columns} rowKey="key" size="middle" />
      </Card>

      <Modal title="Driver Details" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        {selected && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Name">{selected.name}</Descriptions.Item>
            <Descriptions.Item label="CNIC">{selected.cnic}</Descriptions.Item>
            <Descriptions.Item label="Phone">{selected.phone}</Descriptions.Item>
            <Descriptions.Item label="License No">{selected.license}</Descriptions.Item>
            <Descriptions.Item label="License Expiry">{selected.expiry}</Descriptions.Item>
            <Descriptions.Item label="Assigned Vehicle">{selected.vehicle}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={statusColors[selected.status]}>{selected.status}</Tag></Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
