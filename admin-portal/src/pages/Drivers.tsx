import { useEffect, useState } from 'react'
import {
  Table, Tag, Button, Input, Card, Modal, Form, Descriptions,
  Avatar, Typography, Spin, Select, DatePicker, message, Popconfirm,
} from 'antd'
import { SearchOutlined, EyeOutlined, PlusOutlined, UserOutlined, EditOutlined } from '@ant-design/icons'
import api from '../api/axios'

const { Title, Text } = Typography

const statusColors: Record<string, string> = { AVAILABLE: 'green', ON_RIDE: 'blue', OFF_DUTY: 'default' }

interface Driver {
  id: number; name: string; phone: string; cnic: string
  licenseNumber: string; licenseExpiry: string; status: string
  createdAt: string
  user: { email: string; isActive: boolean }
  vehicle: { id: number; vehicleNumber: string; model: string } | null
}

interface Vehicle { id: number; vehicleNumber: string; model: string }

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewDriver, setViewDriver] = useState<Driver | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editDriver, setEditDriver] = useState<Driver | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [d, v] = await Promise.all([api.get('/drivers'), api.get('/vehicles')])
      setDrivers(d.data)
      setVehicles(v.data)
    } catch { }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const filtered = drivers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.cnic.includes(search) ||
    d.user?.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async (values: any) => {
    setSubmitting(true)
    try {
      await api.post('/drivers', {
        ...values,
        licenseExpiry: values.licenseExpiry?.format('YYYY-MM-DD'),
      })
      message.success('Driver added successfully')
      setAddOpen(false)
      addForm.resetFields()
      fetchAll()
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Failed to add driver')
    } finally { setSubmitting(false) }
  }

  const handleEdit = async (values: any) => {
    if (!editDriver) return
    setSubmitting(true)
    try {
      await api.patch(`/drivers/${editDriver.id}`, {
        ...values,
        licenseExpiry: values.licenseExpiry ? values.licenseExpiry.format('YYYY-MM-DD') : undefined,
      })
      message.success('Driver updated')
      setEditOpen(false)
      editForm.resetFields()
      fetchAll()
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Failed to update driver')
    } finally { setSubmitting(false) }
  }

  const openEdit = (driver: Driver) => {
    setEditDriver(driver)
    editForm.setFieldsValue({
      name: driver.name,
      phone: driver.phone,
      cnic: driver.cnic,
      licenseNumber: driver.licenseNumber,
      status: driver.status,
      vehicleId: driver.vehicle?.id ?? undefined,
    })
    setEditOpen(true)
  }

  const isExpired = (date: string) => new Date(date) < new Date()

  const columns = [
    {
      title: 'Driver', key: 'driver',
      render: (_: any, r: Driver) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar icon={<UserOutlined />} style={{ background: '#1677ff', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600 }}>{r.name}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{r.user?.email}</div>
          </div>
        </div>
      ),
    },
    { title: 'CNIC', dataIndex: 'cnic', key: 'cnic' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'License No', dataIndex: 'licenseNumber', key: 'license' },
    {
      title: 'Expiry', dataIndex: 'licenseExpiry', key: 'expiry',
      render: (v: string) => (
        <span style={{ color: isExpired(v) ? '#ef4444' : '#374151' }}>
          {new Date(v).toLocaleDateString()}
          {isExpired(v) && <Tag color="red" style={{ marginLeft: 6, fontSize: 10 }}>Expired</Tag>}
        </span>
      ),
    },
    {
      title: 'Vehicle', key: 'vehicle',
      render: (_: any, r: Driver) => r.vehicle
        ? <Tag color="blue">{r.vehicle.vehicleNumber}</Tag>
        : <Text type="secondary">—</Text>,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={statusColors[s] ?? 'default'}>{s.replace('_', ' ')}</Tag>,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, r: Driver) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setViewDriver(r)} />
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
        </div>
      ),
    },
  ]

  const AddDriverForm = ({ form, onFinish }: { form: any; onFinish: (v: any) => void }) => (
    <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <Form.Item label="Full Name" name="name" rules={[{ required: true }]}>
          <Input placeholder="Ahmed Khan" />
        </Form.Item>
        <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
          <Input placeholder="0300-1234567" />
        </Form.Item>
        <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
          <Input placeholder="driver@fleet.com" />
        </Form.Item>
        <Form.Item label="Password" name="password" rules={[{ required: true, min: 6 }]}>
          <Input.Password placeholder="Min 6 characters" />
        </Form.Item>
        <Form.Item label="CNIC" name="cnic" rules={[{ required: true }]}>
          <Input placeholder="42101-1234567-1" />
        </Form.Item>
        <Form.Item label="License Number" name="licenseNumber" rules={[{ required: true }]}>
          <Input placeholder="LIC-001" />
        </Form.Item>
        <Form.Item label="License Expiry" name="licenseExpiry" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Assign Vehicle (optional)" name="vehicleId">
          <Select placeholder="Select vehicle" allowClear
            options={vehicles.map(v => ({ value: v.id, label: `${v.vehicleNumber} — ${v.model}` }))}
          />
        </Form.Item>
      </div>
      <Button htmlType="submit" type="primary" block loading={submitting} style={{ marginTop: 4, height: 42 }}>
        Add Driver
      </Button>
    </Form>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Drivers</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
          Add Driver
        </Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Input
          placeholder="Search by name, CNIC or email..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 320 }}
        />
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Spin spinning={loading}>
          <Table dataSource={filtered} columns={columns} rowKey="id" size="middle" />
        </Spin>
      </Card>

      {/* View Modal */}
      <Modal title="Driver Details" open={!!viewDriver} onCancel={() => setViewDriver(null)} footer={null} width={520}>
        {viewDriver && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Avatar size={56} icon={<UserOutlined />} style={{ background: '#1677ff' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{viewDriver.name}</div>
                <div style={{ color: '#6b7280', fontSize: 13 }}>{viewDriver.user?.email}</div>
                <Tag color={statusColors[viewDriver.status]} style={{ marginTop: 4 }}>{viewDriver.status.replace('_', ' ')}</Tag>
              </div>
            </div>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="CNIC">{viewDriver.cnic}</Descriptions.Item>
              <Descriptions.Item label="Phone">{viewDriver.phone}</Descriptions.Item>
              <Descriptions.Item label="License No">{viewDriver.licenseNumber}</Descriptions.Item>
              <Descriptions.Item label="License Expiry">
                <span style={{ color: isExpired(viewDriver.licenseExpiry) ? '#ef4444' : undefined }}>
                  {new Date(viewDriver.licenseExpiry).toLocaleDateString()}
                  {isExpired(viewDriver.licenseExpiry) && <Tag color="red" style={{ marginLeft: 8 }}>Expired</Tag>}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Assigned Vehicle">
                {viewDriver.vehicle ? `${viewDriver.vehicle.vehicleNumber} — ${viewDriver.vehicle.model}` : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Account Active">
                <Tag color={viewDriver.user?.isActive ? 'green' : 'red'}>
                  {viewDriver.user?.isActive ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Joined">
                {new Date(viewDriver.createdAt).toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* Add Driver Modal */}
      <Modal
        title={<span><PlusOutlined style={{ marginRight: 8 }} />Add New Driver</span>}
        open={addOpen}
        onCancel={() => { setAddOpen(false); addForm.resetFields() }}
        footer={null}
        width={620}
      >
        <AddDriverForm form={addForm} onFinish={handleAdd} />
      </Modal>

      {/* Edit Driver Modal */}
      <Modal
        title={<span><EditOutlined style={{ marginRight: 8 }} />Edit Driver — {editDriver?.name}</span>}
        open={editOpen}
        onCancel={() => { setEditOpen(false); editForm.resetFields() }}
        footer={null}
        width={520}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit} style={{ marginTop: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label="Full Name" name="name"><Input /></Form.Item>
            <Form.Item label="Phone" name="phone"><Input /></Form.Item>
            <Form.Item label="CNIC" name="cnic"><Input /></Form.Item>
            <Form.Item label="License Number" name="licenseNumber"><Input /></Form.Item>
            <Form.Item label="License Expiry" name="licenseExpiry">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Status" name="status">
              <Select options={[
                { value: 'AVAILABLE', label: 'Available' },
                { value: 'ON_RIDE', label: 'On Ride' },
                { value: 'OFF_DUTY', label: 'Off Duty' },
              ]} />
            </Form.Item>
          </div>
          <Form.Item label="Assign Vehicle" name="vehicleId">
            <Select placeholder="Select vehicle" allowClear
              options={vehicles.map(v => ({ value: v.id, label: `${v.vehicleNumber} — ${v.model}` }))}
            />
          </Form.Item>
          <Button htmlType="submit" type="primary" block loading={submitting} style={{ height: 42 }}>
            Save Changes
          </Button>
        </Form>
      </Modal>
    </div>
  )
}
