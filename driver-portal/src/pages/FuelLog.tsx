import { Table, Card, Button, Form, InputNumber, Input, Modal, Typography, message } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'

const { Title } = Typography

const initialData = [
  { key: 1, liters: 40, amount: 8000, mileage: 45200, date: '2026-06-27' },
  { key: 2, liters: 35, amount: 7000, mileage: 44100, date: '2026-06-20' },
]

export default function FuelLog() {
  const [data, setData] = useState(initialData)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = (values: { liters: number; amount: number; mileage: number }) => {
    setData(prev => [...prev, { key: prev.length + 1, ...values, date: new Date().toISOString().split('T')[0] }])
    form.resetFields()
    setOpen(false)
    message.success('Fuel log added!')
  }

  const columns = [
    { title: 'Liters', dataIndex: 'liters', key: 'liters', render: (v: number) => `${v} L` },
    { title: 'Amount (PKR)', dataIndex: 'amount', key: 'amount', render: (v: number) => v.toLocaleString() },
    { title: 'Mileage (km)', dataIndex: 'mileage', key: 'mileage', render: (v: number) => v.toLocaleString() },
    { title: 'Date', dataIndex: 'date', key: 'date' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ color: '#fff', margin: 0 }}>Fuel Log</Title>
        <Button type="primary" icon={<PlusOutlined />} style={{ background: '#f97316', border: 'none' }} onClick={() => setOpen(true)}>Add Entry</Button>
      </div>

      <Card style={{ borderRadius: 12, border: '1px solid #2a2a3f', background: '#1e1e2e' }}>
        <Table dataSource={data} columns={columns} rowKey="key" size="middle" />
      </Card>

      <Modal title="Add Fuel Entry" open={open} onCancel={() => setOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item label="Liters Filled" name="liters" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} addonAfter="L" />
          </Form.Item>
          <Form.Item label="Amount (PKR)" name="amount" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} addonBefore="PKR" />
          </Form.Item>
          <Form.Item label="Current Mileage (km)" name="mileage" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} addonAfter="km" />
          </Form.Item>
          <Form.Item label="Receipt Photo URL" name="receiptPhoto">
            <Input placeholder="Upload link or leave blank" />
          </Form.Item>
          <Button htmlType="submit" type="primary" block style={{ background: '#f97316', border: 'none', height: 42 }}>Submit</Button>
        </Form>
      </Modal>
    </div>
  )
}
