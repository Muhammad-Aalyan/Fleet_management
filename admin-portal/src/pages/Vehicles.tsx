import { useState } from 'react'
import { Table, Tag, Button, Space, Input, Card, Modal, Descriptions, Typography } from 'antd'
import { SearchOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'

const { Title } = Typography

const data = [
  { key: 1, number: 'KHI-001', model: 'Toyota Corolla', year: 2022, capacity: 4, fuelType: 'Petrol', mileage: 45200, status: 'AVAILABLE' },
  { key: 2, number: 'KHI-002', model: 'Honda City', year: 2021, capacity: 4, fuelType: 'Petrol', mileage: 62100, status: 'IN_RIDE' },
  { key: 3, number: 'KHI-003', model: 'Suzuki Cultus', year: 2020, capacity: 4, fuelType: 'CNG', mileage: 89300, status: 'MAINTENANCE' },
  { key: 4, number: 'KHI-004', model: 'Toyota Hiace', year: 2023, capacity: 14, fuelType: 'Diesel', mileage: 21500, status: 'AVAILABLE' },
]

const statusColors: Record<string, string> = { AVAILABLE: 'green', IN_RIDE: 'blue', MAINTENANCE: 'orange', INACTIVE: 'default' }

export default function Vehicles() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<typeof data[0] | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = data.filter(v => v.number.toLowerCase().includes(search.toLowerCase()) || v.model.toLowerCase().includes(search.toLowerCase()))

  const columns = [
    { title: 'Vehicle No', dataIndex: 'number', key: 'number' },
    { title: 'Model', dataIndex: 'model', key: 'model' },
    { title: 'Year', dataIndex: 'year', key: 'year' },
    { title: 'Capacity', dataIndex: 'capacity', key: 'capacity', render: (c: number) => `${c} seats` },
    { title: 'Fuel Type', dataIndex: 'fuelType', key: 'fuelType' },
    { title: 'Mileage (km)', dataIndex: 'mileage', key: 'mileage', render: (m: number) => m.toLocaleString() },
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
        <Title level={4} style={{ margin: 0 }}>Vehicles</Title>
        <Button type="primary" icon={<PlusOutlined />}>Add Vehicle</Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Input placeholder="Search by number or model..." prefix={<SearchOutlined />} value={search} onChange={e => setSearch(e.target.value)} style={{ width: 300 }} />
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={filtered} columns={columns} rowKey="key" size="middle" />
      </Card>

      <Modal title="Vehicle Details" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        {selected && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Vehicle No">{selected.number}</Descriptions.Item>
            <Descriptions.Item label="Model">{selected.model}</Descriptions.Item>
            <Descriptions.Item label="Year">{selected.year}</Descriptions.Item>
            <Descriptions.Item label="Capacity">{selected.capacity} seats</Descriptions.Item>
            <Descriptions.Item label="Fuel Type">{selected.fuelType}</Descriptions.Item>
            <Descriptions.Item label="Current Mileage">{selected.mileage.toLocaleString()} km</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={statusColors[selected.status]}>{selected.status}</Tag></Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
