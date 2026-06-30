import { useEffect, useState } from 'react'
import { Table, Tag, Card, Statistic, Row, Col, Typography, Spin, Empty } from 'antd'
import { CarOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, StopOutlined } from '@ant-design/icons'
import api from '../api/axios'

const { Title, Text } = Typography

interface Ride {
  id: number
  status: string
  pickupLocation: string
  dropLocation: string
  scheduledDate: string
  scheduledTime: string
  passengers: number
  remarks?: string
  assignment?: {
    driver: { name: string }
    vehicle: { vehicleNumber: string; model: string }
    completedAt?: string
  } | null
}

const statusConfig: Record<string, { color: string; label: string }> = {
  PENDING:     { color: 'gold',       label: 'Pending' },
  APPROVED:    { color: 'blue',       label: 'Approved' },
  ASSIGNED:    { color: 'purple',     label: 'Assigned' },
  IN_PROGRESS: { color: 'processing', label: 'In Progress' },
  COMPLETED:   { color: 'green',      label: 'Completed' },
  REJECTED:    { color: 'red',        label: 'Rejected' },
  CANCELLED:   { color: 'default',    label: 'Cancelled' },
}

export default function RideHistory() {
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await api.get('/rides/my')
        setRides(res.data)
      } catch { /* silently fail */ }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const total     = rides.length
  const completed = rides.filter(r => r.status === 'COMPLETED').length
  const cancelled = rides.filter(r => r.status === 'CANCELLED').length
  const pending   = rides.filter(r => ['PENDING', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS'].includes(r.status)).length
  const rejected  = rides.filter(r => r.status === 'REJECTED').length

  const columns = [
    {
      title: 'Route',
      key: 'route',
      render: (_: unknown, r: Ride) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{r.pickupLocation}</div>
          <div style={{ fontSize: 12, color: '#7c3aed' }}>→ {r.dropLocation}</div>
        </div>
      ),
    },
    {
      title: 'Date & Time',
      key: 'date',
      render: (_: unknown, r: Ride) => (
        <div>
          <div style={{ fontSize: 13 }}>{new Date(r.scheduledDate).toLocaleDateString()}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.scheduledTime}</div>
        </div>
      ),
    },
    {
      title: 'Passengers',
      dataIndex: 'passengers',
      key: 'passengers',
      width: 90,
      render: (p: number) => <Text>{p}</Text>,
    },
    {
      title: 'Driver / Vehicle',
      key: 'driver',
      render: (_: unknown, r: Ride) => r.assignment?.driver ? (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{r.assignment.driver.name}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.assignment.vehicle?.vehicleNumber}</div>
        </div>
      ) : <Text type="secondary">—</Text>,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, r: Ride) => {
        const cfg = statusConfig[r.status] ?? { color: 'default', label: r.status }
        return (
          <div>
            <Tag color={cfg.color} style={{ fontWeight: 600 }}>{cfg.label}</Tag>
            {r.remarks && r.status === 'REJECTED' && (
              <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Reason: {r.remarks}</div>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>Ride History</Title>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Rides',  value: total,     icon: <CarOutlined />,           color: '#7c3aed' },
            { label: 'Completed',    value: completed,  icon: <CheckCircleOutlined />,   color: '#22c55e' },
            { label: 'Cancelled',    value: cancelled,  icon: <CloseCircleOutlined />,   color: '#6b7280' },
            { label: 'Pending',      value: pending,    icon: <ClockCircleOutlined />,   color: '#faad14' },
            { label: 'Rejected',     value: rejected,   icon: <StopOutlined />,          color: '#ef4444' },
          ].map(s => (
            <Col xs={12} sm={8} md={24 / 5} key={s.label}>
              <Card style={{ border: '1px solid #ede9fe', textAlign: 'center' }}>
                <Statistic
                  title={s.label}
                  value={s.value}
                  prefix={s.icon}
                  valueStyle={{ color: s.color }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        <Card style={{ border: '1px solid #ede9fe', borderRadius: 12 }}>
          {rides.length === 0 && !loading ? (
            <Empty description="No ride history yet" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '40px 0' }} />
          ) : (
            <Table
              dataSource={rides}
              columns={columns}
              rowKey="id"
              size="middle"
              pagination={{ pageSize: 10, showTotal: t => `${t} rides` }}
              rowClassName={(r) => r.status === 'IN_PROGRESS' ? 'ant-table-row-active' : ''}
            />
          )}
        </Card>
      </Spin>
    </div>
  )
}
