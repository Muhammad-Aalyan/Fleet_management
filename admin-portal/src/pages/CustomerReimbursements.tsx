import { useEffect, useState } from 'react'
import { Table, Card, Button, Modal, Form, Input, Select, Typography, Spin, Descriptions, message, Badge } from 'antd'
import { CheckOutlined, EyeOutlined } from '@ant-design/icons'
import api from '../api/axios'
import RdBadge from '../components/Badge'

const { Text } = Typography
const { TextArea } = Input

const modeLabel: Record<string, string> = {
  TAXI: 'Taxi', BUS: 'Bus', OWN_TRANSPORT: 'Own Transport', RIDE_SHARE: 'Ride Share', OTHER: 'Other',
}

const claimBadge = (status: string) => {
  if (status === 'APPROVED') return <RdBadge status="COMPLETED" label="Approved" />
  if (status === 'REJECTED') return <RdBadge status="REJECTED" label="Rejected" />
  return <RdBadge status="PENDING" label="Pending" />
}

interface Claim {
  id: number; destination: string; travelDate: string; purpose: string
  travelMode: string; amount: number; notes: string | null; status: string
  adminNote: string | null; receiptPhoto: string | null; createdAt: string
  customer: { name: string; phone: string; user: { email: string } }
}

export default function CustomerReimbursements() {
  const [data, setData] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewModal, setReviewModal] = useState<Claim | null>(null)
  const [receiptModal, setReceiptModal] = useState<string | null>(null)
  const [viewModal, setViewModal] = useState<Claim | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const fetch = async () => {
    setLoading(true)
    try { const r = await api.get('/reimbursements/customer'); setData(r.data) }
    catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const handleReview = async (values: { status: 'APPROVED' | 'REJECTED'; adminNote?: string }) => {
    if (!reviewModal) return
    setSubmitting(true)
    try {
      await api.patch(`/reimbursements/customer/${reviewModal.id}/review`, values)
      message.success(`Claim ${values.status.toLowerCase()}`)
      setReviewModal(null); form.resetFields(); fetch()
    } catch { message.error('Failed to update claim') }
    finally { setSubmitting(false) }
  }

  const viewReceipt = async (id: number) => {
    const r = await api.get(`/reimbursements/customer/${id}/receipt`)
    if (!r.data.receiptPhoto) { message.warning('No receipt attached'); return }
    setReceiptModal(r.data.receiptPhoto)
  }

  const pending = data.filter(d => d.status === 'PENDING').length

  const columns = [
    {
      title: 'Customer', key: 'customer',
      render: (_: any, r: Claim) => (
        <div>
          <div className="rd-cell-strong">{r.customer?.name}</div>
          <div className="rd-cell-sub">{r.customer?.user?.email}</div>
        </div>
      ),
    },
    { title: 'Destination', dataIndex: 'destination', key: 'dest' },
    { title: 'Purpose', dataIndex: 'purpose', key: 'purpose' },
    { title: 'Mode', dataIndex: 'travelMode', key: 'mode', render: (v: string) => modeLabel[v] ?? v },
    { title: 'Amount (PKR)', dataIndex: 'amount', key: 'amount', render: (v: number) => <span className="rd-amount-red">PKR {Number(v).toLocaleString()}</span> },
    { title: 'Date', dataIndex: 'travelDate', key: 'date', render: (v: string) => new Date(v).toLocaleDateString() },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => claimBadge(s) },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, r: Claim) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setViewModal(r)} />
          {r.receiptPhoto && <button className="rd-link-btn" onClick={() => viewReceipt(r.id)}>Receipt</button>}
          {r.status === 'PENDING' && (
            <Button size="small" type="primary" icon={<CheckOutlined />}
              onClick={() => { setReviewModal(r); form.resetFields() }}>
              Review
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <Spin spinning={loading}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div className="rd-page-title" style={{ margin: 0 }}>Customer Reimbursements</div>
        {pending > 0 && <Badge count={pending} color="#E01E2B" />}
      </div>

      <Card>
        <Table dataSource={data} columns={columns} rowKey="id" size="middle" scroll={{ x: 'max-content' }} />
      </Card>

      {/* Detail Modal */}
      <Modal title="Claim Details" open={!!viewModal} onCancel={() => setViewModal(null)} footer={null} width={520}>
        {viewModal && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Customer">{viewModal.customer?.name}</Descriptions.Item>
            <Descriptions.Item label="Email">{viewModal.customer?.user?.email}</Descriptions.Item>
            <Descriptions.Item label="Destination">{viewModal.destination}</Descriptions.Item>
            <Descriptions.Item label="Travel Date">{new Date(viewModal.travelDate).toLocaleDateString()}</Descriptions.Item>
            <Descriptions.Item label="Purpose">{viewModal.purpose}</Descriptions.Item>
            <Descriptions.Item label="Mode of Travel">{modeLabel[viewModal.travelMode] ?? viewModal.travelMode}</Descriptions.Item>
            <Descriptions.Item label="Amount">PKR {Number(viewModal.amount).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Notes">{viewModal.notes || '—'}</Descriptions.Item>
            <Descriptions.Item label="Status">{claimBadge(viewModal.status)}</Descriptions.Item>
            {viewModal.adminNote && <Descriptions.Item label="Admin Note">{viewModal.adminNote}</Descriptions.Item>}
            <Descriptions.Item label="Submitted">{new Date(viewModal.createdAt).toLocaleString()}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal title="Review Claim" open={!!reviewModal} onCancel={() => { setReviewModal(null); form.resetFields() }} footer={null}>
        {reviewModal && (
          <div>
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
              <strong>{reviewModal.customer?.name}</strong> — PKR {Number(reviewModal.amount).toLocaleString()}<br />
              <Text type="secondary">{reviewModal.purpose} · {reviewModal.destination}</Text>
            </div>
            <Form form={form} layout="vertical" onFinish={handleReview}>
              <Form.Item label="Decision" name="status" rules={[{ required: true }]}>
                <Select options={[{ value: 'APPROVED', label: '✅ Approve' }, { value: 'REJECTED', label: '❌ Reject' }]} />
              </Form.Item>
              <Form.Item label="Note to Customer (optional)" name="adminNote">
                <TextArea rows={3} placeholder="Reason for rejection or approval note..." />
              </Form.Item>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button htmlType="submit" type="primary" loading={submitting} style={{ flex: 1, background: '#1677ff' }}>Submit Decision</Button>
                <Button onClick={() => { setReviewModal(null); form.resetFields() }} style={{ flex: 1 }}>Cancel</Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* Receipt Modal */}
      <Modal title="Attached Receipt" open={!!receiptModal} onCancel={() => setReceiptModal(null)} footer={null} centered>
        {receiptModal && <img src={receiptModal} alt="receipt" style={{ width: '100%', borderRadius: 8 }} />}
      </Modal>
    </Spin>
  )
}
