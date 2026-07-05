import { useEffect, useState } from 'react'
import { Button, Spin } from 'antd'
import { ArrowRightOutlined, PlusCircleOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Badge from '../components/Badge'
import { IconVehicle, IconClock, IconCheck } from '../components/icons'

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

  const statusLabel: Record<string, string> = { PENDING: 'Pending', APPROVED: 'Approved', ASSIGNED: 'Assigned', IN_PROGRESS: 'In Progress' }

  return (
    <div>
      <div className="rd-greet">Welcome, {user?.name} 👋</div>
      <p className="rd-page-sub">Book a ride or track your current trip</p>

      <Spin spinning={loading}>
        {activeRide ? (
          <div style={{ background: '#FDEAEB', border: '1.5px solid #F6C6C9', borderRadius: 16, marginBottom: 20, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span className="rd-badge rd-b-approved" style={{ marginBottom: 12, display: 'inline-block' }}>
                  ● {activeRide.status.replace('_', ' ')}
                </span>
                <div style={{ color: 'var(--rd-ink)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{activeRide.pickupLocation}</div>
                <div style={{ color: 'var(--rd-ink-soft)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowRightOutlined /> {activeRide.dropLocation}
                </div>
                <div style={{ color: 'var(--rd-ink-faint)', fontSize: 12, marginTop: 6 }}>
                  {new Date(activeRide.scheduledDate).toLocaleDateString()} at {activeRide.scheduledTime}
                </div>
              </div>
              {activeRide.assignment?.driver && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--rd-ink-faint)', fontSize: 12 }}>Driver</div>
                  <div style={{ color: 'var(--rd-ink)', fontWeight: 600 }}>{activeRide.assignment.driver.name}</div>
                  <div style={{ color: 'var(--rd-ink-faint)', fontSize: 12 }}>{activeRide.assignment.vehicle?.vehicleNumber}</div>
                </div>
              )}
            </div>
            {activeRide.status === 'ASSIGNED' && (
              <>
                <div style={{ borderTop: '1px solid #F6C6C9', margin: '16px 0' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, background: '#fff', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                    <UserOutlined style={{ color: 'var(--rd-red)', marginRight: 6 }} />
                    <span style={{ fontSize: 13, color: 'var(--rd-ink)' }}>Waiting for driver to accept</span>
                  </div>
                  <Button danger style={{ flex: 0 }} onClick={() => handleCancel(activeRide.id)}>Cancel</Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="rd-notice-box">No active ride. Request one below!</div>
        )}
      </Spin>

      <div className="rd-stats">
        <div className="rd-stat-c">
          <div className="icon-c rd-ic-red"><IconVehicle /></div>
          <div className="value">{totalRides}</div>
          <div className="label">Total Rides</div>
        </div>
        <div className="rd-stat-c">
          <div className="icon-c rd-ic-amber"><IconClock /></div>
          <div className="value">{pending}</div>
          <div className="label">Pending</div>
        </div>
        <div className="rd-stat-c">
          <div className="icon-c rd-ic-good"><IconCheck /></div>
          <div className="value">{completed}</div>
          <div className="label">Completed</div>
        </div>
      </div>

      {rides.filter(r => !['IN_PROGRESS', 'ASSIGNED'].includes(r.status)).length > 0 && (
        <div className="rd-panel">
          <div className="rd-panel-head">
            <h3>Recent Rides</h3>
            <button className="rd-view-all" onClick={() => navigate('/my-rides')}>View All</button>
          </div>
          {rides
            .filter(r => !['IN_PROGRESS', 'ASSIGNED'].includes(r.status))
            .slice(0, 3)
            .map(r => (
              <div className="rd-recent-row" key={r.id}>
                <div>
                  <div className="route">{r.pickupLocation}<span className="arrow">→</span>{r.dropLocation}</div>
                  <div className="dt">{new Date(r.scheduledDate).toLocaleDateString()} at {r.scheduledTime}</div>
                </div>
                <Badge status={r.status} label={r.status.replace('_', ' ')} />
              </div>
            ))}
        </div>
      )}

      {rides.length === 0 && !loading && (
        <div className="rd-panel" style={{ textAlign: 'center', padding: 32, color: 'var(--rd-ink-faint)' }}>
          No rides yet
        </div>
      )}

      {availableRides.length > 0 && (
        <div className="rd-panel">
          <div className="rd-panel-head"><h3>🚏 Available Rides in Your Area</h3></div>
          <div style={{ padding: '18px 20px' }}>
            <p className="rd-page-sub" style={{ margin: '-8px 0 14px' }}>
              {availableRides.length} ride{availableRides.length > 1 ? 's' : ''} going out — join a similar route
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {availableRides.map(r => {
                const capacity = r.assignment?.vehicle?.capacity ?? 4
                const seatsLeft = capacity - r.passengers
                const isFull = seatsLeft <= 0
                return (
                  <div className="rd-share-card" key={r.id}>
                    <div className="rd-share-body">
                      <div style={{ display: 'flex' }}>
                        <div className="rd-route-dots"><div className="rd-dot" /><div className="rd-dot-line" /><div className="rd-dot end" /></div>
                        <div>
                          <div className="rd-share-route">{r.pickupLocation}</div>
                          <div className="rd-share-route drop">{r.dropLocation}</div>
                          <div className="rd-share-meta">
                            <span className="rd-meta-chip">📅 {new Date(r.scheduledDate).toLocaleDateString()} · {r.scheduledTime}</span>
                            <span className="rd-meta-chip">👤 {r.customer?.name}</span>
                            {r.assignment?.driver && (
                              <span className="rd-meta-chip">🚗 {r.assignment.driver.name} · {r.assignment.vehicle?.vehicleNumber}</span>
                            )}
                            <Badge status={r.status} label={statusLabel[r.status] ?? r.status} />
                          </div>
                        </div>
                      </div>
                      <div className="rd-seats-chip">
                        {isFull ? 0 : seatsLeft}
                        <div className="sub">of {capacity} seats {isFull ? 'full' : 'left'}</div>
                      </div>
                    </div>
                    <Button
                      type="primary" block disabled={isFull} icon={<PlusCircleOutlined />}
                      style={{ height: 40, borderRadius: 10, fontWeight: 600 }}
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
        </div>
      )}

      <Button
        type="primary" size="large" icon={<PlusCircleOutlined />} block
        style={{ height: 52, fontSize: 16, borderRadius: 12 }}
        onClick={() => navigate('/request-ride')}
      >
        Request a New Ride
      </Button>
    </div>
  )
}
