import { useState, useEffect, useCallback } from 'react'
import { Button, Steps, Spin, message, Modal } from 'antd'
import { EnvironmentOutlined, UserOutlined, CarOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import api from '../api/axios'
import Badge from '../components/Badge'

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
    <div className="rd-ride-card" key={ride.id}>
      <div className="rd-ride-top">
        <div>
          <Badge status={ride.status} label={ride.status.replace('_', ' ')} />
          <div className="rd-ride-route" style={{ marginTop: 8 }}>
            {ride.pickupLocation}<span className="arrow">→</span>{ride.dropLocation}
          </div>
          <div className="rd-ride-info">
            {new Date(ride.scheduledDate).toLocaleDateString()} at {ride.scheduledTime} · {ride.passengers} passenger{ride.passengers > 1 ? 's' : ''}
          </div>
          {ride.purpose && <div className="rd-ride-purpose">Purpose: {ride.purpose}</div>}
        </div>
        {['PENDING', 'APPROVED'].includes(ride.status) && (
          <Button danger size="small" icon={<CloseCircleOutlined />} onClick={() => handleCancel(ride.id)}>Cancel</Button>
        )}
      </div>

      {!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(ride.status) && (
        <Steps size="small" current={statusStep[ride.status] ?? 0} style={{ margin: '12px 0 16px' }}
          items={[
            { title: 'Requested' }, { title: 'Approved' },
            { title: 'Driver Assigned' }, { title: 'In Progress' }, { title: 'Completed' },
          ]}
        />
      )}

      {ride.assignment?.driver && (
        <div className="rd-ride-driver">
          <span><UserOutlined style={{ color: 'var(--rd-red)', marginRight: 6 }} />{ride.assignment.driver.name} ({ride.assignment.driver.phone})</span>
          <span><CarOutlined style={{ color: 'var(--rd-red)', marginRight: 6 }} />{ride.assignment.vehicle.vehicleNumber} — {ride.assignment.vehicle.model}</span>
          {ride.status === 'IN_PROGRESS' && (
            <span style={{ color: 'var(--rd-good)', fontWeight: 600 }}><EnvironmentOutlined style={{ marginRight: 6 }} />Ride in progress</span>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div className="rd-row-between">
        <div className="rd-page-title" style={{ margin: 0 }}>My Rides</div>
        <Button icon={<ReloadOutlined />} onClick={fetchRides}>Refresh</Button>
      </div>

      <Spin spinning={loading}>
        {rides.length === 0 && !loading ? (
          <div className="rd-panel" style={{ textAlign: 'center', padding: 40, color: 'var(--rd-ink-faint)' }}>
            No rides yet. Request your first ride!
          </div>
        ) : (
          <>
            {activeRides.length > 0 && (
              <>
                <div className="rd-page-sub" style={{ color: 'var(--rd-red)', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Active Rides</div>
                {activeRides.map(r => <RideCard key={r.id} ride={r} />)}
              </>
            )}
            {pastRides.length > 0 && (
              <>
                <div className="rd-page-sub" style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, marginTop: 24 }}>Past Rides</div>
                {pastRides.map(r => <RideCard key={r.id} ride={r} />)}
              </>
            )}
          </>
        )}
      </Spin>
    </div>
  )
}
