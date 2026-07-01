import { useState, useEffect, useCallback } from 'react'
import { Tag, Button, Card, Typography, Select, Modal, Form, Input, InputNumber, message, Spin, Badge } from 'antd'
import { CheckOutlined, CloseOutlined, ReloadOutlined, TeamOutlined, UserOutlined, ArrowRightOutlined, DashboardOutlined } from '@ant-design/icons'
import api from '../api/axios'
import { groupKey, buildGroups } from '../utils/rideGrouping'

const { Title, Text } = Typography
const { Option } = Select

const statusColors: Record<string, string> = {
  ASSIGNED: 'blue', IN_PROGRESS: 'orange', COMPLETED: 'green', CANCELLED: 'default', REJECTED: 'red',
}

interface Ride {
  id: number
  status: string
  pickupLocation: string
  dropLocation: string
  scheduledDate: string
  scheduledTime: string
  passengers: number
  purpose?: string
  mergeGroupId?: string
  customer: { name: string; phone: string }
  assignment?: { driver?: { id: number }; vehicle: { vehicleNumber: string; model: string }; completedAt?: string } | null
}


export default function MyRides() {
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('ALL')

  const [rejectRide, setRejectRide] = useState<Ride | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectForm] = Form.useForm()
  const [actionLoading, setActionLoading] = useState(false)

  // Start mileage modal (on Accept)
  const [startMileageOpen, setStartMileageOpen] = useState(false)
  const [startMileageForm] = Form.useForm()
  const [pendingAcceptRide, setPendingAcceptRide] = useState<Ride | null>(null)

  // End mileage modal (on Complete)
  const [endMileageOpen, setEndMileageOpen] = useState(false)
  const [endMileageForm] = Form.useForm()
  const [pendingCompleteRide, setPendingCompleteRide] = useState<Ride | null>(null)
  const [activeMileageLogId, setActiveMileageLogId] = useState<number | null>(() => {
    const saved = localStorage.getItem('activeMileageLogId')
    return saved ? parseInt(saved) : null
  })

  const fetchRides = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/rides/driver')
      setRides(res.data)
    } catch { message.error('Failed to load rides') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRides() }, [fetchRides])

  const handleAcceptClick = (ride: Ride) => {
    setPendingAcceptRide(ride)
    setStartMileageOpen(true)
  }

  const handleStartMileageSubmit = async (values: { startMileage: number }) => {
    if (!pendingAcceptRide) return
    setActionLoading(true)
    try {
      await api.patch(`/rides/${pendingAcceptRide.id}/accept`)
      const log = await api.post('/mileage', {
        startMileage: values.startMileage,
        endMileage: values.startMileage,
        rideRequestId: pendingAcceptRide.id,
      })
      setActiveMileageLogId(log.data.id)
      localStorage.setItem('activeMileageLogId', String(log.data.id))
      message.success('Ride accepted! Start mileage recorded.')
      setStartMileageOpen(false)
      startMileageForm.resetFields()
      setPendingAcceptRide(null)
      fetchRides()
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed to accept ride') }
    finally { setActionLoading(false) }
  }

  const handleCompleteClick = (ride: Ride) => {
    setPendingCompleteRide(ride)
    setEndMileageOpen(true)
  }

  const handleEndMileageSubmit = async (values: { endMileage: number }) => {
    if (!pendingCompleteRide) return
    setActionLoading(true)
    try {
      // Look up mileage log: use in-memory ID first, then server lookup by rideRequestId
      let logId = activeMileageLogId
      if (!logId) {
        const found = await api.get(`/mileage/by-ride/${pendingCompleteRide.id}`)
        logId = found.data?.id ?? null
      }

      if (logId) {
        await api.patch(`/mileage/${logId}/end`, { endMileage: values.endMileage })
      } else {
        // No prior start entry — create a full record with same value for start as placeholder
        await api.post('/mileage', { startMileage: values.endMileage, endMileage: values.endMileage, rideRequestId: pendingCompleteRide.id })
      }

      await api.patch(`/rides/${pendingCompleteRide.id}/complete`)
      message.success('Ride completed! End mileage recorded.')
      setEndMileageOpen(false)
      endMileageForm.resetFields()
      setPendingCompleteRide(null)
      setActiveMileageLogId(null)
      localStorage.removeItem('activeMileageLogId')
      fetchRides()
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed to complete ride') }
    finally { setActionLoading(false) }
  }

  const handleRejectSubmit = async (values: { remarks: string }) => {
    if (!rejectRide) return
    setActionLoading(true)
    try {
      await api.patch(`/rides/${rejectRide.id}/driver-reject`, { remarks: values.remarks })
      message.success('Ride rejected. Admin has been notified to reassign.')
      setRejectOpen(false)
      rejectForm.resetFields()
      fetchRides()
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed to reject ride') }
    finally { setActionLoading(false) }
  }

  const filteredRides = rides.filter(r => filter === 'ALL' || r.status === filter)
  const groups = buildGroups(filteredRides)

  const isShared = (group: Ride[]) => group.length > 1

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ color: '#fff', margin: 0 }}>My Rides</Title>
        <Button icon={<ReloadOutlined />} onClick={fetchRides} style={{ color: '#fff', borderColor: '#374151', background: '#374151' }}>
          Refresh
        </Button>
      </div>

      <Card style={{ borderRadius: 12, border: '1px solid #2a2a3f', background: '#1e1e2e', marginBottom: 16 }}>
        <Select value={filter} onChange={setFilter} style={{ width: 180 }}>
          <Option value="ALL">All Rides</Option>
          <Option value="ASSIGNED">Assigned</Option>
          <Option value="IN_PROGRESS">In Progress</Option>
          <Option value="COMPLETED">Completed</Option>
        </Select>
      </Card>

      <Spin spinning={loading}>
        {groups.length === 0 && !loading && (
          <Card style={{ borderRadius: 12, border: '1px solid #2a2a3f', background: '#1e1e2e', textAlign: 'center', padding: 32 }}>
            <Text style={{ color: '#6b7280' }}>No rides found</Text>
          </Card>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groups.map((group) => {
            const rep = group[0] // representative ride (same route/schedule for all)
            const shared = isShared(group)
            const totalPax = group.reduce((sum, r) => sum + r.passengers, 0)

            const isMerged = group.some(r => r.mergeGroupId)

            return (
              <Card
                key={group.map(r => r.id).join('-')}
                style={{
                  borderRadius: 14,
                  border: (shared || isMerged) && rep.status === 'IN_PROGRESS'
                    ? '1.5px solid #f97316'
                    : isMerged ? '1.5px solid #7c3aed' : '1px solid #2a2a3f',
                  background: '#1e1e2e',
                  overflow: 'hidden',
                }}
                bodyStyle={{ padding: 0 }}
              >
                {/* Header bar */}
                <div style={{
                  background: isMerged ? 'rgba(124,58,237,0.1)' : shared ? 'rgba(249,115,22,0.1)' : 'rgba(59,130,246,0.08)',
                  padding: '14px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid #2a2a3f',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div>
                      {isMerged ? (
                        /* Merged rides may have different routes — show all */
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
                          🔗 Merged Ride — {group.length} customers
                        </div>
                      ) : (
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {rep.pickupLocation}
                          <ArrowRightOutlined style={{ color: '#f97316', fontSize: 12 }} />
                          {rep.dropLocation}
                        </div>
                      )}
                      <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>
                        {new Date(rep.scheduledDate).toLocaleDateString()} · {rep.scheduledTime}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isMerged && (
                      <span style={{ background: '#7c3aed', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <TeamOutlined /> Merged · {group.length} customers
                      </span>
                    )}
                    {shared && !isMerged && (
                      <Badge
                        count={
                          <span style={{ background: '#f97316', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <TeamOutlined /> Shared · {group.length} passengers
                          </span>
                        }
                      />
                    )}
                    <Tag color={statusColors[rep.status] ?? 'default'} style={{ fontWeight: 600, fontSize: 13 }}>
                      {rep.status.replace('_', ' ')}
                    </Tag>
                  </div>
                </div>

                {/* Passengers list */}
                <div style={{ padding: '12px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {(shared || isMerged) ? <TeamOutlined /> : <UserOutlined />}
                      {(shared || isMerged)
                        ? `${group.length} customers · ${totalPax} total passenger${totalPax > 1 ? 's' : ''}`
                        : `${totalPax} passenger${totalPax > 1 ? 's' : ''}`}
                    </div>
                    {rep.assignment?.vehicle && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, padding: '4px 12px' }}>
                        <span style={{ fontSize: 15 }}>🚗</span>
                        <div>
                          <div style={{ color: '#f97316', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{rep.assignment.vehicle.vehicleNumber}</div>
                          <div style={{ color: '#9ca3af', fontSize: 11 }}>{rep.assignment.vehicle.model}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {group.map((r, idx) => (
                      <div key={r.id} style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid #2a2a3f',
                        borderRadius: 10,
                        padding: '10px 14px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: shared ? `hsl(${(idx * 60) % 360}, 70%, 45%)` : '#f97316',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: 13,
                          }}>
                            {r.customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ color: '#f9fafb', fontWeight: 600, fontSize: 14 }}>{r.customer.name}</div>
                            <div style={{ color: '#9ca3af', fontSize: 12 }}>
                              {r.customer.phone} · {r.passengers} pax
                              {isMerged && <span style={{ color: '#a78bfa', marginLeft: 6 }}>{r.pickupLocation} → {r.dropLocation}</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {/* Accept/Reject only shown on first passenger for ASSIGNED (affects all via backend) */}
                          {r.status === 'ASSIGNED' && idx === 0 && (
                            <>
                              <Button size="small" type="primary"
                                style={{ background: '#22c55e', borderColor: '#22c55e' }}
                                icon={<CheckOutlined />} loading={actionLoading}
                                onClick={() => handleAcceptClick(r)}>
                                {shared ? 'Accept All' : 'Accept'}
                              </Button>
                              <Button size="small" danger icon={<CloseOutlined />}
                                onClick={() => { setRejectRide(r); setRejectOpen(true) }}>
                                Reject
                              </Button>
                            </>
                          )}
                          {r.status === 'ASSIGNED' && idx > 0 && !isMerged && (
                            <Tag color="blue" style={{ margin: 0 }}>Waiting for accept</Tag>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Complete button — single button completes all passengers */}
                  {rep.status === 'IN_PROGRESS' && (
                    <Button
                      type="primary" block icon={<CheckOutlined />}
                      style={{ marginTop: 14, height: 42, borderRadius: 10, background: '#f97316', borderColor: '#f97316', fontWeight: 600 }}
                      loading={actionLoading}
                      onClick={() => handleCompleteClick(group[0])}
                    >
                      {(shared || isMerged) ? `Complete Ride for All ${group.length} Customers` : 'Complete Ride'}
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </Spin>

      {/* Start Mileage Modal */}
      <Modal
        title={<span><DashboardOutlined style={{ color: '#f97316', marginRight: 8 }} />Record Start Mileage</span>}
        open={startMileageOpen}
        onCancel={() => { setStartMileageOpen(false); startMileageForm.resetFields(); setPendingAcceptRide(null) }}
        footer={null}
      >
        {pendingAcceptRide && (
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#374151' }}>
            <strong>{pendingAcceptRide.pickupLocation} → {pendingAcceptRide.dropLocation}</strong><br />
            <span style={{ color: '#6b7280' }}>Customer: {pendingAcceptRide.customer.name} · {pendingAcceptRide.passengers} passenger{pendingAcceptRide.passengers > 1 ? 's' : ''}</span>
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
        onCancel={() => { setEndMileageOpen(false); endMileageForm.resetFields(); setPendingCompleteRide(null) }}
        footer={null}
      >
        {pendingCompleteRide && (() => {
          const key = groupKey(pendingCompleteRide)
          const grp = rides.filter(r => groupKey(r) === key)
          const totalPax = grp.reduce((s, r) => s + r.passengers, 0)
          return (
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#374151' }}>
              <strong>{pendingCompleteRide.pickupLocation} → {pendingCompleteRide.dropLocation}</strong><br />
              {grp.length > 1
                ? <span style={{ color: '#6b7280' }}>{grp.length} customers · {totalPax} total passengers ({grp.map(r => r.customer.name).join(', ')})</span>
                : <span style={{ color: '#6b7280' }}>Customer: {pendingCompleteRide.customer.name} · {pendingCompleteRide.passengers} passengers</span>
              }
            </div>
          )
        })()}
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

      {/* Reject Modal */}
      <Modal title="Reject Ride" open={rejectOpen}
        onCancel={() => { setRejectOpen(false); rejectForm.resetFields() }}
        onOk={() => rejectForm.submit()} okText="Confirm Reject"
        okButtonProps={{ danger: true, loading: actionLoading }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Rejecting ride for <strong>{rejectRide?.customer?.name}</strong>:<br />
          {rejectRide?.pickupLocation} → {rejectRide?.dropLocation}
        </Text>
        <Form form={rejectForm} layout="vertical" onFinish={handleRejectSubmit}>
          <Form.Item name="remarks" label="Reason for Rejection"
            rules={[{ required: true, message: 'Please enter a reason for rejection' }]}>
            <Input.TextArea rows={4} placeholder="e.g. Vehicle breakdown, personal emergency, out of area..." />
          </Form.Item>
        </Form>
        <Text type="warning" style={{ fontSize: 12 }}>
          Admin will be notified and will reassign another driver.
        </Text>
      </Modal>
    </div>
  )
}
