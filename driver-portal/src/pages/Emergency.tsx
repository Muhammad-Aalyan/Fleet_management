import { Select, Input, Alert, message } from 'antd'
import { useState } from 'react'
import { AlertOutlined } from '@ant-design/icons'
import api from '../api/axios'

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
    <div>
      <div className="rd-page-title">Emergency Alert</div>
      <p className="rd-page-sub">Use this only when your vehicle is stuck or you have an emergency.</p>

      {sent && (
        <Alert
          message="Alert Sent to Admin!"
          description="Your emergency alert has been received. Admin has been notified immediately."
          type="success"
          showIcon
          style={{ marginBottom: 24, borderRadius: 10, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}
          closable
          onClose={() => setSent(false)}
        />
      )}

      <div className="rd-emergency-wrap">
        <div className="rd-emergency-card">
          <div className="rd-emergency-icon">
            <AlertOutlined style={{ fontSize: 30 }} />
          </div>
          <h2>Vehicle Stuck Alert</h2>

          <div className="rd-field">
            <label>Reason *</label>
            <Select placeholder="Select reason" style={{ width: '100%' }} value={reason || undefined} onChange={setReason} size="large">
              {reasons.map(r => <Option key={r.value} value={r.value}>{r.label}</Option>)}
            </Select>
          </div>

          <div className="rd-field">
            <label>Description (optional)</label>
            <TextArea rows={4} placeholder="Describe what happened..." value={desc} onChange={e => setDesc(e.target.value)} style={{ resize: 'none' }} />
          </div>

          <button className="rd-btn danger" onClick={handleAlert} disabled={loading}>
            {loading ? 'Sending…' : '🚨 Send Emergency Alert'}
          </button>
        </div>
      </div>
    </div>
  )
}
