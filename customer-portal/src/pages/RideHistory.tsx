import { useEffect, useState } from 'react'
import { Table, Spin } from 'antd'
import api from '../api/axios'
import Badge from '../components/Badge'
import { IconVehicle, IconCheck, IconCancel, IconClock, IconReject } from '../components/icons'

interface Ride {
  id: number
  status: string
  pickupLocation: string
  dropLocation: string
  scheduledDate: string
  scheduledTime: string
  passengers: number
  remarks?: string
  assignment?: {
    driver: { name: string }
    vehicle: { vehicleNumber: string; model: string }
    completedAt?: string
  } | null
}

const statusConfig: Record<string, { label: string }> = {
  PENDING:     { label: 'Pending' },
  APPROVED:    { label: 'Approved' },
  ASSIGNED:    { label: 'Assigned' },
  IN_PROGRESS: { label: 'In Progress' },
  COMPLETED:   { label: 'Completed' },
  REJECTED:    { label: 'Rejected' },
  CANCELLED:   { label: 'Cancelled' },
}

export default function RideHistory() {
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await api.get('/rides/my')
        setRides(res.data)
      } catch { /* silently fail */ }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const total     = rides.length
  const completed = rides.filter(r => r.status === 'COMPLETED').length
  const cancelled = rides.filter(r => r.status === 'CANCELLED').length
  const pending   = rides.filter(r => ['PENDING', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS'].includes(r.status)).length
  const rejected  = rides.filter(r => r.status === 'REJECTED').length

  const columns = [
    {
      title: 'Route',
      key: 'route',
      render: (_: unknown, r: Ride) => (
        <div>
          <div className="rd-cell-strong">{r.pickupLocation}</div>
          <div className="rd-cell-sub" style={{ color: 'var(--rd-red)' }}>→ {r.dropLocation}</div>
        </div>
      ),
    },
    {
      title: 'Date & Time',
      key: 'date',
      render: (_: unknown, r: Ride) => (
        <div>
          <div>{new Date(r.scheduledDate).toLocaleDateString()}</div>
          <div className="rd-cell-sub">{r.scheduledTime}</div>
        </div>
      ),
    },
    {
      title: 'Passengers',
      dataIndex: 'passengers',
      key: 'passengers',
      width: 90,
    },
    {
      title: 'Driver / Vehicle',
      key: 'driver',
      render: (_: unknown, r: Ride) => r.assignment?.driver ? (
        <div>
          <div className="rd-cell-strong">{r.assignment.driver.name}</div>
          <div className="rd-cell-sub">{r.assignment.vehicle?.vehicleNumber}</div>
        </div>
      ) : <span className="rd-cell-sub">—</span>,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, r: Ride) => {
        const cfg = statusConfig[r.status] ?? { label: r.status }
        return (
          <div>
            <Badge status={r.status} label={cfg.label} />
            {r.remarks && r.status === 'REJECTED' && (
              <div style={{ fontSize: 11, color: 'var(--rd-red)', marginTop: 4 }}>Reason: {r.remarks}</div>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <div className="rd-page-title">Ride History</div>

      <Spin spinning={loading}>
        <div className="rd-stats five" style={{ marginBottom: 20 }}>
          <div className="rd-stat-c"><div className="icon-c rd-ic-red"><IconVehicle /></div><div className="value">{total}</div><div className="label">Total Rides</div></div>
          <div className="rd-stat-c"><div className="icon-c rd-ic-good"><IconCheck /></div><div className="value">{completed}</div><div className="label">Completed</div></div>
          <div className="rd-stat-c"><div className="icon-c rd-ic-gray"><IconCancel /></div><div className="value">{cancelled}</div><div className="label">Cancelled</div></div>
          <div className="rd-stat-c"><div className="icon-c rd-ic-amber"><IconClock /></div><div className="value">{pending}</div><div className="label">Pending</div></div>
          <div className="rd-stat-c"><div className="icon-c rd-ic-red"><IconReject /></div><div className="value">{rejected}</div><div className="label">Rejected</div></div>
        </div>

        <div className="rd-panel">
          {rides.length === 0 && !loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--rd-ink-faint)' }}>No ride history yet</div>
          ) : (
            <Table
              dataSource={rides}
              columns={columns}
              rowKey="id"
              size="middle"
              pagination={{ pageSize: 10, showTotal: t => `${t} rides` }}
              scroll={{ x: 'max-content' }}
            />
          )}
        </div>
      </Spin>
    </div>
  )
}
