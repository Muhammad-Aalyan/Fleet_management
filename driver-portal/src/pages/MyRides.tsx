import { useState, useEffect, useCallback } from 'react'
import { Button, Select, Modal, Form, Input, InputNumber, message, Spin } from 'antd'
import { CheckOutlined, CloseOutlined, ReloadOutlined, DashboardOutlined } from '@ant-design/icons'
import api from '../api/axios'
import RdBadge from '../components/Badge'
import { groupKey, buildGroups } from '../utils/rideGrouping'

const { Option } = Select

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
      <div className="rd-row-between">
        <div className="rd-page-title" style={{ margin: 0 }}>My Rides</div>
        <Button icon={<ReloadOutlined />} onClick={fetchRides} style={{ background: '#0C0D10', borderColor: '#0C0D10', color: '#fff' }}>
          Refresh
        </Button>
      </div>

      <div className="rd-panel">
        <div className="rd-filter-row">
          <Select value={filter} onChange={setFilter} style={{ width: 180 }}>
            <Option value="ALL">All Rides</Option>
            <Option value="ASSIGNED">Assigned</Option>
            <Option value="IN_PROGRESS">In Progress</Option>
            <Option value="COMPLETED">Completed</Option>
          </Select>
        </div>

        <Spin spinning={loading}>
          {groups.length === 0 && !loading && (
            <div className="rd-empty-box">No rides found</div>
          )}

          <div style={{ padding: groups.length ? '18px 20px' : 0 }}>
            {groups.map((group) => {
              const rep = group[0] // representative ride (same route/schedule for all)
              const shared = isShared(group)
              const totalPax = group.reduce((sum, r) => sum + r.passengers, 0)
              const isMerged = group.some(r => r.mergeGroupId)

              return (
                <div
                  key={group.map(r => r.id).join('-')}
                  className={`rd-ride-card${isMerged ? ' merged' : shared && rep.status === 'IN_PROGRESS' ? ' shared-active' : ''}`}
                >
                  {/* Header bar */}
                  <div className="rd-ride-head">
                    <div>
                      {isMerged ? (
                        <div className="route">🔗 Merged Ride — {group.length} customers</div>
                      ) : (
                        <div className="route">{rep.pickupLocation}<span className="arrow">→</span>{rep.dropLocation}</div>
                      )}
                      <div className="datetime">{new Date(rep.scheduledDate).toLocaleDateString()} · {rep.scheduledTime}</div>
                    </div>
                    <div className="badges">
                      {isMerged && <span className="rd-badge rd-b-merged">🔗 Merged · {group.length} customers</span>}
                      {shared && !isMerged && <span className="rd-badge rd-b-shared">👥 Shared · {group.length} passengers</span>}
                      <RdBadge status={rep.status} label={rep.status.replace('_', ' ')} />
                    </div>
                  </div>

                  {/* Passengers list */}
                  <div className="rd-ride-body">
                    <div className="rd-pax-line">
                      <span>👤 {(shared || isMerged) ? `${group.length} customers · ${totalPax} total passenger${totalPax > 1 ? 's' : ''}` : `${totalPax} passenger${totalPax > 1 ? 's' : ''}`}</span>
                    </div>

                    <div>
                      {group.map((r, idx) => (
                        <div key={r.id} className="rd-cust-row">
                          <div className="rd-cust-left">
                            <div className="rd-cust-avatar" style={{ background: shared ? `hsl(${(idx * 60) % 360}, 60%, 45%)` : 'var(--rd-red)' }}>
                              {r.customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="rd-cell-strong">{r.customer.name}</div>
                              <div className="rd-cell-sub">
                                {r.customer.phone} · {r.passengers} pax
                                {isMerged && <span style={{ color: 'var(--rd-purple)', marginLeft: 6 }}>{r.pickupLocation} → {r.dropLocation}</span>}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {idx === 0 && rep.assignment?.vehicle && (
                              <div className="rd-veh-chip">
                                {rep.assignment.vehicle.vehicleNumber}
                                <span className="model">{rep.assignment.vehicle.model}</span>
                              </div>
                            )}
                            {/* Accept/Reject only shown on first passenger for ASSIGNED (affects all via backend) */}
                            {r.status === 'ASSIGNED' && idx === 0 && (
                              <>
                                <Button size="small" type="primary"
                                  style={{ background: 'var(--rd-good)', borderColor: 'var(--rd-good)' }}
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
                              <span className="rd-badge rd-b-approved">Waiting for accept</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Complete button — single button completes all passengers */}
                    {rep.status === 'IN_PROGRESS' && (
                      <Button
                        type="primary" block icon={<CheckOutlined />}
                        style={{ marginTop: 14, height: 42, fontWeight: 600 }}
                        loading={actionLoading}
                        onClick={() => handleCompleteClick(group[0])}
                      >
                        {(shared || isMerged) ? `Complete Ride for All ${group.length} Customers` : 'Complete Ride'}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Spin>
      </div>

      {/* Start Mileage Modal */}
      <Modal
        title={<span><DashboardOutlined style={{ color: '#E01E2B', marginRight: 8 }} />Record Start Mileage</span>}
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
            style={{ background: '#12894F', borderColor: '#12894F', height: 42, fontWeight: 600 }}>
            Accept Ride & Record Start Mileage
          </Button>
        </Form>
      </Modal>

      {/* End Mileage Modal */}
      <Modal
        title={<span><DashboardOutlined style={{ color: '#E01E2B', marginRight: 8 }} />Record End Mileage</span>}
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
            style={{ height: 42, fontWeight: 600 }}>
            Complete Ride & Record End Mileage
          </Button>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal title="Reject Ride" open={rejectOpen}
        onCancel={() => { setRejectOpen(false); rejectForm.resetFields() }}
        onOk={() => rejectForm.submit()} okText="Confirm Reject"
        okButtonProps={{ danger: true, loading: actionLoading }}>
        <p style={{ marginBottom: 16, color: 'var(--rd-ink-soft)' }}>
          Rejecting ride for <strong>{rejectRide?.customer?.name}</strong>:<br />
          {rejectRide?.pickupLocation} → {rejectRide?.dropLocation}
        </p>
        <Form form={rejectForm} layout="vertical" onFinish={handleRejectSubmit}>
          <Form.Item name="remarks" label="Reason for Rejection"
            rules={[{ required: true, message: 'Please enter a reason for rejection' }]}>
            <Input.TextArea rows={4} placeholder="e.g. Vehicle breakdown, personal emergency, out of area..." />
          </Form.Item>
        </Form>
        <p style={{ fontSize: 12, color: 'var(--rd-amber)' }}>
          Admin will be notified and will reassign another driver.
        </p>
      </Modal>
    </div>
  )
}
