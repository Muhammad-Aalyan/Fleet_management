import { useEffect, useState, useCallback } from 'react'
import { Select } from 'antd'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import ReportShell from '../components/ReportShell'
import StatCard from '../components/StatCard'
import HBarChart from '../components/HBarChart'
import ReportTable from '../components/ReportTable'
import { R } from '../utils/reportTheme'
import { exportPDF, exportExcel } from '../utils/pdfExport'

interface CustomerRow {
  id: number; customerName: string; customerPhone: string; date: string; time: string;
  route: string; pickupLocation: string; dropLocation: string; passengers: number;
  purpose: string; driverName: string; vehicleNumber: string; status: string;
}
interface Totals { totalRides: number; uniqueCustomers: number; completedRides: number; cancelledRides: number }

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: '#D1FAE5', CANCELLED: '#FEE2E2', IN_PROGRESS: '#DBEAFE',
  ASSIGNED: '#EEF1FE', PENDING: '#FEF3C7', APPROVED: '#F3E8FF',
}
const STATUS_TEXT: Record<string, string> = {
  COMPLETED: '#065F46', CANCELLED: '#991B1B', IN_PROGRESS: '#1E40AF',
  ASSIGNED: '#2952E3', PENDING: '#92400E', APPROVED: '#5B21B6',
}
const STag = ({ v }: { v: string }) => (
  <span style={{ display: 'inline-block', background: STATUS_COLOR[v] ?? '#F3F4F6', color: STATUS_TEXT[v] ?? R.inkSoft, padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{v}</span>
)

export default function CustomerReport() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/customers')
      setTotals(res.data.totals); setRows(res.data.rows)
    } catch { /* handled */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchData() }, [fetchData])

  const filtered = rows.filter(r => {
    const s = search.toLowerCase()
    return (!search || r.customerName.toLowerCase().includes(s) || r.driverName.toLowerCase().includes(s) || r.route.toLowerCase().includes(s))
      && (statusFilter === 'ALL' || r.status === statusFilter)
  })

  const customerCount = rows.reduce<Record<string, number>>((a, r) => { a[r.customerName] = (a[r.customerName] ?? 0) + 1; return a }, {})
  const topCustomers = Object.entries(customerCount).sort(([, a], [, b]) => b - a).slice(0, 6).map(([label, value]) => ({ label, value }))
  const statusDist = Object.entries(rows.reduce<Record<string, number>>((a, r) => { a[r.status] = (a[r.status] ?? 0) + 1; return a }, {}))
    .map(([label, value]) => ({ label, value, color: STATUS_TEXT[label] ?? R.inkFaint })).sort((a, b) => b.value - a.value)

  const summaryCards = totals ? [
    { label: 'Total Rides', value: totals.totalRides },
    { label: 'Unique Customers', value: totals.uniqueCustomers, highlight: true },
    { label: 'Completed', value: totals.completedRides },
    { label: 'Cancelled', value: totals.cancelledRides },
  ] : undefined

  const handlePDF = async () => await exportPDF({
    title: 'Customer Report',
    subtitle: 'Ride details per customer — driver assigned, route, and status',
    sectionLabel: 'Customer Ride Records',
    orientation: 'landscape',
    adminName: user?.name ?? 'Admin',
    recordCount: filtered.length,
    head: ['#', 'Customer', 'Phone', 'Date', 'Time', 'Pickup', 'Drop', 'Pax', 'Driver', 'Vehicle', 'Status'],
    body: filtered.map(r => [r.id, r.customerName, r.customerPhone, new Date(r.date).toLocaleDateString(), r.time, r.pickupLocation, r.dropLocation, r.passengers, r.driverName, r.vehicleNumber, r.status]),
    fileName: 'customer-report',
    summaryCards,
  })

  const handleExcel = () => exportExcel('customer-report', 'Customers', filtered.map(r => ({
    'Ride #': r.id, Customer: r.customerName, Phone: r.customerPhone,
    Date: new Date(r.date).toLocaleDateString(), Time: r.time,
    Pickup: r.pickupLocation, Drop: r.dropLocation, Passengers: r.passengers,
    Driver: r.driverName, Vehicle: r.vehicleNumber, Purpose: r.purpose, Status: r.status,
  })), {
    title: 'Customer Report',
    subtitle: 'Ride details per customer — driver assigned, route, and status',
    sectionLabel: 'Customer Ride Records',
    adminName: user?.name ?? 'Admin',
    recordCount: filtered.length,
    summaryCards,
  })

  const columns = [
    {
      title: 'Customer', key: 'customer',
      render: (_: any, r: CustomerRow) => (
        <div>
          <div style={{ fontWeight: 600, color: R.ink }}>{r.customerName}</div>
          <div style={{ fontSize: 12, color: R.inkFaint }}>{r.customerPhone}</div>
        </div>
      ),
    },
    {
      title: 'Date & Time', key: 'dt', width: 130,
      render: (_: any, r: CustomerRow) => (
        <div>
          <div style={{ color: R.ink }}>{new Date(r.date).toLocaleDateString()}</div>
          <div style={{ fontSize: 12, color: R.inkFaint }}>{r.time}</div>
        </div>
      ),
    },
    {
      title: 'Route', key: 'route',
      render: (_: any, r: CustomerRow) => (
        <span style={{ color: R.inkSoft, fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: R.ink }}>{r.pickupLocation}</span>
          {' '}<span style={{ color: R.accent }}>→</span>{' '}
          <span style={{ fontWeight: 600, color: R.ink }}>{r.dropLocation}</span>
        </span>
      ),
    },
    { title: 'Pax', dataIndex: 'passengers', key: 'pax', width: 55, render: (v: number) => <span style={{ fontWeight: 600 }}>{v}</span> },
    {
      title: 'Driver', key: 'driver', width: 160,
      render: (_: any, r: CustomerRow) => r.driverName === '—'
        ? <span style={{ color: R.inkFaint, fontSize: 12 }}>Unassigned</span>
        : <div><div style={{ fontWeight: 600, color: R.ink }}>{r.driverName}</div>{r.vehicleNumber !== '—' && <div style={{ fontSize: 12, color: R.inkFaint }}>{r.vehicleNumber}</div>}</div>,
    },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (v: string) => <STag v={v} /> },
  ]

  return (
    <ReportShell
      title="Customer Report"
      subtitle="Ride details per customer — driver assigned, route, and status"
      loading={loading}
      recordCount={filtered.length}
      adminName={user?.name ?? 'Admin'}
      onExcel={handleExcel}
      onPdf={handlePDF}
      filterBar={
        <>
          <input placeholder="🔍  Search customer, driver, route…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: `1px solid ${R.border}`, borderRadius: 7, padding: '7px 10px', fontSize: 13, color: R.ink, width: 260, background: '#fff' }} />
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }} size="small"
            options={[{ value: 'ALL', label: 'All statuses' }, { value: 'COMPLETED', label: 'Completed' }, { value: 'CANCELLED', label: 'Cancelled' }, { value: 'IN_PROGRESS', label: 'In Progress' }, { value: 'ASSIGNED', label: 'Assigned' }]} />
          <div style={{ flex: 1 }} />
          <span style={{ color: R.inkSoft, fontSize: 13 }}>{filtered.length} rides</span>
        </>
      }
    >
      {totals && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          <StatCard label="Total Rides" value={totals.totalRides} />
          <StatCard label="Unique Customers" value={totals.uniqueCustomers} highlight />
          <StatCard label="Completed" value={totals.completedRides} color={R.good} colorSoft={R.goodSoft} />
          <StatCard label="Cancelled" value={totals.cancelledRides} color={totals.cancelledRides > 0 ? R.danger : R.inkFaint} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14, marginBottom: 20 }}>
        {topCustomers.length > 0 && (
          <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: R.radius, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: R.ink, marginBottom: 2 }}>Top Customers by Rides</div>
            <div style={{ fontSize: 12.5, color: R.inkFaint, marginBottom: 16 }}>Total bookings, all time</div>
            <HBarChart items={topCustomers} />
          </div>
        )}
        {statusDist.length > 0 && (
          <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: R.radius, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: R.ink, marginBottom: 2 }}>Status Breakdown</div>
            <div style={{ fontSize: 12.5, color: R.inkFaint, marginBottom: 16 }}>Count by status</div>
            <HBarChart items={statusDist} />
          </div>
        )}
      </div>

      <ReportTable columns={columns} data={filtered} rowKey="id" title="Ride Details" footer={`${filtered.length} records`} pageSize={12} />
    </ReportShell>
  )
}
