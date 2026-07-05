import { useEffect, useState, useRef } from 'react'
import { Table, Card, Button, Form, InputNumber, Modal, message, Select } from 'antd'
import { PlusOutlined, UploadOutlined, CarOutlined, FileImageOutlined } from '@ant-design/icons'
import api from '../api/axios'

interface Vehicle { id: number; vehicleNumber: string; model: string; fuelType: string }
interface FuelEntry {
  id: number; liters: number; amount: number; currentMileage: number
  receiptPhoto: string | null; createdAt: string
  vehicle: Vehicle; driver: { name: string }
}

export default function FuelLog() {
  const [data, setData] = useState<FuelEntry[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null)
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null)
  const [form] = Form.useForm()
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [logs, vehs] = await Promise.all([
        api.get('/fuel/my'),
        api.get('/vehicles'),
      ])
      setData(logs.data)
      setVehicles(vehs.data)
    } catch { }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { message.error('Receipt must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = () => setReceiptBase64(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (values: any) => {
    setSubmitting(true)
    try {
      await api.post('/fuel', {
        vehicleId: values.vehicleId,
        liters: values.liters,
        amount: values.amount,
        currentMileage: values.currentMileage,
        receiptPhoto: receiptBase64 ?? undefined,
      })
      message.success('Fuel entry added!')
      setOpen(false)
      form.resetFields()
      setReceiptBase64(null)
      if (fileRef.current) fileRef.current.value = ''
      fetchData()
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed to add entry') }
    finally { setSubmitting(false) }
  }

  const columns = [
    {
      title: 'Vehicle', key: 'vehicle',
      render: (_: any, r: FuelEntry) => (
        <div>
          <div className="rd-cell-strong" style={{ color: 'var(--rd-red)' }}><CarOutlined style={{ marginRight: 4 }} />{r.vehicle?.vehicleNumber}</div>
          <div className="rd-cell-sub">{r.vehicle?.model} · {r.vehicle?.fuelType}</div>
        </div>
      ),
    },
    { title: 'Liters', dataIndex: 'liters', key: 'liters', render: (v: number) => `${v} L` },
    { title: 'Amount (PKR)', dataIndex: 'amount', key: 'amount', className: 'rd-cell-strong', render: (v: number) => `PKR ${v.toLocaleString()}` },
    { title: 'Mileage (km)', dataIndex: 'currentMileage', key: 'mileage', render: (v: number) => v.toLocaleString() },
    {
      title: 'Receipt', key: 'receipt',
      render: (_: any, r: FuelEntry) => r.receiptPhoto
        ? <Button size="small" icon={<FileImageOutlined />} onClick={() => setPreviewReceipt(r.receiptPhoto)}>View</Button>
        : <span className="rd-badge rd-b-rejected">None</span>,
    },
    { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (v: string) => new Date(v).toLocaleDateString() },
  ]

  return (
    <div>
      <div className="rd-row-between">
        <div className="rd-page-title" style={{ margin: 0 }}>Fuel Log</div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Add Entry
        </Button>
      </div>

      <Card>
        <Table dataSource={data} columns={columns} rowKey="id" size="middle" loading={loading} scroll={{ x: 'max-content' }} />
      </Card>

      {/* Add Entry Modal */}
      <Modal title="Add Fuel Entry" open={open} onCancel={() => { setOpen(false); form.resetFields(); setReceiptBase64(null) }} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item label="Vehicle" name="vehicleId" rules={[{ required: true, message: 'Select a vehicle' }]}>
            <Select placeholder="Select vehicle being refuelled" showSearch optionFilterProp="label"
              options={vehicles.map(v => ({ value: v.id, label: `${v.vehicleNumber} — ${v.model} (${v.fuelType})` }))}
            />
          </Form.Item>
          <Form.Item label="Liters Filled" name="liters" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} addonAfter="L" />
          </Form.Item>
          <Form.Item label="Amount (PKR)" name="amount" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} addonBefore="PKR" />
          </Form.Item>
          <Form.Item label="Current Mileage (km)" name="currentMileage" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} addonAfter="km" />
          </Form.Item>
          <Form.Item label="Receipt Photo (optional)">
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <Button icon={<UploadOutlined />} onClick={() => fileRef.current?.click()}>
              {receiptBase64 ? 'Receipt Selected ✓' : 'Upload Receipt Photo'}
            </Button>
            {receiptBase64 && (
              <div style={{ marginTop: 8 }}>
                <img src={receiptBase64} alt="receipt preview" style={{ maxHeight: 120, borderRadius: 6, border: '1px solid #d9d9d9' }} />
                <Button type="link" danger size="small" onClick={() => { setReceiptBase64(null); if (fileRef.current) fileRef.current.value = '' }}>Remove</Button>
              </div>
            )}
          </Form.Item>
          <Button htmlType="submit" type="primary" block loading={submitting} style={{ height: 42 }}>
            Submit
          </Button>
        </Form>
      </Modal>

      {/* Receipt Preview Modal */}
      <Modal title="Fuel Receipt" open={!!previewReceipt} onCancel={() => setPreviewReceipt(null)} footer={null} centered>
        {previewReceipt && <img src={previewReceipt} alt="receipt" style={{ width: '100%', borderRadius: 8 }} />}
      </Modal>
    </div>
  )
}
