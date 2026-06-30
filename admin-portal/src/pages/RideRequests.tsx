import { useState, useEffect, useCallback } from 'react'
import { Table, Tag, Button, Space, Input, Select, Card, Modal, Form, Descriptions, Typography, message, Spin, Tooltip, Switch, Alert } from 'antd'
import { SearchOutlined, EyeOutlined, CheckOutlined, CloseOutlined, UserAddOutlined, ReloadOutlined } from '@ant-design/icons'
import api from '../api/axios'

const { Title, Text } = Typography
const { Option } = Select

const statusColors: Record<string, string> = {
  PENDING: 'gold', APPROVED: 'blue', ASSIGNED: 'purple',
  IN_PROGRESS: 'processing', COMPLETED: 'green', REJECTED: 'red', CANCELLED: 'default',
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
  remarks?: string
  customer: { name: string; phone: string; user: { id: number } }
  assignment?: { driver: { id: number; name: string }; vehicle: { id: number; vehicleNumber: string; model: string } } | null
}

interface Driver { id: number; name: string; phone: string; status: string; licenseNumber: string }
interface Vehicle { id: number; vehicleNumber: string; model: string; status: string; capacity: number }

export default function RideRequests() {
  const [rides, setRides] = useState<Ride[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [detailRide, setDetailRide] = useState<Ride | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [assignRide, setAssignRide] = useState<Ride | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignForm] = Form.useForm()
  const [urgentMode, setUrgentMode] = useState(false)
  const [bumpRideIds, setBumpRideIds] = useState<number[]>([])

  const [rejectRide, setRejectRide] = useState<Ride | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectForm] = Form.useForm()

  const fetchRides = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/rides')
      setRides(res.data)
    } catch { message.error('Failed to load rides') }
    finally { setLoading(false) }
  }, [])

  const fetchDriversAndVehicles = async () => {
    const [d, v] = await Promise.all([api.get('/drivers'), api.get('/vehicles')])
    setDrivers(d.data)
    setVehicles(v.data)
  }

  useEffect(() => { fetchRides() }, [fetchRides])

  const handleApprove = async (id: number) => {
    try {
      await api.patch(`/rides/${id}/approve`)
      message.success('Ride approved — customer notified')
      fetchRides()
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed to approve') }
  }

  const handleRejectSubmit = async (values: { remarks: string }) => {
    if (!rejectRide) return
    try {
      await api.patch(`/rides/${rejectRide.id}/reject`, { remarks: values.remarks })
      message.success('Ride rejected — customer notified')
      setRejectOpen(false)
      rejectForm.resetFields()
      fetchRides()
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed to reject') }
  }

  const openAssign = async (ride: Ride) => {
    setAssignRide(ride)
    await fetchDriversAndVehicles()
    setAssignOpen(true)
  }

  const handleAssignSubmit = async (values: { driverId: number; vehicleId: number }, bumpRideIds: number[] = []) => {
    if (!assignRide) return
    setAssignLoading(true)
    try {
      if (urgentMode && bumpRideIds.length > 0) {
        await api.patch(`/rides/${assignRide.id}/urgent-assign`, { ...values, bumpRideIds })
        message.success(`Urgent assignment done — ${bumpRideIds.length} passenger(s) bumped and notified.`)
      } else {
        await api.patch(`/rides/${assignRide.id}/assign`, values)
        message.success('Driver assigned — driver notified')
      }
      setAssignOpen(false)
      setUrgentMode(false)
      assignForm.resetFields()
      fetchRides()
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed to assign') }
    finally { setAssignLoading(false) }
  }

  const filtered = rides.filter(r =>
    (statusFilter === 'ALL' || r.status === statusFilter) &&
    (r.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.pickupLocation?.toLowerCase().includes(search.toLowerCase()))
  )

  const columns = [
    { title: '#', dataIndex: 'id', key: 'id', width: 55 },
    { title: 'Customer', key: 'customer', render: (_: unknown, r: Ride) => <><div style={{ fontWeight: 600 }}>{r.customer?.name}</div><Text type="secondary" style={{ fontSize: 12 }}>{r.customer?.phone}</Text></> },
    { title: 'Pickup', dataIndex: 'pickupLocation', key: 'pickup' },
    { title: 'Drop', dataIndex: 'dropLocation', key: 'drop' },
    { title: 'Date', key: 'date', render: (_: unknown, r: Ride) => <><div>{new Date(r.scheduledDate).toLocaleDateString()}</div><Text type="secondary" style={{ fontSize: 12 }}>{r.scheduledTime}</Text></> },
    { title: 'Pax', dataIndex: 'passengers', key: 'passengers', width: 55 },
    { title: 'Driver', key: 'driver', render: (_: unknown, r: Ride) => r.assignment?.driver?.name ? <Tag color="purple">{r.assignment.driver.name}</Tag> : <Text type="secondary">—</Text> },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={statusColors[s]}>{s.replace('_', ' ')}</Tag>,
    },
    {
      title: 'Actions', key: 'actions', width: 160,
      render: (_: unknown, r: Ride) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button size="small" icon={<EyeOutlined />} onClick={() => { setDetailRide(r); setDetailOpen(true) }} />
          </Tooltip>
          {r.status === 'PENDING' && (
            <>
              <Tooltip title="Approve">
                <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(r.id)} />
              </Tooltip>
              <Tooltip title="Reject">
                <Button size="small" danger icon={<CloseOutlined />} onClick={() => { setRejectRide(r); setRejectOpen(true) }} />
              </Tooltip>
            </>
          )}
          {(r.status === 'APPROVED') && (
            <Tooltip title="Assign Driver">
              <Button size="small" icon={<UserAddOutlined />} onClick={() => openAssign(r)}>Assign</Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Ride Requests</Title>
        <Button icon={<ReloadOutlined />} onClick={fetchRides}>Refresh</Button>
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Space wrap>
          <Input placeholder="Search customer or location..." prefix={<SearchOutlined />}
            value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} />
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 160 }}>
            {['ALL','PENDING','APPROVED','ASSIGNED','IN_PROGRESS','COMPLETED','REJECTED','CANCELLED'].map(s =>
              <Option key={s} value={s}>{s === 'ALL' ? 'All Status' : s.replace('_',' ')}</Option>
            )}
          </Select>
        </Space>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Spin spinning={loading}>
          <Table dataSource={filtered} columns={columns} rowKey="id" size="middle"
            pagination={{ pageSize: 10, showTotal: t => `${t} total` }} />
        </Spin>
      </Card>

      {/* Detail Modal */}
      <Modal title="Ride Details" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={640}>
        {detailRide && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Customer">{detailRide.customer?.name}</Descriptions.Item>
            <Descriptions.Item label="Phone">{detailRide.customer?.phone}</Descriptions.Item>
            <Descriptions.Item label="Pickup">{detailRide.pickupLocation}</Descriptions.Item>
            <Descriptions.Item label="Drop">{detailRide.dropLocation}</Descriptions.Item>
            <Descriptions.Item label="Date">{new Date(detailRide.scheduledDate).toLocaleDateString()}</Descriptions.Item>
            <Descriptions.Item label="Time">{detailRide.scheduledTime}</Descriptions.Item>
            <Descriptions.Item label="Passengers">{detailRide.passengers}</Descriptions.Item>
            <Descriptions.Item label="Purpose">{detailRide.purpose || '—'}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={statusColors[detailRide.status]}>{detailRide.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="Remarks">{detailRide.remarks || '—'}</Descriptions.Item>
            {detailRide.assignment && (
              <>
                <Descriptions.Item label="Driver">{detailRide.assignment.driver?.name}</Descriptions.Item>
                <Descriptions.Item label="Vehicle">{detailRide.assignment.vehicle?.vehicleNumber} — {detailRide.assignment.vehicle?.model}</Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal title="Reject Ride Request" open={rejectOpen} onCancel={() => { setRejectOpen(false); rejectForm.resetFields() }}
        onOk={() => rejectForm.submit()} okText="Reject" okButtonProps={{ danger: true }}>
        <Form form={rejectForm} layout="vertical" onFinish={handleRejectSubmit}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Rejecting ride for <strong>{rejectRide?.customer?.name}</strong>: {rejectRide?.pickupLocation} → {rejectRide?.dropLocation}
          </Text>
          <Form.Item name="remarks" label="Reason for Rejection">
            <Input.TextArea rows={3} placeholder="Optional reason..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Modal */}
      <Modal title="Assign Driver & Vehicle" open={assignOpen}
        onCancel={() => { setAssignOpen(false); assignForm.resetFields(); setUrgentMode(false); setBumpRideIds([]) }}
        onOk={() => assignForm.submit()} okText="Assign" confirmLoading={assignLoading}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Assigning ride for <strong>{assignRide?.customer?.name}</strong>: {assignRide?.pickupLocation} → {assignRide?.dropLocation}
        </Text>
        <Form form={assignForm} layout="vertical" onFinish={(values) => handleAssignSubmit(values, bumpRideIds)}>
          {(() => {
            // Find IN_PROGRESS rides whose route+schedule matches the ride being assigned
            const matchingActiveRides = rides.filter(r =>
              ['IN_PROGRESS', 'ASSIGNED'].includes(r.status) &&
              r.id !== assignRide?.id &&
              r.pickupLocation === assignRide?.pickupLocation &&
              r.dropLocation === assignRide?.dropLocation &&
              r.scheduledDate === assignRide?.scheduledDate &&
              r.scheduledTime === assignRide?.scheduledTime
            )
            const sharedDriverIds = new Set(matchingActiveRides.map(r => r.assignment?.driver?.id).filter(Boolean))
            const sharedVehicleIds = new Set(matchingActiveRides.map(r => r.assignment?.vehicle?.id).filter(Boolean))

            // Calculate remaining seats on shared vehicles
            const seatsTaken = matchingActiveRides.reduce((sum, r) => sum + r.passengers, 0)
            const newPassengers = assignRide?.passengers ?? 1

            // A shared vehicle is full if adding the new passengers would exceed capacity
            const fullVehicleIds = new Set(
              vehicles
                .filter(v => v.status === 'IN_RIDE' && sharedVehicleIds.has(v.id) && (v.capacity - seatsTaken) < newPassengers)
                .map(v => v.id)
            )

            // Drivers on full vehicles are also unavailable for sharing
            const driversOnFullVehicles = new Set(
              matchingActiveRides
                .filter(r => r.assignment?.vehicle?.id && fullVehicleIds.has(r.assignment.vehicle.id))
                .map(r => r.assignment?.driver?.id)
                .filter(Boolean)
            )

            // Show all relevant drivers/vehicles but mark unavailable ones as disabled
            const availableDrivers = drivers.filter(d =>
              d.status === 'AVAILABLE' || (d.status === 'ON_RIDE' && sharedDriverIds.has(d.id))
            )
            const availableVehicles = vehicles.filter(v =>
              v.status === 'AVAILABLE' || (v.status === 'IN_RIDE' && sharedVehicleIds.has(v.id))
            )
            const capacityExceeded = fullVehicleIds.size > 0

            // Keep bumpRideIds in sync (rides that are blocking capacity)
            const blockingIds = matchingActiveRides.filter(r => r.assignment?.vehicle?.id && fullVehicleIds.has(r.assignment.vehicle.id)).map(r => r.id)
            if (JSON.stringify(blockingIds) !== JSON.stringify(bumpRideIds)) setBumpRideIds(blockingIds)

            return (
              <>
                {matchingActiveRides.length > 0 && !capacityExceeded && (
                  <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
                    <strong>Shared ride available</strong> — {seatsTaken} passenger(s) already on this route.
                    The driver and vehicle marked <Tag color="orange" style={{ margin: '0 2px' }}>On Ride</Tag> can be reused.
                  </div>
                )}
                {capacityExceeded && (
                  <>
                    <div style={{ background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8, padding: '12px 14px', marginBottom: 12, fontSize: 13 }}>
                      <div style={{ fontWeight: 700, color: '#cf1322', marginBottom: 6 }}>⚠️ Capacity Exceeded</div>
                      <div style={{ color: '#6b7280', marginBottom: 10 }}>
                        Vehicle is full ({seatsTaken}/{availableVehicles.find(v => fullVehicleIds.has(v.id))?.capacity ?? '?'} seats taken) by the following passenger(s):
                      </div>
                      {matchingActiveRides.map(r => (
                        <div key={r.id} style={{ background: '#fff', border: '1px solid #fca5a5', borderRadius: 6, padding: '6px 10px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                          <span><strong>{r.customer?.name}</strong> — {r.passengers} passenger{r.passengers > 1 ? 's' : ''}</span>
                          <Tag color="orange">IN PROGRESS</Tag>
                        </div>
                      ))}
                    </div>

                    {/* Urgent toggle */}
                    <div style={{ background: urgentMode ? '#fff7ed' : '#f9fafb', border: `1.5px solid ${urgentMode ? '#f97316' : '#e5e7eb'}`, borderRadius: 10, padding: '12px 14px', marginBottom: 16, transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: urgentMode ? 10 : 0 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: urgentMode ? '#ea580c' : '#374151' }}>🚨 Mark as Urgent</div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                            Approves this ride immediately — reduces <strong>this customer's</strong> passengers to fit available seats
                          </div>
                        </div>
                        <Switch checked={urgentMode} onChange={setUrgentMode} style={{ background: urgentMode ? '#f97316' : undefined }} />
                      </div>
                      {urgentMode && (() => {
                        const fullVeh = availableVehicles.find(v => fullVehicleIds.has(v.id))
                        const seatsAvailable = (fullVeh?.capacity ?? 0) - seatsTaken
                        const adjustedPax = Math.min(newPassengers, seatsAvailable)
                        const removed = newPassengers - adjustedPax
                        return (
                          <Alert
                            type="warning"
                            showIcon
                            message={
                              <span>
                                <strong>{assignRide?.customer?.name}</strong>'s passenger count will be reduced from{' '}
                                <strong>{newPassengers} → {adjustedPax}</strong> ({removed} removed) to fit the {seatsAvailable} available seat{seatsAvailable !== 1 ? 's' : ''}.
                                Existing rides are <strong>not affected</strong>. Customer will be notified.
                              </span>
                            }
                            style={{ borderRadius: 8, fontSize: 12 }}
                          />
                        )
                      })()}
                    </div>
                  </>
                )}

                <Form.Item name="driverId" label="Select Driver" rules={[{ required: true, message: 'Select a driver' }]}>
                  <Select placeholder="Choose driver" size="large">
                    {availableDrivers.map(d => {
                      const isUnavailable = driversOnFullVehicles.has(d.id)
                      return (
                        <Option key={d.id} value={d.id} disabled={isUnavailable && !urgentMode}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: isUnavailable ? '#9ca3af' : undefined }}>
                              {d.name} — {d.phone}
                            </span>
                            <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              {isUnavailable && <Tag color="red">Vehicle Full</Tag>}
                              <Tag color={d.status === 'AVAILABLE' ? 'green' : isUnavailable ? 'default' : 'orange'}>
                                {d.status === 'AVAILABLE' ? 'Available' : isUnavailable ? 'Unavailable' : 'On Ride (shared)'}
                              </Tag>
                            </span>
                          </div>
                        </Option>
                      )
                    })}
                  </Select>
                </Form.Item>

                <Form.Item name="vehicleId" label="Select Vehicle" rules={[{ required: true, message: 'Select a vehicle' }]}>
                  <Select placeholder="Choose vehicle" size="large">
                    {availableVehicles.map(v => {
                      const seatsLeft = v.status === 'IN_RIDE' ? v.capacity - seatsTaken : v.capacity
                      const isFull = fullVehicleIds.has(v.id)
                      return (
                        <Option key={v.id} value={v.id} disabled={isFull && !urgentMode}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: isFull ? '#9ca3af' : undefined }}>
                              {v.vehicleNumber} — {v.model}
                            </span>
                            <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              {v.status === 'IN_RIDE' && (
                                <Tag color={isFull ? 'red' : 'blue'}>
                                  {isFull ? `Full (${seatsTaken}/${v.capacity})` : `${seatsLeft} seats left`}
                                </Tag>
                              )}
                              <Tag color={v.status === 'AVAILABLE' ? 'green' : isFull ? 'default' : 'blue'}>
                                {v.status === 'AVAILABLE' ? `Cap: ${v.capacity}` : isFull ? 'Unavailable' : 'In Ride (shared)'}
                              </Tag>
                            </span>
                          </div>
                        </Option>
                      )
                    })}
                  </Select>
                </Form.Item>
              </>
            )
          })()}
        </Form>
      </Modal>
    </div>
  )
}
