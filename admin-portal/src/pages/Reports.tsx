import { Card, Row, Col, Statistic, Table, Typography } from 'antd'
import { BarChartOutlined, RiseOutlined } from '@ant-design/icons'

const { Title } = Typography

const monthlyData = [
  { key: 1, month: 'January 2026', totalRides: 58, completed: 52, cancelled: 6, fuelCost: 42000, drivers: 20 },
  { key: 2, month: 'February 2026', totalRides: 71, completed: 65, cancelled: 6, fuelCost: 51000, drivers: 22 },
  { key: 3, month: 'March 2026', totalRides: 84, completed: 79, cancelled: 5, fuelCost: 58000, drivers: 23 },
  { key: 4, month: 'April 2026', totalRides: 92, completed: 88, cancelled: 4, fuelCost: 63000, drivers: 24 },
  { key: 5, month: 'May 2026', totalRides: 110, completed: 104, cancelled: 6, fuelCost: 72000, drivers: 24 },
  { key: 6, month: 'June 2026', totalRides: 143, completed: 135, cancelled: 8, fuelCost: 91000, drivers: 24 },
]

const columns = [
  { title: 'Month', dataIndex: 'month', key: 'month' },
  { title: 'Total Rides', dataIndex: 'totalRides', key: 'totalRides' },
  { title: 'Completed', dataIndex: 'completed', key: 'completed', render: (v: number) => <span style={{ color: '#52c41a', fontWeight: 600 }}>{v}</span> },
  { title: 'Cancelled', dataIndex: 'cancelled', key: 'cancelled', render: (v: number) => <span style={{ color: '#f5222d' }}>{v}</span> },
  { title: 'Fuel Cost (PKR)', dataIndex: 'fuelCost', key: 'fuelCost', render: (v: number) => v.toLocaleString() },
  { title: 'Active Drivers', dataIndex: 'drivers', key: 'drivers' },
]

export default function Reports() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>Reports & Analytics</Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { title: 'Total Rides (2026)', value: 558, color: '#1677ff', icon: <BarChartOutlined /> },
          { title: 'Completion Rate', value: '95.3%', color: '#52c41a', icon: <RiseOutlined /> },
          { title: 'Total Fuel Cost', value: '3,77,000 PKR', color: '#fa541c', icon: <BarChartOutlined /> },
          { title: 'Peak Month', value: 'June', color: '#722ed1', icon: <RiseOutlined /> },
        ].map(s => (
          <Col span={6} key={s.title}>
            <Card style={{ borderRadius: 12 }}>
              <Statistic title={s.title} value={s.value} valueStyle={{ color: s.color }} prefix={s.icon} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card title="Monthly Summary" style={{ borderRadius: 12 }}>
        <Table dataSource={monthlyData} columns={columns} rowKey="key" size="middle" pagination={false} />
      </Card>
    </div>
  )
}
