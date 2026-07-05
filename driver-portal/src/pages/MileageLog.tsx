import { Table, Card, message, Spin, Button, Modal, Form, InputNumber, Select } from 'antd'
import { useEffect, useState, useCallback } from 'react'
import { PlusOutlined, DashboardOutlined } from '@ant-design/icons'
import api from '../api/axios'

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
              <span className="rd-badge rd-b-merged">Others</span>
              {r.reason && <div className="rd-cell-sub" style={{ marginTop: 4 }}>{reasonLabel(r.reason)}</div>}
            </div>
          )
        }
        return r.pickupLocation ? (
          <span className="rd-cell-strong" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {r.pickupLocation}
            <span style={{ color: 'var(--rd-red)' }}>→</span>
            {r.dropLocation}
          </span>
        ) : <span className="rd-cell-sub">—</span>
      },
    },
    {
      title: 'Driver / Customer(s)',
      key: 'customers',
      render: (_: any, r: MileageEntry) => {
        if (!r.customers || r.customers.length === 0) return <span className="rd-cell-sub">—</span>
        const isManual = r.isManual || r.pickupLocation === 'Others'
        const shared = !isManual && r.customers.length > 1
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {shared && <span className="rd-badge rd-b-shared" style={{ marginBottom: 4, width: 'fit-content' }}>Shared Ride</span>}
            {isManual && <span className="rd-badge rd-b-merged" style={{ marginBottom: 4, width: 'fit-content' }}>Driver Entry</span>}
            {r.customers.map((c, i) => (
              <span key={i} className="rd-driver-line">
                👤 {c.name}
                {c.passengers !== null && <span className="rd-cell-sub"> ({c.passengers} pax)</span>}
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
        ? <span className="rd-cell-sub">Pending</span>
        : v.toLocaleString(),
    },
    {
      title: 'Distance',
      key: 'distance',
      render: (_: any, r: MileageEntry) => {
        const d = r.endMileage - r.startMileage
        return d > 0 ? <span className="rd-badge rd-b-distance">{d.toLocaleString()} km</span> : <span className="rd-cell-sub">—</span>
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
      <div className="rd-row-between">
        <div>
          <div className="rd-page-title" style={{ margin: '0 0 4px' }}>Mileage Log</div>
          <div className="rd-page-sub" style={{ margin: 0 }}>Ride mileage auto-logged · Add manual entries for other trips</div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Add Entry
        </Button>
      </div>

      <Spin spinning={loading}>
        <Card>
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            size="middle"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'No mileage entries yet.' }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </Spin>

      {/* Manual Entry Modal */}
      <Modal
        title={<span><DashboardOutlined style={{ color: '#E01E2B', marginRight: 8 }} />Add Mileage Entry</span>}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        footer={null}
      >
        <p style={{ color: 'var(--rd-ink-soft)', fontSize: 13, marginBottom: 16 }}>
          Log mileage for trips taken outside of assigned rides (office runs, maintenance, etc.)
        </p>
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
            style={{ height: 42, fontWeight: 600 }}>
            Save Entry
          </Button>
        </Form>
      </Modal>
    </div>
  )
}
