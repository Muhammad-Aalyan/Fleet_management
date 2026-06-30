import { useEffect, useState } from 'react'
import { Row, Col, Card, Tag, Button, Typography, Divider, Empty, Spin, Badge } from 'antd'
import { CarOutlined, ClockCircleOutlined, CheckCircleOutlined, ArrowRightOutlined, PlusCircleOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons'
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
  assignment?: {
    driver: { name: string; phone: string }
    vehicle: { vehicleNumber: string; model: string; capacity: number }
  } | null
}

interface AvailableRide {
  id: number
  status: string
  pickupLocation: string
  dropLocation: string
  scheduledDate: string
  scheduledTime: string
  passengers: number
  customer: { name: string }
  assignment?: {
    driver: { name: string }
    vehicle: { vehicleNumber: string; model: string; capacity: number }
  } | null
}

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [rides, setRides] = useState<Ride[]>([])
  const [availableRides, setAvailableRides] = useState<AvailableRide[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRides = async () => {
    setLoading(true)
    try {
      const [myRes, availRes] = await Promise.all([
        api.get('/rides/my'),
        api.get('/rides/available-all'),
      ])
      setRides(myRes.data)
      setAvailableRides(availRes.data)
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchRides() }, [])

  const activeRide = rides.find(r => ['IN_PROGRESS', 'ASSIGNED'].includes(r.status))
  const totalRides = rides.length
  const pending = rides.filter(r => ['PENDING', 'APPROVED', 'ASSIGNED'].includes(r.status)).length
  const completed = rides.filter(r => r.status === 'COMPLETED').length

  const handleCancel = async (id: number) => {
    try {
      await api.patch(`/rides/${id}/cancel`)
      fetchRides()
    } catch { /* handled silently */ }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Welcome, {user?.name} 👋</Title>
        <Text type="secondary">Book a ride or track your current trip</Text>
      </div>

      <Spin spinning={loading}>
        {/* Active Ride Banner — only show if there's an active ride */}
        {activeRide ? (
          <Card style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            border: 'none', borderRadius: 16, marginBottom: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Tag color={activeRide.status === 'IN_PROGRESS' ? 'green' : 'blue'} style={{ marginBottom: 12 }}>
                  ● {activeRide.status.replace('_', ' ')}
                </Tag>
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{activeRide.pickupLocation}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowRightOutlined /> {activeRide.dropLocation}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 6 }}>
                  {new Date(activeRide.scheduledDate).toLocaleDateString()} at {activeRide.scheduledTime}
                </div>
              </div>
              {activeRide.assignment?.driver && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Driver</div>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{activeRide.assignment.driver.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{activeRide.assignment.vehicle?.vehicleNumber}</div>
                </div>
              )}
            </div>
            {activeRide.status === 'ASSIGNED' && (
              <>
                <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '16px 0' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                    <UserOutlined style={{ color: '#fff', marginRight: 6 }} />
                    <Text style={{ color: '#fff', fontSize: 13 }}>Waiting for driver to accept</Text>
                  </div>
                  <Button danger style={{ flex: 0 }} onClick={() => handleCancel(activeRide.id)}>Cancel</Button>
                </div>
              </>
            )}
          </Card>
        ) : (
          <Card style={{ border: '2px dashed #ede9fe', borderRadius: 16, marginBottom: 24, textAlign: 'center', padding: '8px 0' }}>
            <Text type="secondary">No active ride. Request one below!</Text>
          </Card>
        )}
      </Spin>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Rides', value: totalRides, icon: <CarOutlined />, color: '#7c3aed' },
          { label: 'Pending', value: pending, icon: <ClockCircleOutlined />, color: '#faad14' },
          { label: 'Completed', value: completed, icon: <CheckCircleOutlined />, color: '#22c55e' },
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

      {/* Recent Rides */}
      {rides.filter(r => !['IN_PROGRESS', 'ASSIGNED'].includes(r.status)).length > 0 && (
        <Card
          title="Recent Rides"
          extra={<Button type="link" style={{ color: '#7c3aed' }} onClick={() => navigate('/my-rides')}>View All</Button>}
          style={{ marginBottom: 24, border: '1px solid #ede9fe' }}
        >
          {rides
            .filter(r => !['IN_PROGRESS', 'ASSIGNED'].includes(r.status))
            .slice(0, 3)
            .map(r => (
              <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid #f5f3ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: 2 }}>
                      {r.pickupLocation} <span style={{ color: '#7c3aed' }}>→</span> {r.dropLocation}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(r.scheduledDate).toLocaleDateString()} at {r.scheduledTime}
                    </Text>
                  </div>
                  <Tag color={r.status === 'COMPLETED' ? 'green' : r.status === 'CANCELLED' ? 'default' : 'gold'}>
                    {r.status.replace('_', ' ')}
                  </Tag>
                </div>
              </div>
            ))}
        </Card>
      )}

      {rides.length === 0 && !loading && (
        <Card style={{ marginBottom: 24, border: '1px solid #ede9fe', textAlign: 'center', padding: '20px 0' }}>
          <Empty description="No rides yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      )}

      {/* Available Rides from other customers */}
      {availableRides.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TeamOutlined style={{ color: '#fff', fontSize: 16 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>Available Rides in Your Area</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{availableRides.length} ride{availableRides.length > 1 ? 's' : ''} going out — join a similar route</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {availableRides.map(r => {
              const capacity = r.assignment?.vehicle?.capacity ?? 4
              const seatsLeft = capacity - r.passengers
              const isFull = seatsLeft <= 0
              const statusLabel: Record<string, string> = { PENDING: 'Pending', APPROVED: 'Approved', ASSIGNED: 'Assigned', IN_PROGRESS: 'In Progress' }
              const statusDot: Record<string, string> = { PENDING: '#faad14', APPROVED: '#3b82f6', ASSIGNED: '#8b5cf6', IN_PROGRESS: '#22c55e' }
              return (
                <div key={r.id} style={{
                  background: '#fff',
                  border: '1px solid #ede9fe',
                  borderRadius: 16,
                  padding: '18px 20px',
                  boxShadow: '0 2px 8px rgba(124,58,237,0.06)',
                  transition: 'box-shadow 0.2s',
                }}>
                  {/* Route row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7c3aed', margin: '0 auto 2px' }} />
                        <div style={{ width: 1, height: 20, background: '#c4b5fd', margin: '0 auto' }} />
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: '#a855f7', margin: '2px auto 0' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.pickupLocation}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#7c3aed', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.dropLocation}
                        </div>
                      </div>
                    </div>

                    {/* Seats badge */}
                    <div style={{
                      background: isFull ? '#fff1f0' : 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                      border: `1.5px solid ${isFull ? '#ffa39e' : '#c4b5fd'}`,
                      borderRadius: 12, padding: '8px 14px', textAlign: 'center', minWidth: 72,
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: isFull ? '#ff4d4f' : '#7c3aed', lineHeight: 1 }}>{seatsLeft}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>of {capacity} seats</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: isFull ? '#ff4d4f' : '#7c3aed' }}>{isFull ? 'FULL' : 'LEFT'}</div>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f9fafb', borderRadius: 8, padding: '4px 10px' }}>
                      <span style={{ fontSize: 13 }}>📅</span>
                      <span style={{ fontSize: 12, color: '#374151' }}>{new Date(r.scheduledDate).toLocaleDateString()} · {r.scheduledTime}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f9fafb', borderRadius: 8, padding: '4px 10px' }}>
                      <span style={{ fontSize: 13 }}>👤</span>
                      <span style={{ fontSize: 12, color: '#374151' }}>{r.customer?.name}</span>
                    </div>
                    {r.assignment?.driver && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f9fafb', borderRadius: 8, padding: '4px 10px' }}>
                        <span style={{ fontSize: 13 }}>🚗</span>
                        <span style={{ fontSize: 12, color: '#374151' }}>{r.assignment.driver.name} · {r.assignment.vehicle?.vehicleNumber}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f9fafb', borderRadius: 8, padding: '4px 10px' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusDot[r.status] ?? '#999', display: 'inline-block' }} />
                      <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{statusLabel[r.status] ?? r.status}</span>
                    </div>
                  </div>

                  {/* Action button */}
                  <Button
                    type="primary"
                    block
                    disabled={isFull}
                    icon={<PlusCircleOutlined />}
                    style={{
                      height: 40, borderRadius: 10, fontWeight: 600,
                      background: isFull ? undefined : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                      borderColor: isFull ? undefined : '#7c3aed',
                    }}
                    onClick={() => navigate('/request-ride', {
                      state: { pickupLocation: r.pickupLocation, dropLocation: r.dropLocation, scheduledDate: r.scheduledDate, scheduledTime: r.scheduledTime }
                    })}
                  >
                    {isFull ? 'Ride Full' : 'Request This Ride'}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Button
        type="primary" size="large" icon={<PlusCircleOutlined />} block
        style={{ height: 52, fontSize: 16, borderRadius: 12, background: '#7c3aed', borderColor: '#7c3aed' }}
        onClick={() => navigate('/request-ride')}
      >
        Request a New Ride
      </Button>
    </div>
  )
}
