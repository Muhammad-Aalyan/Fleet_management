import { Row, Col, Card, Tag, Button, Typography, Divider } from 'antd'
import { CarOutlined, ClockCircleOutlined, CheckCircleOutlined, ArrowRightOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

const activeRide = {
  driver: 'Ahmed Khan', vehicle: 'KHI-001', pickup: 'DHA Phase 5', drop: 'Saddar', status: 'IN_PROGRESS', eta: '~12 min',
}

const availableRides = [
  { id: 1, route: 'Gulshan → Clifton', time: '02:00 PM', driver: 'Rashid Ali', vehicle: 'KHI-002', seats: 2 },
  { id: 2, route: 'North Karachi → Malir', time: '03:30 PM', driver: 'Tariq Mehmood', vehicle: 'KHI-004', seats: 3 },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Welcome, Ali Raza 👋</Title>
        <Text type="secondary">Book a ride or track your current trip</Text>
      </div>

      {/* Active Ride Banner */}
      <Card style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: 16, marginBottom: 24, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Tag color="green" style={{ marginBottom: 12 }}>● RIDE IN PROGRESS</Tag>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{activeRide.pickup}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowRightOutlined /> {activeRide.drop}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Driver</div>
            <div style={{ color: '#fff', fontWeight: 600 }}>{activeRide.driver}</div>
            <div style={{ color: '#fbbf24', fontSize: 13, marginTop: 4 }}>ETA {activeRide.eta}</div>
          </div>
        </div>
        <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '16px 0' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', flex: 1 }}>Track Driver</Button>
          <Button danger style={{ flex: 1 }}>Cancel Ride</Button>
        </div>
      </Card>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Rides', value: 12, icon: <CarOutlined />, color: '#7c3aed' },
          { label: 'Pending', value: 1, icon: <ClockCircleOutlined />, color: '#faad14' },
          { label: 'Completed', value: 10, icon: <CheckCircleOutlined />, color: '#22c55e' },
        ].map(s => (
          <Col xs={8} key={s.label}>
            <Card style={{ textAlign: 'center', border: '1px solid #ede9fe' }}>
              <div style={{ color: s.color, fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{s.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Available Rides */}
      <Card title="Available Rides in Your Area" extra={<Button type="link" style={{ color: '#7c3aed' }}>View All</Button>} style={{ marginBottom: 24 }}>
        {availableRides.map(r => (
          <div key={r.id} className="ride-status-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>{r.route}</div>
                <Text type="secondary" style={{ fontSize: 13 }}>Driver: {r.driver} · {r.vehicle} · {r.time}</Text>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Tag color="purple">{r.seats} seats left</Tag>
                <Button size="small" type="primary" style={{ marginTop: 8, display: 'block' }}>Join Ride</Button>
              </div>
            </div>
          </div>
        ))}
      </Card>

      <Button type="primary" size="large" icon={<PlusCircleOutlined />} block style={{ height: 52, fontSize: 16, borderRadius: 12 }} onClick={() => navigate('/request-ride')}>
        Request a New Ride
      </Button>
    </div>
  )
}
