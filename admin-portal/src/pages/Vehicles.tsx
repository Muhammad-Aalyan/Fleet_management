import { useState, useEffect, useCallback } from 'react'
import { Table, Tag, Button, Space, Input, Card, Modal, Descriptions, Typography, Form, Select, InputNumber, message, Spin, Tooltip } from 'antd'
import { SearchOutlined, EyeOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import api from '../api/axios'

const { Title } = Typography
const { Option } = Select

const statusColors: Record<string, string> = {
  AVAILABLE: 'green', IN_RIDE: 'blue', MAINTENANCE: 'orange', INACTIVE: 'default',
}

interface Vehicle {
  id: number
  vehicleNumber: string
  model: string
  year: number
  capacity: number
  fuelType: string
  currentMileage: number
  status: string
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addForm] = Form.useForm()

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/vehicles')
      setVehicles(res.data)
    } catch { message.error('Failed to load vehicles') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchVehicles() }, [fetchVehicles])

  const handleAdd = async (values: any) => {
    setAddLoading(true)
    try {
      await api.post('/vehicles', {
        vehicleNumber: values.vehicleNumber,
        model: values.model,
        year: values.year,
        capacity: values.capacity,
        fuelType: values.fuelType,
        currentMileage: values.currentMileage ?? 0,
      })
      message.success('Vehicle added successfully')
      setAddOpen(false)
      addForm.resetFields()
      fetchVehicles()
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Failed to add vehicle')
    } finally {
      setAddLoading(false)
    }
  }

  const filtered = vehicles.filter(v =>
    v.vehicleNumber?.toLowerCase().includes(search.toLowerCase()) ||
    v.model?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { title: 'Vehicle No', dataIndex: 'vehicleNumber', key: 'vehicleNumber', render: (v: string) => <strong>{v}</strong> },
    { title: 'Model', dataIndex: 'model', key: 'model' },
    { title: 'Year', dataIndex: 'year', key: 'year', width: 70 },
    { title: 'Capacity', dataIndex: 'capacity', key: 'capacity', render: (c: number) => `${c} seats`, width: 90 },
    { title: 'Fuel Type', dataIndex: 'fuelType', key: 'fuelType', width: 90 },
    { title: 'Mileage (km)', dataIndex: 'currentMileage', key: 'currentMileage', render: (m: number) => m?.toLocaleString() ?? 0 },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={statusColors[s]}>{s?.replace('_', ' ')}</Tag>,
    },
    {
      title: 'Actions', key: 'actions', width: 80,
      render: (_: unknown, v: Vehicle) => (
        <Tooltip title="View Details">
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setDetailVehicle(v); setDetailOpen(true) }} />
        </Tooltip>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Vehicles</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchVehicles}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>Add Vehicle</Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Input placeholder="Search by number or model..." prefix={<SearchOutlined />}
          value={search} onChange={e => setSearch(e.target.value)} style={{ width: 300 }} />
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Spin spinning={loading}>
          <Table dataSource={filtered} columns={columns} rowKey="id" size="middle"
            pagination={{ pageSize: 10, showTotal: t => `${t} vehicles` }} />
        </Spin>
      </Card>

      {/* Detail Modal */}
      <Modal title="Vehicle Details" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null}>
        {detailVehicle && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Vehicle No">{detailVehicle.vehicleNumber}</Descriptions.Item>
            <Descriptions.Item label="Model">{detailVehicle.model}</Descriptions.Item>
            <Descriptions.Item label="Year">{detailVehicle.year}</Descriptions.Item>
            <Descriptions.Item label="Capacity">{detailVehicle.capacity} seats</Descriptions.Item>
            <Descriptions.Item label="Fuel Type">{detailVehicle.fuelType}</Descriptions.Item>
            <Descriptions.Item label="Current Mileage">{detailVehicle.currentMileage?.toLocaleString()} km</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[detailVehicle.status]}>{detailVehicle.status?.replace('_', ' ')}</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Add Vehicle Modal */}
      <Modal
        title="Add New Vehicle"
        open={addOpen}
        onCancel={() => { setAddOpen(false); addForm.resetFields() }}
        onOk={() => addForm.submit()}
        okText="Add Vehicle"
        confirmLoading={addLoading}
        width={520}
      >
        <Form form={addForm} layout="vertical" onFinish={handleAdd} style={{ marginTop: 16 }}>
          <Form.Item name="vehicleNumber" label="Vehicle Number"
            rules={[{ required: true, message: 'Enter vehicle number (e.g. KHI-001)' }]}>
            <Input placeholder="e.g. KHI-001" size="large" />
          </Form.Item>
          <Form.Item name="model" label="Model"
            rules={[{ required: true, message: 'Enter vehicle model' }]}>
            <Input placeholder="e.g. Toyota Corolla" size="large" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="year" label="Year" style={{ flex: 1 }}
              rules={[{ required: true, message: 'Enter year' }]}>
              <InputNumber min={2000} max={2030} style={{ width: '100%' }} size="large" placeholder="2024" />
            </Form.Item>
            <Form.Item name="capacity" label="Capacity (seats)" style={{ flex: 1 }}
              rules={[{ required: true, message: 'Enter capacity' }]}>
              <InputNumber min={1} max={50} style={{ width: '100%' }} size="large" placeholder="4" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="fuelType" label="Fuel Type" style={{ flex: 1 }}
              rules={[{ required: true, message: 'Select fuel type' }]}>
              <Select size="large" placeholder="Select fuel type">
                <Option value="Petrol">Petrol</Option>
                <Option value="Diesel">Diesel</Option>
                <Option value="CNG">CNG</Option>
                <Option value="Electric">Electric</Option>
                <Option value="Hybrid">Hybrid</Option>
              </Select>
            </Form.Item>
            <Form.Item name="currentMileage" label="Current Mileage (km)" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} size="large" placeholder="0" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}
