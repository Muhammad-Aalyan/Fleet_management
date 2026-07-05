import { Form, Input, DatePicker, TimePicker, InputNumber, Button, Select, Space, Alert, message } from 'antd'
import { useState } from 'react'
import { CheckCircleOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api/axios'
import dayjs from 'dayjs'

const { Option } = Select

export default function RequestRide() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state as { pickupLocation?: string; dropLocation?: string; scheduledDate?: string; scheduledTime?: string } | null

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      await api.post('/rides', {
        pickupLocation: values.pickup,
        dropLocation: values.drop,
        scheduledDate: dayjs(values.date).toISOString(),
        scheduledTime: dayjs(values.time).format('HH:mm'),
        passengers: values.passengers,
        purpose: values.purpose,
        remarks: values.remarks,
      })
      setSubmitted(true)
      message.success('Ride request submitted! Admin will review shortly.')
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Failed to submit ride request')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
        <div className="rd-form-card" style={{ maxWidth: 'none' }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: 'var(--rd-red)', marginBottom: 16 }} />
          <h2 style={{ color: 'var(--rd-red)', fontSize: 22, marginBottom: 12 }}>Request Submitted!</h2>
          <p style={{ color: 'var(--rd-ink-soft)', marginBottom: 24 }}>
            Your ride request has been submitted. You'll be notified once admin approves and assigns a driver.
          </p>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button type="primary" block style={{ height: 46 }}
              onClick={() => { setSubmitted(false); form.resetFields() }}>
              Request Another Ride
            </Button>
            <Button block style={{ height: 46 }} onClick={() => navigate('/my-rides')}>
              View My Rides
            </Button>
          </Space>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="rd-page-title">Request a Ride</div>
      <p className="rd-page-sub">Fill in the details and admin will assign a driver for you.</p>

      <div className="rd-stepper">
        <div className="rd-step active"><div className="circle">📍</div>Fill Details</div>
        <div className="rd-step-line" />
        <div className="rd-step"><div className="circle">🕐</div>Admin Review</div>
        <div className="rd-step-line" />
        <div className="rd-step"><div className="circle">✓</div>Driver Assigned</div>
      </div>

      <div className="rd-form-card">
        {prefill?.pickupLocation && (
          <Alert
            type="info"
            showIcon
            message="Route pre-filled from available ride"
            description="We've filled in the pickup and drop locations. Adjust any details and submit your request."
            style={{ marginBottom: 16, borderRadius: 10 }}
            closable
          />
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            pickup: prefill?.pickupLocation,
            drop: prefill?.dropLocation,
            date: prefill?.scheduledDate ? dayjs(prefill.scheduledDate) : undefined,
            time: prefill?.scheduledTime ? dayjs(prefill.scheduledTime, 'HH:mm') : undefined,
            passengers: 1,
          }}
        >
          <Form.Item label="Pickup Location" name="pickup" rules={[{ required: true, message: 'Enter pickup location' }]}>
            <Input placeholder="e.g. DHA Phase 5, Karachi" size="large" />
          </Form.Item>
          <Form.Item label="Drop Location" name="drop" rules={[{ required: true, message: 'Enter drop location' }]}>
            <Input placeholder="e.g. Saddar, Karachi" size="large" />
          </Form.Item>
          <Form.Item label="Date" name="date" rules={[{ required: true, message: 'Select date' }]}>
            <DatePicker style={{ width: '100%' }} size="large" disabledDate={d => d.isBefore(dayjs(), 'day')} />
          </Form.Item>
          <Form.Item label="Time" name="time" rules={[{ required: true, message: 'Select time' }]}>
            <TimePicker style={{ width: '100%' }} size="large" format="HH:mm" />
          </Form.Item>
          <Form.Item label="Number of Passengers" name="passengers" rules={[{ required: true }]}>
            <InputNumber min={1} max={14} style={{ width: '100%' }} size="large" />
          </Form.Item>
          <Form.Item label="Purpose" name="purpose">
            <Select placeholder="Select purpose" size="large">
              {['Office', 'Meeting', 'Travel', 'Personal', 'Other'].map(p => <Option key={p} value={p}>{p}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea rows={3} placeholder="Any additional notes..." />
          </Form.Item>
          <Button htmlType="submit" type="primary" block size="large" loading={loading}
            style={{ height: 50, fontSize: 16, borderRadius: 10, marginTop: 8 }}>
            Submit Ride Request
          </Button>
        </Form>
      </div>
    </div>
  )
}
