import { useEffect, useState } from 'react'
import { Tag, Button, Divider, Spin, Modal, Form, InputNumber, message } from 'antd'
import { ArrowRightOutlined, DashboardOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { buildGroups } from '../utils/rideGrouping'
import { IconVehicle, IconCheck, IconClock, IconBolt } from '../components/icons'

interface Ride {
  id: number
  status: string
  pickupLocation: string
  dropLocation: string
  scheduledDate: string
  scheduledTime: string
  passengers: number
  mergeGroupId?: string
  customer: { name: string }
  assignment?: { driver?: { id: number }; vehicle: { vehicleNumber: string } } | null
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

  // Use the exact same grouping logic as MyRides — single source of truth
  const allGroups = buildGroups(rides)
  const activeGroup = allGroups.find(g => g.some(r => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED')) ?? []
  const activeRide = activeGroup.find(r => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED') ?? null

  const isSharedGroup = activeGroup.length > 1
  const isMergedGroup = isSharedGroup && activeGroup.some(r => r.mergeGroupId)
  const totalGroupPax = activeGroup.reduce((s, r) => s + r.passengers, 0)

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
      <div className="rd-greet">Welcome back, {user?.name} <span className="wave">👋</span></div>
      <p className="rd-page-sub">Here's your activity summary for today</p>

      <div className="rd-stats">
        <div className="rd-stat">
          <div className="top"><span className="label">Today's Rides</span><div className="icon rd-ic-red"><IconVehicle /></div></div>
          <div className="value">{todayRides.length}</div>
        </div>
        <div className="rd-stat">
          <div className="top"><span className="label">Completed</span><div className="icon rd-ic-good"><IconCheck /></div></div>
          <div className="value">{completed}</div>
        </div>
        <div className="rd-stat">
          <div className="top"><span className="label">Assigned</span><div className="icon rd-ic-amber"><IconClock /></div></div>
          <div className="value">{pending}</div>
        </div>
        <div className="rd-stat">
          <div className="top"><span className="label">In Progress</span><div className="icon rd-ic-blue"><IconBolt /></div></div>
          <div className="value">{inProgress}</div>
        </div>
      </div>

      <div className="rd-split">
        <div className="rd-panel">
          <div className="rd-panel-head"><h3>Current Assignment</h3></div>
          <Spin spinning={loading}>
            {!activeRide ? (
              <div className="rd-empty-box"><div className="ic">📭</div>No active ride right now</div>
            ) : (
              <div style={{ margin: 20, background: '#FDEAEB', border: `1.5px solid ${isSharedGroup ? '#E01E2B' : '#F6C6C9'}`, borderRadius: 10, padding: 20 }}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag color={activeRide.status === 'IN_PROGRESS' ? 'orange' : 'blue'}>
                      {activeRide.status.replace('_', ' ')}
                    </Tag>
                    {isMergedGroup && <span className="rd-badge rd-b-merged">🔗 Merged · {activeGroup.length} customers</span>}
                    {isSharedGroup && !isMergedGroup && <span className="rd-badge rd-b-shared">Shared · {activeGroup.length} customers</span>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--rd-ink-faint)', fontSize: 11 }}>Vehicle</div>
                    <div style={{ color: 'var(--rd-red)', fontWeight: 700, fontSize: 14 }}>{activeRide.assignment?.vehicle?.vehicleNumber ?? '—'}</div>
                  </div>
                </div>

                {/* Route */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--rd-ink-faint)', fontSize: 11, marginBottom: 2 }}>FROM</div>
                    <div style={{ color: 'var(--rd-ink)', fontWeight: 600 }}>{activeRide.pickupLocation}</div>
                  </div>
                  <ArrowRightOutlined style={{ color: 'var(--rd-red)', fontSize: 16 }} />
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ color: 'var(--rd-ink-faint)', fontSize: 11, marginBottom: 2 }}>TO</div>
                    <div style={{ color: 'var(--rd-ink)', fontWeight: 600 }}>{activeRide.dropLocation}</div>
                  </div>
                </div>

                {/* Passenger summary */}
                <div style={{ color: 'var(--rd-ink-soft)', fontSize: 12, marginBottom: 10 }}>
                  {isSharedGroup
                    ? `${activeGroup.length} customers · ${totalGroupPax} total passenger${totalGroupPax > 1 ? 's' : ''}`
                    : `${activeRide.passengers} passenger${activeRide.passengers > 1 ? 's' : ''}`}
                </div>

                {/* Customer list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {activeGroup.map((r, idx) => (
                    <div key={r.id} style={{
                      background: '#fff',
                      border: '1px solid #F6C6C9',
                      borderRadius: 8, padding: '8px 12px',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: isSharedGroup ? `hsl(${(idx * 60) % 360}, 60%, 45%)` : 'var(--rd-red)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
                      }}>
                        {r.customer?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: 'var(--rd-ink)', fontWeight: 600, fontSize: 13 }}>{r.customer?.name}</div>
                        <div style={{ color: 'var(--rd-ink-soft)', fontSize: 11 }}>
                          {r.passengers} pax
                          {isMergedGroup && <span style={{ color: 'var(--rd-purple)', marginLeft: 6 }}>{r.pickupLocation} → {r.dropLocation}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Divider style={{ borderColor: '#F6C6C9', margin: '0 0 14px' }} />

                {activeRide.status === 'IN_PROGRESS' && (
                  <Button type="primary" block icon={<DashboardOutlined />}
                    style={{ height: 42, fontWeight: 600 }}
                    onClick={() => setEndMileageOpen(true)}
                  >
                    {isSharedGroup ? `Complete ${isMergedGroup ? 'Merged' : 'Shared'} Ride for All ${activeGroup.length} Customers` : 'Complete Ride'} & Record End Mileage
                  </Button>
                )}
                {activeRide.status === 'ASSIGNED' && (
                  <Button type="primary" block icon={<DashboardOutlined />}
                    style={{ background: 'var(--rd-good)', borderColor: 'var(--rd-good)', height: 42, fontWeight: 600 }}
                    onClick={() => setStartMileageOpen(true)}
                  >
                    {isSharedGroup ? `Accept All ${activeGroup.length} ${isMergedGroup ? 'Merged' : 'Shared'} Rides` : 'Accept Ride'} & Record Start Mileage
                  </Button>
                )}
              </div>
            )}
          </Spin>
        </div>

        <div className="rd-panel">
          <div className="rd-panel-head"><h3>Quick Actions</h3></div>
          <div className="rd-quick-actions">
            <button className="rd-qa-btn rd-qa-red" onClick={() => navigate('/my-rides')}>View All My Rides</button>
            <button className="rd-qa-btn rd-qa-blue" onClick={() => navigate('/fuel-log')}>Add Fuel Log</button>
            <button className="rd-qa-btn rd-qa-good" onClick={() => navigate('/mileage-log')}>Add Mileage Entry</button>
            <button className="rd-qa-btn rd-qa-danger" onClick={() => navigate('/emergency')}>🚨 Mark Vehicle Stuck</button>
          </div>
        </div>
      </div>

      {/* Start Mileage Modal */}
      <Modal
        title={<span><DashboardOutlined style={{ color: '#12894F', marginRight: 8 }} />Record Start Mileage</span>}
        open={startMileageOpen}
        onCancel={() => { setStartMileageOpen(false); startMileageForm.resetFields() }}
        footer={null}
      >
        {activeRide && (
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#374151' }}>
            <strong>{activeRide.pickupLocation} → {activeRide.dropLocation}</strong><br />
            {isSharedGroup
              ? <span style={{ color: '#6b7280' }}>{activeGroup.length} customers · {totalGroupPax} total passengers ({activeGroup.map(r => r.customer?.name).join(', ')})</span>
              : <span style={{ color: '#6b7280' }}>Customer: {activeRide.customer?.name} · {activeRide.passengers} passenger{activeRide.passengers > 1 ? 's' : ''}</span>}
          </div>
        )}
        <Form form={startMileageForm} layout="vertical" onFinish={handleStartMileageSubmit}>
          <Form.Item label="Current Odometer Reading (km)" name="startMileage" rules={[{ required: true, message: 'Please enter current mileage' }]}>
            <InputNumber min={0} style={{ width: '100%' }} addonAfter="km" placeholder="e.g. 45,200" />
          </Form.Item>
          <Button htmlType="submit" type="primary" block loading={actionLoading}
            style={{ background: '#12894F', borderColor: '#12894F', height: 42, fontWeight: 600 }}>
            Accept Ride & Record Start Mileage
          </Button>
        </Form>
      </Modal>

      {/* End Mileage Modal */}
      <Modal
        title={<span><DashboardOutlined style={{ color: '#E01E2B', marginRight: 8 }} />Record End Mileage</span>}
        open={endMileageOpen}
        onCancel={() => { setEndMileageOpen(false); endMileageForm.resetFields() }}
        footer={null}
      >
        {activeRide && (
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#374151' }}>
            <strong>{activeRide.pickupLocation} → {activeRide.dropLocation}</strong><br />
            {isSharedGroup
              ? <span style={{ color: '#6b7280' }}>{activeGroup.length} customers · {totalGroupPax} total passengers ({activeGroup.map(r => r.customer?.name).join(', ')})</span>
              : <span style={{ color: '#6b7280' }}>Customer: {activeRide.customer?.name} · {activeRide.passengers} passenger{activeRide.passengers > 1 ? 's' : ''}</span>}
          </div>
        )}
        <Form form={endMileageForm} layout="vertical" onFinish={handleEndMileageSubmit}>
          <Form.Item label="End Odometer Reading (km)" name="endMileage" rules={[{ required: true, message: 'Please enter end mileage' }]}>
            <InputNumber min={0} style={{ width: '100%' }} addonAfter="km" placeholder="e.g. 45,500" />
          </Form.Item>
          <Button htmlType="submit" type="primary" block loading={actionLoading}
            style={{ height: 42, fontWeight: 600 }}>
            Complete Ride & Record End Mileage
          </Button>
        </Form>
      </Modal>
    </div>
  )
}
