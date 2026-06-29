import { Table, Card, Statistic, Row, Col, Typography } from 'antd'
import { DollarOutlined } from '@ant-design/icons'

const { Title } = Typography

const data = [
  { key: 1, driver: 'Ahmed Khan', vehicle: 'KHI-001', liters: 40, amount: 8000, mileage: 45200, date: '2026-06-29' },
  { key: 2, driver: 'Rashid Ali', vehicle: 'KHI-002', liters: 35, amount: 7000, mileage: 62100, date: '2026-06-28' },
  { key: 3, driver: 'Tariq Mehmood', vehicle: 'KHI-003', liters: 50, amount: 10000, mileage: 89300, date: '2026-06-27' },
]

const columns = [
  { title: 'Driver', dataIndex: 'driver', key: 'driver' },
  { title: 'Vehicle', dataIndex: 'vehicle', key: 'vehicle' },
  { title: 'Liters', dataIndex: 'liters', key: 'liters', render: (v: number) => `${v} L` },
  { title: 'Amount (PKR)', dataIndex: 'amount', key: 'amount', render: (v: number) => v.toLocaleString() },
  { title: 'Mileage (km)', dataIndex: 'mileage', key: 'mileage', render: (v: number) => v.toLocaleString() },
  { title: 'Date', dataIndex: 'date', key: 'date' },
]

export default function FuelRecords() {
  const total = data.reduce((s, r) => s + r.amount, 0)
  const totalLiters = data.reduce((s, r) => s + r.liters, 0)

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>Fuel Records</Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Total Fuel Cost (PKR)" value={total.toLocaleString()} prefix={<DollarOutlined />} valueStyle={{ color: '#fa541c' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Total Liters Filled" value={`${totalLiters} L`} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Avg Cost/Liter (PKR)" value={(total / totalLiters).toFixed(0)} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>
      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={data} columns={columns} rowKey="key" size="middle" />
      </Card>
    </div>
  )
}
