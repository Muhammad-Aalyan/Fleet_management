import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Tag, Button, Typography, Divider, Empty, Spin, Modal, Form, InputNumber, message } from 'antd'
import { CarOutlined, CheckCircleOutlined, ClockCircleOutlined, ThunderboltOutlined, ArrowRightOutlined, DashboardOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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
  customer: { name: string }
  assignment?: { vehicle: { vehicleNumber: string } } | null
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Start mileage modal (Accept)
  const [startMileageOpen, setStartMileageOpen] = useState(false)
  const [startMileageForm] = Form.useForm()

  // End mileage modal (Complete)
  const [endMileageOpen, setEndMileageOpen] = useState(false)
  const [endMileageForm] = Form.useForm()

  const fetchRides = async () => {
    setLoading(true)
    try {
      const res = await api.get('/rides/driver')
      setRides(res.data)
    } catch { /* silently fail on dashboard */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchRides() }, [])

  const activeRide = rides.find(r => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED')
  const todayRides = rides.filter(r => new Date(r.scheduledDate).toDateString() === new Date().toDateString())
  const completed = rides.filter(r => r.status === 'COMPLETED').length
  const pending = rides.filter(r => r.status === 'ASSIGNED').length
  const inProgress = rides.filter(r => r.status === 'IN_PROGRESS').length

  const handleStartMileageSubmit = async (values: { startMileage: number }) => {
    if (!activeRide) return
    setActionLoading(true)
    try {
      await api.patch(`/rides/${activeRide.id}/accept`)
      const log = await api.post('/mileage', {
        startMileage: values.startMileage,
        endMileage: values.startMileage,
        rideRequestId: activeRide.id,
      })
      localStorage.setItem('activeMileageLogId', String(log.data.id))
      message.success('Ride accepted! Start mileage recorded.')
      setStartMileageOpen(false)
      startMileageForm.resetFields()
      fetchRides()
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed to accept ride') }
    finally { setActionLoading(false) }
  }

  const handleEndMileageSubmit = async (values: { endMileage: number }) => {
    if (!activeRide) return
    setActionLoading(true)
    try {
      const savedId = localStorage.getItem('activeMileageLogId')
      let logId = savedId ? parseInt(savedId) : null
      if (!logId) {
        const found = await api.get(`/mileage/by-ride/${activeRide.id}`)
        logId = found.data?.id ?? null
      }
      if (logId) {
        await api.patch(`/mileage/${logId}/end`, { endMileage: values.endMileage })
      } else {
        await api.post('/mileage', { startMileage: values.endMileage, endMileage: values.endMileage, rideRequestId: activeRide.id })
      }
      await api.patch(`/rides/${activeRide.id}/complete`)
      localStorage.removeItem('activeMileageLogId')
      message.success('Ride completed! End mileage recorded.')
      setEndMileageOpen(false)
      endMileageForm.resetFields()
      fetchRides()
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed to complete ride') }
    finally { setActionLoading(false) }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: '#fff' }}>Welcome back, {user?.name} 👋</Title>
        <Text style={{ color: '#888' }}>Here's your activity summary for today</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: "Today's Rides", value: todayRides.length, icon: <CarOutlined />, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
          { title: 'Completed', value: completed, icon: <CheckCircleOutlined />, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          { title: 'Assigned', value: pending, icon: <ClockCircleOutlined />, color: '#faad14', bg: 'rgba(250,173,20,0.1)' },
          { title: 'In Progress', value: inProgress, icon: <ThunderboltOutlined />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
        ].map(s => (
          <Col xs={12} md={6} key={s.title}>
            <Card className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <Statistic
                  title={<span style={{ color: '#aaa', fontSize: 13 }}>{s.title}</span>}
                  value={s.value}
                  valueStyle={{ color: s.color, fontSize: 26, fontWeight: 700 }}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title={<span style={{ color: '#fff' }}>Current Assignment</span>}
            style={{ borderRadius: 12, border: '1px solid #2a2a3f', background: '#1e1e2e' }}
          >
            <Spin spinning={loading}>
              {!activeRide ? (
                <Empty
                  description={<Text style={{ color: '#6b7280' }}>No active ride right now</Text>}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 10, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Tag color={activeRide.status === 'IN_PROGRESS' ? 'orange' : 'blue'} style={{ marginBottom: 12 }}>
                        {activeRide.status.replace('_', ' ')}
                      </Tag>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{activeRide.customer?.name}</div>
                      <div style={{ color: '#aaa', fontSize: 13 }}>{activeRide.passengers} Passenger{activeRide.passengers > 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#888', fontSize: 12 }}>Vehicle</div>
                      <div style={{ color: '#f97316', fontWeight: 700 }}>{activeRide.assignment?.vehicle?.vehicleNumber ?? '—'}</div>
                    </div>
                  </div>
                  <Divider style={{ borderColor: 'rgba(249,115,22,0.2)', margin: '16px 0' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>FROM</div>
                      <div style={{ color: '#fff', fontWeight: 500 }}>{activeRide.pickupLocation}</div>
                    </div>
                    <ArrowRightOutlined style={{ color: '#f97316', fontSize: 18 }} />
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>TO</div>
                      <div style={{ color: '#fff', fontWeight: 500 }}>{activeRide.dropLocation}</div>
                    </div>
                  </div>
                  {activeRide.status === 'IN_PROGRESS' && (
                    <Button type="primary" block icon={<DashboardOutlined />}
                      style={{ marginTop: 16, background: '#f97316', border: 'none', height: 42 }}
                      onClick={() => setEndMileageOpen(true)}
                    >
                      Complete Ride & Record End Mileage
                    </Button>
                  )}
                  {activeRide.status === 'ASSIGNED' && (
                    <Button type="primary" block icon={<DashboardOutlined />}
                      style={{ marginTop: 16, background: '#22c55e', borderColor: '#22c55e', height: 42 }}
                      onClick={() => setStartMileageOpen(true)}
                    >
                      Accept Ride & Record Start Mileage
                    </Button>
                  )}
                </div>
              )}
            </Spin>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={<span style={{ color: '#fff' }}>Quick Actions</span>}
            style={{ borderRadius: 12, border: '1px solid #2a2a3f', background: '#1e1e2e' }}
          >
            {[
              { label: 'View All My Rides', path: '/my-rides', color: '#f97316' },
              { label: 'Add Fuel Log', path: '/fuel-log', color: '#3b82f6' },
              { label: 'Add Mileage Entry', path: '/mileage-log', color: '#22c55e' },
              { label: '🚨 Mark Vehicle Stuck', path: '/emergency', color: '#ef4444' },
            ].map(a => (
              <Button key={a.label} block onClick={() => navigate(a.path)}
                style={{ marginBottom: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a3f', color: a.color, height: 42, textAlign: 'left' }}>
                {a.label}
              </Button>
            ))}
          </Card>
        </Col>
      </Row>

      {/* Start Mileage Modal */}
      <Modal
        title={<span><DashboardOutlined style={{ color: '#22c55e', marginRight: 8 }} />Record Start Mileage</span>}
        open={startMileageOpen}
        onCancel={() => { setStartMileageOpen(false); startMileageForm.resetFields() }}
        footer={null}
      >
        {activeRide && (
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#374151' }}>
            <strong>{activeRide.pickupLocation} → {activeRide.dropLocation}</strong><br />
            <span style={{ color: '#6b7280' }}>Customer: {activeRide.customer?.name} · {activeRide.passengers} passenger{activeRide.passengers > 1 ? 's' : ''}</span>
          </div>
        )}
        <Form form={startMileageForm} layout="vertical" onFinish={handleStartMileageSubmit}>
          <Form.Item label="Current Odometer Reading (km)" name="startMileage" rules={[{ required: true, message: 'Please enter current mileage' }]}>
            <InputNumber min={0} style={{ width: '100%' }} addonAfter="km" placeholder="e.g. 45,200" />
          </Form.Item>
          <Button htmlType="submit" type="primary" block loading={actionLoading}
            style={{ background: '#22c55e', borderColor: '#22c55e', height: 42, fontWeight: 600 }}>
            Accept Ride & Record Start Mileage
          </Button>
        </Form>
      </Modal>

      {/* End Mileage Modal */}
      <Modal
        title={<span><DashboardOutlined style={{ color: '#f97316', marginRight: 8 }} />Record End Mileage</span>}
        open={endMileageOpen}
        onCancel={() => { setEndMileageOpen(false); endMileageForm.resetFields() }}
        footer={null}
      >
        {activeRide && (
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#374151' }}>
            <strong>{activeRide.pickupLocation} → {activeRide.dropLocation}</strong><br />
            <span style={{ color: '#6b7280' }}>Customer: {activeRide.customer?.name} · {activeRide.passengers} passenger{activeRide.passengers > 1 ? 's' : ''}</span>
          </div>
        )}
        <Form form={endMileageForm} layout="vertical" onFinish={handleEndMileageSubmit}>
          <Form.Item label="End Odometer Reading (km)" name="endMileage" rules={[{ required: true, message: 'Please enter end mileage' }]}>
            <InputNumber min={0} style={{ width: '100%' }} addonAfter="km" placeholder="e.g. 45,500" />
          </Form.Item>
          <Button htmlType="submit" type="primary" block loading={actionLoading}
            style={{ background: '#f97316', borderColor: '#f97316', height: 42, fontWeight: 600 }}>
            Complete Ride & Record End Mileage
          </Button>
        </Form>
      </Modal>
    </div>
  )
}
