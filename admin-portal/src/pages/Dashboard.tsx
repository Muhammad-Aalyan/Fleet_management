import { useEffect, useState } from 'react'
import { Spin } from 'antd'
import api from '../api/axios'
import Badge from '../components/Badge'
import {
  IconDriversPlain, IconVehiclePlain, IconClock, IconBolt,
  IconCheck, IconCustomers, IconDocumentPlain, IconDollar,
} from '../components/icons'

interface Stats {
  totalDrivers: number; totalVehicles: number; pendingRequests: number; activeRides: number
  completedToday: number; totalCustomers: number; totalRequests: number; totalFuelCost: number
  vehicleUtilization: { available: number; inRide: number; maintenance: number; inactive: number }
  driverStatus: { available: number; onRide: number; offDuty: number }
}

interface RecentRequest {
  id: number
  customerName: string
  pickupLocation: string
  dropLocation: string
  scheduledDate: string
  status: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<RecentRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/recent-requests'),
    ]).then(([s, r]) => {
      setStats(s.data)
      setRecent(r.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { label: 'Total Drivers',    value: stats.totalDrivers,    icon: <IconDriversPlain />, cls: 'rd-ic-black' },
    { label: 'Total Vehicles',   value: stats.totalVehicles,   icon: <IconVehiclePlain />, cls: 'rd-ic-good' },
    { label: 'Pending Requests', value: stats.pendingRequests, icon: <IconClock />,        cls: 'rd-ic-amber' },
    { label: 'Active Rides',     value: stats.activeRides,     icon: <IconBolt />,         cls: 'rd-ic-red' },
    { label: 'Completed Today',  value: stats.completedToday,  icon: <IconCheck />,        cls: 'rd-ic-good' },
    { label: 'Total Customers',  value: stats.totalCustomers,  icon: <IconCustomers />,    cls: 'rd-ic-black' },
    { label: 'Total Requests',   value: stats.totalRequests,   icon: <IconDocumentPlain />, cls: 'rd-ic-blue' },
    { label: 'Fuel Cost (PKR)',  value: stats.totalFuelCost.toLocaleString(), icon: <IconDollar />, cls: 'rd-ic-red' },
  ] : []

  const v = stats?.vehicleUtilization

  return (
    <Spin spinning={loading}>
      <div className="rd-page-title">Overview</div>

      <div className="rd-stats">
        {statCards.map((s) => (
          <div className="rd-stat" key={s.label}>
            <div className="top">
              <span className="label">{s.label}</span>
              <div className={`icon ${s.cls}`}>{s.icon}</div>
            </div>
            <div className="value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rd-split">
        <div className="rd-panel">
          <div className="rd-panel-head"><h3>Recent Ride Requests</h3></div>
          <table className="rd-table">
            <thead><tr><th>Customer</th><th>Pickup</th><th>Drop</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id}>
                  <td className="rd-cell-strong">{r.customerName}</td>
                  <td>{r.pickupLocation}</td>
                  <td>{r.dropLocation}</td>
                  <td>{new Date(r.scheduledDate).toLocaleDateString()}</td>
                  <td><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rd-panel">
          <div className="rd-panel-head"><h3>Vehicle Utilization</h3></div>
          <div style={{ padding: '18px 20px' }}>
            {v && [
              { label: 'Available',   value: v.available,   fill: 'rd-fill-good' },
              { label: 'In Ride',     value: v.inRide,      fill: 'rd-fill-red' },
              { label: 'Maintenance', value: v.maintenance, fill: 'rd-fill-amber' },
              { label: 'Inactive',    value: v.inactive,    fill: 'rd-fill-gray' },
            ].map((item) => (
              <div className="rd-util-row" key={item.label}>
                <div className="rd-util-top"><span>{item.label}</span><span>{item.value}%</span></div>
                <div className="rd-util-track"><div className={`rd-util-fill ${item.fill}`} style={{ width: `${item.value}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Spin>
  )
}
