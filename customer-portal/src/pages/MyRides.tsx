import { useState, useEffect, useCallback } from 'react'
import { Card, Tag, Button, Typography, Steps, Empty, Spin, message, Modal } from 'antd'
import { EnvironmentOutlined, UserOutlined, CarOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import api from '../api/axios'

const { Title, Text } = Typography

const statusColors: Record<string, string> = {
  PENDING: 'gold', APPROVED: 'blue', ASSIGNED: 'purple',
  IN_PROGRESS: 'processing', COMPLETED: 'green', CANCELLED: 'default', REJECTED: 'red',
}

const statusStep: Record<string, number> = {
  PENDING: 0, APPROVED: 1, ASSIGNED: 2, IN_PROGRESS: 3, COMPLETED: 4,
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
  customer: { name: string }
  assignment?: {
    driver: { name: string; phone: string }
    vehicle: { vehicleNumber: string; model: string }
  } | null
}

export default function MyRides() {
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRides = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/rides/my')
      setRides(res.data)
    } catch { message.error('Failed to load rides') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRides() }, [fetchRides])

  const handleCancel = (id: number) => {
    Modal.confirm({
      title: 'Cancel Ride',
      content: 'Are you sure you want to cancel this ride request?',
      okText: 'Yes, Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.patch(`/rides/${id}/cancel`)
          message.success('Ride cancelled')
          fetchRides()
        } catch (e: any) { message.error(e.response?.data?.message || 'Failed to cancel') }
      },
    })
  }

  const activeRides = rides.filter(r => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status))
  const pastRides = rides.filter(r => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status))

  const RideCard = ({ ride }: { ride: Ride }) => (
    <Card key={ride.id} style={{ marginBottom: 16, border: '1px solid #ede9fe', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <Tag color={statusColors[ride.status]} style={{ marginBottom: 8 }}>{ride.status.replace('_', ' ')}</Tag>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e' }}>
            {ride.pickupLocation} <span style={{ color: '#7c3aed', margin: '0 6px' }}>→</span> {ride.dropLocation}
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {new Date(ride.scheduledDate).toLocaleDateString()} at {ride.scheduledTime} · {ride.passengers} passenger{ride.passengers > 1 ? 's' : ''}
          </Text>
          {ride.purpose && <div><Text type="secondary" style={{ fontSize: 12 }}>Purpose: {ride.purpose}</Text></div>}
        </div>
        {['PENDING', 'APPROVED'].includes(ride.status) && (
          <Button danger size="small" icon={<CloseCircleOutlined />} onClick={() => handleCancel(ride.id)}>Cancel</Button>
        )}
      </div>

      {!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(ride.status) && (
        <Steps size="small" current={statusStep[ride.status] ?? 0} style={{ marginBottom: ride.assignment ? 16 : 0 }}
          items={[
            { title: 'Requested' }, { title: 'Approved' },
            { title: 'Driver Assigned' }, { title: 'In Progress' }, { title: 'Completed' },
          ]}
        />
      )}

      {ride.assignment?.driver && (
        <div style={{ background: '#f8f7ff', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserOutlined style={{ color: '#7c3aed' }} />
            <Text strong>{ride.assignment.driver.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>({ride.assignment.driver.phone})</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CarOutlined style={{ color: '#7c3aed' }} />
            <Text strong>{ride.assignment.vehicle.vehicleNumber} — {ride.assignment.vehicle.model}</Text>
          </div>
          {ride.status === 'IN_PROGRESS' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <EnvironmentOutlined style={{ color: '#22c55e' }} />
              <Text style={{ color: '#22c55e', fontWeight: 600 }}>Ride in progress</Text>
            </div>
          )}
        </div>
      )}
    </Card>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>My Rides</Title>
        <Button icon={<ReloadOutlined />} onClick={fetchRides}>Refresh</Button>
      </div>

      <Spin spinning={loading}>
        {rides.length === 0 && !loading ? (
          <Empty description="No rides yet. Request your first ride!" />
        ) : (
          <>
            {activeRides.length > 0 && (
              <>
                <Text strong style={{ fontSize: 14, color: '#7c3aed', display: 'block', marginBottom: 12 }}>Active Rides</Text>
                {activeRides.map(r => <RideCard key={r.id} ride={r} />)}
              </>
            )}
            {pastRides.length > 0 && (
              <>
                <Text strong style={{ fontSize: 14, color: '#6b7280', display: 'block', marginBottom: 12, marginTop: 24 }}>Past Rides</Text>
                {pastRides.map(r => <RideCard key={r.id} ride={r} />)}
              </>
            )}
          </>
        )}
      </Spin>
    </div>
  )
}
