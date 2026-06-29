import { Table, Card, Button, Form, InputNumber, Input, Modal, Typography, message } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'

const { Title } = Typography

const initialData = [
  { key: 1, start: 44900, end: 45200, distance: 300, date: '2026-06-29' },
  { key: 2, start: 44600, end: 44900, distance: 300, date: '2026-06-28' },
]

export default function MileageLog() {
  const [data, setData] = useState(initialData)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = (values: { start: number; end: number }) => {
    const distance = values.end - values.start
    if (distance <= 0) { message.error('End mileage must be greater than start'); return }
    setData(prev => [...prev, { key: prev.length + 1, ...values, distance, date: new Date().toISOString().split('T')[0] }])
    form.resetFields()
    setOpen(false)
    message.success('Mileage log added!')
  }

  const columns = [
    { title: 'Start (km)', dataIndex: 'start', key: 'start', render: (v: number) => v.toLocaleString() },
    { title: 'End (km)', dataIndex: 'end', key: 'end', render: (v: number) => v.toLocaleString() },
    { title: 'Distance', dataIndex: 'distance', key: 'distance', render: (v: number) => `${v} km` },
    { title: 'Date', dataIndex: 'date', key: 'date' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ color: '#fff', margin: 0 }}>Mileage Log</Title>
        <Button type="primary" icon={<PlusOutlined />} style={{ background: '#f97316', border: 'none' }} onClick={() => setOpen(true)}>Add Entry</Button>
      </div>

      <Card style={{ borderRadius: 12, border: '1px solid #2a2a3f', background: '#1e1e2e' }}>
        <Table dataSource={data} columns={columns} rowKey="key" size="middle" />
      </Card>

      <Modal title="Add Mileage Entry" open={open} onCancel={() => setOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item label="Start Mileage (km)" name="start" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} addonAfter="km" />
          </Form.Item>
          <Form.Item label="End Mileage (km)" name="end" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} addonAfter="km" />
          </Form.Item>
          <Form.Item label="Photo Evidence URL" name="photoUrl">
            <Input placeholder="Upload link or leave blank" />
          </Form.Item>
          <Button htmlType="submit" type="primary" block style={{ background: '#f97316', border: 'none', height: 42 }}>Submit</Button>
        </Form>
      </Modal>
    </div>
  )
}
