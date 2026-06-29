import { Row, Col, Card, Statistic, Tag, Button, Typography, Divider } from 'antd'
import { CarOutlined, CheckCircleOutlined, ClockCircleOutlined, ThunderboltOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: '#fff' }}>Welcome back, Ahmed 👋</Title>
        <Text style={{ color: '#888' }}>Here's your activity summary for today</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: "Today's Rides", value: 3, icon: <CarOutlined />, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
          { title: 'Completed', value: 2, icon: <CheckCircleOutlined />, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          { title: 'Pending', value: 1, icon: <ClockCircleOutlined />, color: '#faad14', bg: 'rgba(250,173,20,0.1)' },
          { title: 'In Progress', value: 1, icon: <ThunderboltOutlined />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
        ].map(s => (
          <Col xs={12} md={6} key={s.title}>
            <Card className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <Statistic title={<span style={{ color: '#aaa', fontSize: 13 }}>{s.title}</span>} value={s.value} valueStyle={{ color: s.color, fontSize: 26, fontWeight: 700 }} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title={<span style={{ color: '#fff' }}>Current Assignment</span>} style={{ borderRadius: 12, border: '1px solid #2a2a3f', background: '#1e1e2e' }}>
            <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Tag color="orange" style={{ marginBottom: 12 }}>IN PROGRESS</Tag>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Sara Khan</div>
                  <div style={{ color: '#aaa', fontSize: 13 }}>1 Passenger</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#888', fontSize: 12 }}>Vehicle</div>
                  <div style={{ color: '#f97316', fontWeight: 700 }}>KHI-001</div>
                </div>
              </div>
              <Divider style={{ borderColor: 'rgba(249,115,22,0.2)', margin: '16px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>FROM</div>
                  <div style={{ color: '#fff', fontWeight: 500 }}>DHA Phase 5</div>
                </div>
                <ArrowRightOutlined style={{ color: '#f97316', fontSize: 18 }} />
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>TO</div>
                  <div style={{ color: '#fff', fontWeight: 500 }}>Saddar</div>
                </div>
              </div>
              <Button type="primary" block style={{ marginTop: 16, background: '#f97316', border: 'none', height: 42 }}>
                Complete Ride
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={<span style={{ color: '#fff' }}>Quick Actions</span>} style={{ borderRadius: 12, border: '1px solid #2a2a3f', background: '#1e1e2e' }}>
            {[
              { label: 'View All My Rides', path: '/my-rides', color: '#f97316' },
              { label: 'Add Fuel Log', path: '/fuel-log', color: '#3b82f6' },
              { label: 'Add Mileage Entry', path: '/mileage-log', color: '#22c55e' },
              { label: '🚨 Mark Vehicle Stuck', path: '/emergency', color: '#ef4444' },
            ].map(a => (
              <Button
                key={a.label}
                block
                style={{ marginBottom: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a3f', color: a.color, height: 42, textAlign: 'left' }}
                onClick={() => navigate(a.path)}
              >
                {a.label}
              </Button>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
