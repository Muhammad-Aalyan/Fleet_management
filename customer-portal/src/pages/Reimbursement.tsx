import { useEffect, useState, useRef } from 'react'
import { Card, Button, Form, Input, InputNumber, Select, DatePicker, Table, Tag, Typography, Modal, message, Spin, Descriptions } from 'antd'
import { PlusOutlined, UploadOutlined, EyeOutlined, WalletOutlined } from '@ant-design/icons'
import api from '../api/axios'

const { Title, Text } = Typography
const { TextArea } = Input

const statusColor: Record<string, string> = { PENDING: 'gold', APPROVED: 'green', REJECTED: 'red' }
const statusIcon: Record<string, string> = { PENDING: '⏳', APPROVED: '✅', REJECTED: '❌' }
const modeLabel: Record<string, string> = {
  TAXI: 'Taxi / Cab', BUS: 'Public Bus', OWN_TRANSPORT: 'Own Transport',
  RIDE_SHARE: 'Ride Share (Careem/Uber)', OTHER: 'Other',
}

interface Claim {
  id: number; destination: string; travelDate: string; purpose: string
  travelMode: string; amount: number; notes: string | null
  receiptPhoto: string | null; status: string; adminNote: string | null; createdAt: string
}

export default function Reimbursement() {
  const [data, setData] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewClaim, setViewClaim] = useState<Claim | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchData = async () => {
    setLoading(true)
    try { const r = await api.get('/reimbursements/customer/my'); setData(r.data) }
    catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { message.error('File must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = () => setReceiptBase64(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (values: any) => {
    setSubmitting(true)
    try {
      await api.post('/reimbursements/customer', {
        ...values,
        travelDate: values.travelDate?.format('YYYY-MM-DD'),
        receiptPhoto: receiptBase64 ?? undefined,
      })
      message.success('Reimbursement claim submitted! Admin will review it shortly.')
      setModalOpen(false); form.resetFields(); setReceiptBase64(null)
      if (fileRef.current) fileRef.current.value = ''
      fetchData()
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed to submit claim') }
    finally { setSubmitting(false) }
  }

  const columns = [
    { title: 'Destination', dataIndex: 'destination', key: 'dest' },
    { title: 'Purpose', dataIndex: 'purpose', key: 'purpose' },
    { title: 'Mode', dataIndex: 'travelMode', key: 'mode', render: (v: string) => modeLabel[v] ?? v },
    { title: 'Amount (PKR)', dataIndex: 'amount', key: 'amount', render: (v: number) => <Text style={{ color: '#7c3aed', fontWeight: 600 }}>PKR {Number(v).toLocaleString()}</Text> },
    { title: 'Travel Date', dataIndex: 'travelDate', key: 'date', render: (v: string) => new Date(v).toLocaleDateString() },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={statusColor[s]}>{statusIcon[s]} {s}</Tag>,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, r: Claim) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setViewClaim(r)} />
          {r.receiptPhoto && <Button size="small" onClick={() => setReceiptPreview(r.receiptPhoto)}>Receipt</Button>}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Reimbursement Claims</Title>
          <Text style={{ color: '#6b7280', fontSize: 13 }}>Submit claims for travel expenses related to company business</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />}
          style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
          onClick={() => setModalOpen(true)}>
          New Claim
        </Button>
      </div>

      <Spin spinning={loading}>
        <Card style={{ borderRadius: 12 }}>
          <Table dataSource={data} columns={columns} rowKey="id" size="middle"
            locale={{ emptyText: 'No claims submitted yet.' }} />
        </Card>
      </Spin>

      {/* Submit Modal */}
      <Modal
        title={<span><WalletOutlined style={{ color: '#7c3aed', marginRight: 8 }} />New Reimbursement Claim</span>}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); setReceiptBase64(null) }}
        footer={null}
        width={560}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
          Fill in the details of your trip for reimbursement review.
        </Text>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label="Where did you go? (Destination)" name="destination" rules={[{ required: true }]} style={{ gridColumn: '1 / -1' }}>
              <Input placeholder="e.g. Head Office, Karachi Airport, Client Site" />
            </Form.Item>
            <Form.Item label="When? (Travel Date)" name="travelDate" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="How did you travel?" name="travelMode" rules={[{ required: true }]}>
              <Select placeholder="Select mode" options={Object.entries(modeLabel).map(([v, l]) => ({ value: v, label: l }))} />
            </Form.Item>
            <Form.Item label="Why? (Purpose of Trip)" name="purpose" rules={[{ required: true }]} style={{ gridColumn: '1 / -1' }}>
              <Input placeholder="e.g. Client meeting, Office work, Training session" />
            </Form.Item>
            <Form.Item label="Amount Claimed (PKR)" name="amount" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: '100%' }} addonBefore="PKR" />
            </Form.Item>
            <Form.Item label="Additional Notes (optional)" name="notes">
              <Input placeholder="Any extra details..." />
            </Form.Item>
          </div>
          <Form.Item label="Receipt / Screenshot (optional)">
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <Button icon={<UploadOutlined />} onClick={() => fileRef.current?.click()}>
              {receiptBase64 ? 'Receipt Selected ✓' : 'Upload Receipt or Screenshot'}
            </Button>
            {receiptBase64 && (
              <div style={{ marginTop: 8 }}>
                <img src={receiptBase64} alt="preview" style={{ maxHeight: 100, borderRadius: 6, border: '1px solid #e5e7eb' }} />
                <Button type="link" danger size="small" onClick={() => { setReceiptBase64(null); if (fileRef.current) fileRef.current.value = '' }}>Remove</Button>
              </div>
            )}
          </Form.Item>
          <Button htmlType="submit" type="primary" block loading={submitting}
            style={{ background: '#7c3aed', borderColor: '#7c3aed', height: 42, fontWeight: 600 }}>
            Submit Claim
          </Button>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal title="Claim Details" open={!!viewClaim} onCancel={() => setViewClaim(null)} footer={null} width={500}>
        {viewClaim && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Destination">{viewClaim.destination}</Descriptions.Item>
            <Descriptions.Item label="Travel Date">{new Date(viewClaim.travelDate).toLocaleDateString()}</Descriptions.Item>
            <Descriptions.Item label="Purpose">{viewClaim.purpose}</Descriptions.Item>
            <Descriptions.Item label="Mode of Travel">{modeLabel[viewClaim.travelMode] ?? viewClaim.travelMode}</Descriptions.Item>
            <Descriptions.Item label="Amount Claimed">PKR {Number(viewClaim.amount).toLocaleString()}</Descriptions.Item>
            {viewClaim.notes && <Descriptions.Item label="Notes">{viewClaim.notes}</Descriptions.Item>}
            <Descriptions.Item label="Status">
              <Tag color={statusColor[viewClaim.status]}>{statusIcon[viewClaim.status]} {viewClaim.status}</Tag>
            </Descriptions.Item>
            {viewClaim.adminNote && (
              <Descriptions.Item label="Admin Note" labelStyle={{ color: '#1677ff', fontWeight: 600 }}>
                {viewClaim.adminNote}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Submitted">{new Date(viewClaim.createdAt).toLocaleString()}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Receipt Preview */}
      <Modal title="Receipt / Screenshot" open={!!receiptPreview} onCancel={() => setReceiptPreview(null)} footer={null} centered>
        {receiptPreview && <img src={receiptPreview} alt="receipt" style={{ width: '100%', borderRadius: 8 }} />}
      </Modal>
    </div>
  )
}
