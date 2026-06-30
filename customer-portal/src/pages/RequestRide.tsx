import { Card, Form, Input, DatePicker, TimePicker, InputNumber, Button, Select, Typography, message, Steps, Space, Alert } from 'antd'
import { useState } from 'react'
import { EnvironmentOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api/axios'
import dayjs from 'dayjs'

const { Title, Text } = Typography
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
        <Card style={{ border: '1px solid #ede9fe', padding: 20 }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#7c3aed', marginBottom: 16 }} />
          <Title level={3} style={{ color: '#7c3aed' }}>Request Submitted!</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
            Your ride request has been submitted. You'll be notified once admin approves and assigns a driver.
          </Text>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button type="primary" block style={{ height: 46, background: '#7c3aed', borderColor: '#7c3aed' }}
              onClick={() => { setSubmitted(false); form.resetFields() }}>
              Request Another Ride
            </Button>
            <Button block style={{ height: 46 }} onClick={() => navigate('/my-rides')}>
              View My Rides
            </Button>
          </Space>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Title level={4} style={{ marginBottom: 8 }}>Request a Ride</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>Fill in the details and admin will assign a driver for you.</Text>

      <Steps size="small" current={0} style={{ marginBottom: 28 }} items={[
        { title: 'Fill Details', icon: <EnvironmentOutlined /> },
        { title: 'Admin Review', icon: <ClockCircleOutlined /> },
        { title: 'Driver Assigned', icon: <CheckCircleOutlined /> },
      ]} />

      <Card style={{ border: '1px solid #ede9fe' }}>
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
            <Input prefix={<EnvironmentOutlined style={{ color: '#7c3aed' }} />} placeholder="e.g. DHA Phase 5, Karachi" size="large" />
          </Form.Item>
          <Form.Item label="Drop Location" name="drop" rules={[{ required: true, message: 'Enter drop location' }]}>
            <Input prefix={<EnvironmentOutlined style={{ color: '#22c55e' }} />} placeholder="e.g. Saddar, Karachi" size="large" />
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
            style={{ height: 50, fontSize: 16, borderRadius: 10, marginTop: 8, background: '#7c3aed', borderColor: '#7c3aed' }}>
            Submit Ride Request
          </Button>
        </Form>
      </Card>
    </div>
  )
}

