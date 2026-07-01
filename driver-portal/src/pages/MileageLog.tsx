import { Table, Card, Typography, message, Spin, Tag, Button, Modal, Form, InputNumber, Select } from 'antd'
import { useEffect, useState, useCallback } from 'react'
import { ArrowRightOutlined, TeamOutlined, UserOutlined, PlusOutlined, DashboardOutlined } from '@ant-design/icons'
import api from '../api/axios'

const { Title, Text } = Typography

const MANUAL_REASONS = [
  { value: 'OFFICE_WORK',  label: 'Office Work' },
  { value: 'MAINTENANCE',  label: 'Vehicle Maintenance' },
  { value: 'DELIVERY',     label: 'Delivery' },
  { value: 'PERSONAL',     label: 'Personal Use' },
  { value: 'OTHER',        label: 'Other' },
]

const reasonLabel = (r: string) => MANUAL_REASONS.find(m => m.value === r)?.label ?? r

interface MileageEntry {
  id: number
  startMileage: number
  endMileage: number
  createdAt: string
  reason?: string
  isManual?: boolean
  pickupLocation?: string
  dropLocation?: string
  scheduledDate?: string
  customers?: { name: string; passengers: number | null }[]
}

export default function MileageLog() {
  const [data, setData] = useState<MileageEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/mileage/my')
      setData(res.data)
    } catch { message.error('Failed to load mileage logs') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const handleAddEntry = async (values: any) => {
    setSubmitting(true)
    try {
      await api.post('/mileage', {
        startMileage: values.startMileage,
        endMileage: values.endMileage,
        reason: values.reason,
      })
      message.success('Mileage entry added!')
      setModalOpen(false)
      form.resetFields()
      fetchLogs()
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed to add entry') }
    finally { setSubmitting(false) }
  }

  const columns = [
    {
      title: 'Route / Purpose',
      key: 'route',
      render: (_: any, r: MileageEntry) => {
        if (r.isManual || r.pickupLocation === 'Others') {
          return (
            <div>
              <Tag color="purple">Others</Tag>
              {r.reason && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{reasonLabel(r.reason)}</div>}
            </div>
          )
        }
        return r.pickupLocation ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <strong>{r.pickupLocation}</strong>
            <ArrowRightOutlined style={{ color: '#f97316', fontSize: 11 }} />
            <strong>{r.dropLocation}</strong>
          </span>
        ) : <Text type="secondary">—</Text>
      },
    },
    {
      title: 'Driver / Customer(s)',
      key: 'customers',
      render: (_: any, r: MileageEntry) => {
        if (!r.customers || r.customers.length === 0) return <Text type="secondary">—</Text>
        const isManual = r.isManual || r.pickupLocation === 'Others'
        const shared = !isManual && r.customers.length > 1
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {shared && <Tag color="orange" icon={<TeamOutlined />} style={{ marginBottom: 4, width: 'fit-content' }}>Shared Ride</Tag>}
            {isManual && <Tag color="purple" style={{ marginBottom: 4, width: 'fit-content' }}>Driver Entry</Tag>}
            {r.customers.map((c, i) => (
              <span key={i} style={{ fontSize: 13 }}>
                <UserOutlined style={{ marginRight: 4, color: '#9ca3af' }} />
                {c.name}
                {c.passengers !== null && <Text type="secondary"> ({c.passengers} pax)</Text>}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      title: 'Start (km)',
      dataIndex: 'startMileage',
      key: 'start',
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: 'End (km)',
      dataIndex: 'endMileage',
      key: 'end',
      render: (v: number, r: MileageEntry) => v === r.startMileage
        ? <Text type="secondary">Pending</Text>
        : v.toLocaleString(),
    },
    {
      title: 'Distance',
      key: 'distance',
      render: (_: any, r: MileageEntry) => {
        const d = r.endMileage - r.startMileage
        return d > 0 ? <Tag color="green">{d.toLocaleString()} km</Tag> : <Text type="secondary">—</Text>
      },
    },
    {
      title: 'Date',
      key: 'date',
      render: (_: any, r: MileageEntry) => new Date(r.createdAt).toLocaleDateString(),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>Mileage Log</Title>
          <Text style={{ color: '#6b7280', fontSize: 13 }}>Ride mileage auto-logged · Add manual entries for other trips</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />}
          style={{ background: '#f97316', border: 'none' }}
          onClick={() => setModalOpen(true)}>
          Add Entry
        </Button>
      </div>

      <Spin spinning={loading}>
        <Card style={{ borderRadius: 12, border: '1px solid #2a2a3f', background: '#1e1e2e' }}>
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            size="middle"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'No mileage entries yet.' }}
          />
        </Card>
      </Spin>

      {/* Manual Entry Modal */}
      <Modal
        title={<span><DashboardOutlined style={{ color: '#f97316', marginRight: 8 }} />Add Mileage Entry</span>}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        footer={null}
      >
        <Text style={{ color: '#6b7280', fontSize: 13, display: 'block', marginBottom: 16 }}>
          Log mileage for trips taken outside of assigned rides (office runs, maintenance, etc.)
        </Text>
        <Form form={form} layout="vertical" onFinish={handleAddEntry}>
          <Form.Item label="Reason for Trip" name="reason" rules={[{ required: true, message: 'Select a reason' }]}>
            <Select placeholder="Select reason" options={MANUAL_REASONS} />
          </Form.Item>
          <Form.Item label="Start Mileage (km)" name="startMileage" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} addonAfter="km" placeholder="e.g. 45,200" />
          </Form.Item>
          <Form.Item label="End Mileage (km)" name="endMileage" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} addonAfter="km" placeholder="e.g. 45,350" />
          </Form.Item>
          <Button htmlType="submit" type="primary" block loading={submitting}
            style={{ background: '#f97316', border: 'none', height: 42, fontWeight: 600 }}>
            Save Entry
          </Button>
        </Form>
      </Modal>
    </div>
  )
}
