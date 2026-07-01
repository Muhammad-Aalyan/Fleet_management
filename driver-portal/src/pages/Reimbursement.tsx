import { useEffect, useState, useRef } from 'react'
import { Card, Button, Form, Input, InputNumber, Table, Tag, Typography, Modal, message, Spin, Descriptions } from 'antd'
import { PlusOutlined, UploadOutlined, EyeOutlined, WalletOutlined } from '@ant-design/icons'
import api from '../api/axios'

const { Title, Text } = Typography
const { TextArea } = Input

const statusColor: Record<string, string> = { PENDING: 'gold', APPROVED: 'green', REJECTED: 'red' }
const statusIcon: Record<string, string> = { PENDING: '⏳', APPROVED: '✅', REJECTED: '❌' }

interface Claim {
  id: number; description: string; workDone: string; amountPaid: number
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
    try { const r = await api.get('/reimbursements/driver/my'); setData(r.data) }
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
      await api.post('/reimbursements/driver', { ...values, receiptPhoto: receiptBase64 ?? undefined })
      message.success('Reimbursement claim submitted!')
      setModalOpen(false); form.resetFields(); setReceiptBase64(null)
      if (fileRef.current) fileRef.current.value = ''
      fetchData()
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed to submit claim') }
    finally { setSubmitting(false) }
  }

  const columns = [
    { title: 'Description', dataIndex: 'description', key: 'desc' },
    { title: 'Work Done', dataIndex: 'workDone', key: 'work' },
    { title: 'Amount (PKR)', dataIndex: 'amountPaid', key: 'amount', render: (v: number) => <Text style={{ color: '#f97316', fontWeight: 600 }}>PKR {Number(v).toLocaleString()}</Text> },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={statusColor[s]}>{statusIcon[s]} {s}</Tag>,
    },
    { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (v: string) => new Date(v).toLocaleDateString() },
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
          <Title level={4} style={{ color: '#fff', margin: 0 }}>Reimbursement Claims</Title>
          <Text style={{ color: '#6b7280', fontSize: 13 }}>Submit toll, maintenance, and other work-related expenses</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />}
          style={{ background: '#f97316', border: 'none' }}
          onClick={() => setModalOpen(true)}>
          New Claim
        </Button>
      </div>

      <Spin spinning={loading}>
        <Card style={{ borderRadius: 12, border: '1px solid #2a2a3f', background: '#1e1e2e' }}>
          <Table dataSource={data} columns={columns} rowKey="id" size="middle"
            locale={{ emptyText: 'No claims submitted yet.' }} />
        </Card>
      </Spin>

      {/* Submit Modal */}
      <Modal
        title={<span><WalletOutlined style={{ color: '#f97316', marginRight: 8 }} />New Reimbursement Claim</span>}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); setReceiptBase64(null) }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 8 }}>
          <Form.Item label="Description (what needs to be reimbursed)" name="description" rules={[{ required: true }]}>
            <Input placeholder="e.g. Motorway toll, car wash, tyre puncture repair" />
          </Form.Item>
          <Form.Item label="Work Done / Details" name="workDone" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="Describe the work or trip in detail..." />
          </Form.Item>
          <Form.Item label="Amount Paid (PKR)" name="amountPaid" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} addonBefore="PKR" placeholder="e.g. 500" />
          </Form.Item>
          <Form.Item label="Receipt / Proof (optional)">
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <Button icon={<UploadOutlined />} onClick={() => fileRef.current?.click()}>
              {receiptBase64 ? 'Receipt Selected ✓' : 'Upload Receipt Photo'}
            </Button>
            {receiptBase64 && (
              <div style={{ marginTop: 8 }}>
                <img src={receiptBase64} alt="preview" style={{ maxHeight: 100, borderRadius: 6, border: '1px solid #374151' }} />
                <Button type="link" danger size="small" onClick={() => { setReceiptBase64(null); if (fileRef.current) fileRef.current.value = '' }}>Remove</Button>
              </div>
            )}
          </Form.Item>
          <Button htmlType="submit" type="primary" block loading={submitting}
            style={{ background: '#f97316', border: 'none', height: 42, fontWeight: 600 }}>
            Submit Claim
          </Button>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal title="Claim Details" open={!!viewClaim} onCancel={() => setViewClaim(null)} footer={null}>
        {viewClaim && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Description">{viewClaim.description}</Descriptions.Item>
            <Descriptions.Item label="Work Done">{viewClaim.workDone}</Descriptions.Item>
            <Descriptions.Item label="Amount Paid">PKR {Number(viewClaim.amountPaid).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={statusColor[viewClaim.status]}>{statusIcon[viewClaim.status]} {viewClaim.status}</Tag></Descriptions.Item>
            {viewClaim.adminNote && <Descriptions.Item label="Admin Note" labelStyle={{ color: '#1677ff' }}>{viewClaim.adminNote}</Descriptions.Item>}
            <Descriptions.Item label="Submitted">{new Date(viewClaim.createdAt).toLocaleString()}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Receipt Preview */}
      <Modal title="Receipt" open={!!receiptPreview} onCancel={() => setReceiptPreview(null)} footer={null} centered>
        {receiptPreview && <img src={receiptPreview} alt="receipt" style={{ width: '100%', borderRadius: 8 }} />}
      </Modal>
    </div>
  )
}
