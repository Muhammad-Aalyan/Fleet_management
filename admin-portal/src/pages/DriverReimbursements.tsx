import { useEffect, useState } from 'react'
import { Table, Card, Button, Modal, Form, Input, Select, Typography, Spin, Descriptions, message, Badge } from 'antd'
import { CheckOutlined, EyeOutlined } from '@ant-design/icons'
import api from '../api/axios'
import RdBadge from '../components/Badge'

const { Text } = Typography
const { TextArea } = Input

const claimBadge = (status: string) => {
  if (status === 'APPROVED') return <RdBadge status="COMPLETED" label="Approved" />
  if (status === 'REJECTED') return <RdBadge status="REJECTED" label="Rejected" />
  return <RdBadge status="PENDING" label="Pending" />
}

interface Claim {
  id: number; description: string; workDone: string; amountPaid: number
  receiptPhoto: string | null; status: string; adminNote: string | null; createdAt: string
  driver: { name: string; phone: string; user: { email: string } }
}

export default function DriverReimbursements() {
  const [data, setData] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewModal, setReviewModal] = useState<Claim | null>(null)
  const [receiptModal, setReceiptModal] = useState<string | null>(null)
  const [viewModal, setViewModal] = useState<Claim | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const fetch = async () => {
    setLoading(true)
    try { const r = await api.get('/reimbursements/driver'); setData(r.data) }
    catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const handleReview = async (values: { status: 'APPROVED' | 'REJECTED'; adminNote?: string }) => {
    if (!reviewModal) return
    setSubmitting(true)
    try {
      await api.patch(`/reimbursements/driver/${reviewModal.id}/review`, values)
      message.success(`Claim ${values.status.toLowerCase()}`)
      setReviewModal(null); form.resetFields(); fetch()
    } catch { message.error('Failed to update claim') }
    finally { setSubmitting(false) }
  }

  const viewReceipt = async (id: number) => {
    const r = await api.get(`/reimbursements/driver/${id}/receipt`)
    if (!r.data.receiptPhoto) { message.warning('No receipt attached'); return }
    setReceiptModal(r.data.receiptPhoto)
  }

  const pending = data.filter(d => d.status === 'PENDING').length

  const columns = [
    {
      title: 'Driver', key: 'driver',
      render: (_: any, r: Claim) => (
        <div>
          <div className="rd-cell-strong">{r.driver?.name}</div>
          <div className="rd-cell-sub">{r.driver?.user?.email}</div>
        </div>
      ),
    },
    { title: 'Description', dataIndex: 'description', key: 'desc' },
    { title: 'Work Done', dataIndex: 'workDone', key: 'work' },
    { title: 'Amount Paid (PKR)', dataIndex: 'amountPaid', key: 'amount', render: (v: number) => <span className="rd-amount-red">PKR {Number(v).toLocaleString()}</span> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => claimBadge(s) },
    { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (v: string) => new Date(v).toLocaleDateString() },
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
        <div className="rd-page-title" style={{ margin: 0 }}>Driver Reimbursements</div>
        {pending > 0 && <Badge count={pending} color="#E01E2B" />}
      </div>

      <Card>
        <Table dataSource={data} columns={columns} rowKey="id" size="middle" scroll={{ x: 'max-content' }} />
      </Card>

      {/* Detail Modal */}
      <Modal title="Claim Details" open={!!viewModal} onCancel={() => setViewModal(null)} footer={null} width={500}>
        {viewModal && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Driver">{viewModal.driver?.name}</Descriptions.Item>
            <Descriptions.Item label="Phone">{viewModal.driver?.phone}</Descriptions.Item>
            <Descriptions.Item label="Description">{viewModal.description}</Descriptions.Item>
            <Descriptions.Item label="Work Done">{viewModal.workDone}</Descriptions.Item>
            <Descriptions.Item label="Amount Paid">PKR {Number(viewModal.amountPaid).toLocaleString()}</Descriptions.Item>
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
              <strong>{reviewModal.driver?.name}</strong> — PKR {Number(reviewModal.amountPaid).toLocaleString()}<br />
              <Text type="secondary">{reviewModal.description}</Text>
            </div>
            <Form form={form} layout="vertical" onFinish={handleReview}>
              <Form.Item label="Decision" name="status" rules={[{ required: true }]}>
                <Select options={[{ value: 'APPROVED', label: '✅ Approve' }, { value: 'REJECTED', label: '❌ Reject' }]} />
              </Form.Item>
              <Form.Item label="Note to Driver (optional)" name="adminNote">
                <TextArea rows={3} placeholder="Reason for rejection or any note..." />
              </Form.Item>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button htmlType="submit" type="primary" loading={submitting} style={{ flex: 1 }}>Submit Decision</Button>
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
