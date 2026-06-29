import { Card, Form, Input, DatePicker, TimePicker, InputNumber, Button, Select, Typography, message, Steps } from 'antd'
import { useState } from 'react'
import { EnvironmentOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select

export default function RequestRide() {
  const [form] = Form.useForm()
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    setSubmitted(true)
    message.success('Ride request submitted! Admin will review shortly.')
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
          <Button type="primary" onClick={() => setSubmitted(false)} block style={{ height: 46 }}>Request Another Ride</Button>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Title level={4} style={{ marginBottom: 8 }}>Request a Ride</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>Fill in the details below and admin will assign a driver for you.</Text>

      <Steps
        size="small"
        current={0}
        style={{ marginBottom: 28 }}
        items={[
          { title: 'Fill Details', icon: <EnvironmentOutlined /> },
          { title: 'Admin Review', icon: <ClockCircleOutlined /> },
          { title: 'Driver Assigned', icon: <CheckCircleOutlined /> },
        ]}
      />

      <Card style={{ border: '1px solid #ede9fe' }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Pickup Location" name="pickup" rules={[{ required: true, message: 'Enter pickup location' }]}>
            <Input prefix={<EnvironmentOutlined style={{ color: '#7c3aed' }} />} placeholder="e.g. DHA Phase 5, Karachi" size="large" />
          </Form.Item>

          <Form.Item label="Drop Location" name="drop" rules={[{ required: true, message: 'Enter drop location' }]}>
            <Input prefix={<EnvironmentOutlined style={{ color: '#22c55e' }} />} placeholder="e.g. Saddar, Karachi" size="large" />
          </Form.Item>

          <Form.Item label="Date" name="date" rules={[{ required: true, message: 'Select date' }]}>
            <DatePicker style={{ width: '100%' }} size="large" />
          </Form.Item>

          <Form.Item label="Time" name="time" rules={[{ required: true, message: 'Select time' }]}>
            <TimePicker style={{ width: '100%' }} size="large" format="HH:mm" />
          </Form.Item>

          <Form.Item label="Number of Passengers" name="passengers" rules={[{ required: true }]}>
            <InputNumber min={1} max={14} style={{ width: '100%' }} size="large" />
          </Form.Item>

          <Form.Item label="Purpose" name="purpose">
            <Select placeholder="Select purpose" size="large">
              <Option value="Office">Office</Option>
              <Option value="Meeting">Meeting</Option>
              <Option value="Travel">Travel</Option>
              <Option value="Personal">Personal</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea rows={3} placeholder="Any additional notes..." />
          </Form.Item>

          <Button htmlType="submit" type="primary" block size="large" style={{ height: 50, fontSize: 16, borderRadius: 10, marginTop: 8 }}>
            Submit Ride Request
          </Button>
        </Form>
      </Card>
    </div>
  )
}
