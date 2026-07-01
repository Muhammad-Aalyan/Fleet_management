import { Card, Button, Select, Input, Typography, Alert, message } from 'antd'
import { useState } from 'react'
import { AlertOutlined } from '@ant-design/icons'
import api from '../api/axios'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

const reasons = [
  { value: 'FLAT_TIRE',  label: 'Flat Tire' },
  { value: 'ACCIDENT',   label: 'Accident' },
  { value: 'TRAFFIC',    label: 'Heavy Traffic' },
  { value: 'BREAKDOWN',  label: 'Vehicle Breakdown' },
  { value: 'OTHER',      label: 'Other' },
]

export default function Emergency() {
  const [reason, setReason] = useState('')
  const [desc, setDesc] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAlert = async () => {
    if (!reason) { message.error('Please select a reason'); return }
    setLoading(true)
    try {
      await api.post('/alerts', { reason, description: desc || undefined })
      setSent(true)
      setReason('')
      setDesc('')
      message.success('🚨 Emergency alert sent to admin!')
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Failed to send alert')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Emergency Alert</Title>
      <Text style={{ color: '#888', display: 'block', marginBottom: 24 }}>
        Use this only when your vehicle is stuck or you have an emergency.
      </Text>

      {sent && (
        <Alert
          message="Alert Sent to Admin!"
          description="Your emergency alert has been received. Admin has been notified immediately."
          type="success"
          showIcon
          style={{ marginBottom: 24, borderRadius: 10 }}
          closable
          onClose={() => setSent(false)}
        />
      )}

      <Card style={{ borderRadius: 12, border: '2px solid rgba(239,68,68,0.4)', background: '#1e1e2e' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <AlertOutlined style={{ fontSize: 36, color: '#ef4444' }} />
          </div>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>Vehicle Stuck Alert</Title>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>Reason *</Text>
          <Select placeholder="Select reason" style={{ width: '100%' }} value={reason || undefined} onChange={setReason} size="large">
            {reasons.map(r => <Option key={r.value} value={r.value}>{r.label}</Option>)}
          </Select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Text style={{ color: '#aaa', display: 'block', marginBottom: 8 }}>Description (optional)</Text>
          <TextArea rows={4} placeholder="Describe what happened..." value={desc} onChange={e => setDesc(e.target.value)} style={{ resize: 'none' }} />
        </div>

        <Button
          block size="large" icon={<AlertOutlined />}
          loading={loading}
          onClick={handleAlert}
          style={{ background: '#ef4444', border: 'none', color: '#fff', height: 50, fontSize: 16, fontWeight: 600, borderRadius: 10 }}
        >
          Send Emergency Alert
        </Button>
      </Card>
    </div>
  )
}
