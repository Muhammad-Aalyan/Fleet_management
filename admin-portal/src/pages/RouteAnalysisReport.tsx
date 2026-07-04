import { useEffect, useState, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import ReportShell from '../components/ReportShell'
import StatCard from '../components/StatCard'
import HBarChart from '../components/HBarChart'
import ReportTable from '../components/ReportTable'
import { R } from '../utils/reportTheme'
import { exportPDF, exportExcel } from '../utils/pdfExport'

interface RouteRow {
  route: string; pickupLocation: string; dropLocation: string;
  total: number; completed: number; cancelled: number; totalPassengers: number;
  avgPassengers: number; cancellationRate: number; completionRate: number;
}
interface Totals { uniqueRoutes: number; uniquePickups: number; uniqueDrops: number; totalRides: number }

export default function RouteAnalysisReport() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<RouteRow[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/route-analysis')
      setTotals(res.data.totals); setRows(res.data.rows)
    } catch { /* handled */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchData() }, [fetchData])

  const filtered = rows.filter(r => !search || r.route.toLowerCase().includes(search.toLowerCase()) || r.pickupLocation.toLowerCase().includes(search.toLowerCase()) || r.dropLocation.toLowerCase().includes(search.toLowerCase()))
  const maxTotal = Math.max(...rows.map(r => r.total), 1)

  const topByRides = rows.slice(0, 8).map(r => ({
    label: r.route.length > 32 ? r.route.slice(0, 32) + '…' : r.route,
    value: r.total,
  }))

  const highCancel = [...rows].filter(r => r.cancellationRate > 0).sort((a, b) => b.cancellationRate - a.cancellationRate).slice(0, 6)
    .map(r => ({
      label: r.route.length > 32 ? r.route.slice(0, 32) + '…' : r.route,
      value: r.cancellationRate,
      suffix: '%',
      color: R.danger,
    }))

  const summaryCards = totals ? [
    { label: 'Unique Routes', value: totals.uniqueRoutes, highlight: true },
    { label: 'Unique Pickups', value: totals.uniquePickups },
    { label: 'Unique Drops', value: totals.uniqueDrops },
    { label: 'Total Rides', value: totals.totalRides },
  ] : undefined

  const handlePDF = async () => await exportPDF({
    title: 'Route Analysis Report',
    subtitle: 'Most-used routes, passenger load, and cancellation hotspots',
    sectionLabel: 'Route Frequency Analysis',
    orientation: 'landscape',
    adminName: user?.name ?? 'Admin',
    recordCount: filtered.length,
    head: ['#', 'Pickup', 'Drop', 'Total', 'Completed', 'Cancelled', 'Avg Pax', 'Completion %', 'Cancel %'],
    body: filtered.map((r, i) => [`#${i + 1}`, r.pickupLocation, r.dropLocation, r.total, r.completed, r.cancelled, r.avgPassengers, `${r.completionRate}%`, `${r.cancellationRate}%`]),
    fileName: 'route-analysis-report',
    summaryCards,
  })

  const handleExcel = () => exportExcel('route-analysis-report', 'Route Analysis', filtered.map(r => ({
    Pickup: r.pickupLocation, Drop: r.dropLocation, 'Total Rides': r.total,
    Completed: r.completed, Cancelled: r.cancelled, 'Avg Passengers': r.avgPassengers,
    'Completion %': r.completionRate, 'Cancellation %': r.cancellationRate,
  })), {
    title: 'Route Analysis Report',
    subtitle: 'Most-used routes, passenger load, and cancellation hotspots',
    sectionLabel: 'Route Frequency Analysis',
    adminName: user?.name ?? 'Admin',
    recordCount: filtered.length,
    summaryCards,
  })

  const columns = [
    {
      title: '#', key: 'num', width: 50,
      render: (_: any, __: any, i: number) => <span style={{ fontWeight: 700, color: R.inkFaint }}>#{i + 1}</span>,
    },
    {
      title: 'Route', key: 'route',
      render: (_: any, r: RouteRow) => (
        <span style={{ fontSize: 13, color: R.inkSoft }}>
          <span style={{ fontWeight: 600, color: R.ink }}>{r.pickupLocation}</span>
          {' '}<span style={{ color: R.accent }}>→</span>{' '}
          <span style={{ fontWeight: 600, color: R.ink }}>{r.dropLocation}</span>
        </span>
      ),
    },
    { title: 'Total', dataIndex: 'total', key: 'total', width: 80, render: (v: number) => <span style={{ fontWeight: 700 }}>{v}</span> },
    { title: 'Completed', dataIndex: 'completed', key: 'completed', width: 100, render: (v: number) => <span style={{ color: R.good, fontWeight: 600 }}>{v}</span> },
    { title: 'Cancelled', dataIndex: 'cancelled', key: 'cancelled', width: 90, render: (v: number) => <span style={{ color: v > 0 ? R.danger : R.inkFaint }}>{v}</span> },
    { title: 'Avg Pax', dataIndex: 'avgPassengers', key: 'avgPax', width: 80, render: (v: number) => <span style={{ color: R.accent, fontWeight: 600 }}>{v}</span> },
    {
      title: 'Completion', key: 'rate', width: 150,
      render: (_: any, r: RouteRow) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 6, background: '#EFF1F5', borderRadius: 4 }}>
            <div style={{ width: `${r.completionRate}%`, height: '100%', background: r.completionRate >= 80 ? R.good : r.completionRate >= 50 ? R.warn : R.danger, borderRadius: 4 }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, width: 38, textAlign: 'right', color: r.completionRate >= 80 ? R.good : r.completionRate >= 50 ? R.warn : R.danger }}>{r.completionRate}%</span>
        </div>
      ),
    },
    {
      title: 'Cancel %', dataIndex: 'cancellationRate', key: 'cr', width: 90,
      render: (v: number) => (
        <span style={{ fontWeight: 600, color: v > 20 ? R.danger : v > 0 ? R.warn : R.good, background: v > 20 ? R.dangerSoft : v > 0 ? R.warnSoft : R.goodSoft, padding: '2px 7px', borderRadius: 5, fontSize: 12 }}>
          {v}%
        </span>
      ),
    },
  ]

  return (
    <ReportShell
      title="Route Analysis Report"
      subtitle="Most-used routes, passenger load, and cancellation hotspots"
      loading={loading}
      recordCount={filtered.length}
      adminName={user?.name ?? 'Admin'}
      onExcel={handleExcel}
      onPdf={handlePDF}
      filterBar={
        <>
          <input placeholder="🔍  Search route, pickup, drop…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: `1px solid ${R.border}`, borderRadius: 7, padding: '7px 10px', fontSize: 13, color: R.ink, width: 260, background: '#fff' }} />
          <div style={{ flex: 1 }} />
          <span style={{ color: R.inkSoft, fontSize: 13 }}>{filtered.length} routes</span>
        </>
      }
    >
      {totals && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          <StatCard label="Unique Routes" value={totals.uniqueRoutes} highlight />
          <StatCard label="Unique Pickups" value={totals.uniquePickups} />
          <StatCard label="Unique Drops" value={totals.uniqueDrops} />
          <StatCard label="Total Rides" value={totals.totalRides} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14, marginBottom: 20 }}>
        {topByRides.length > 0 && (
          <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: R.radius, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: R.ink, marginBottom: 2 }}>Most Requested Routes</div>
            <div style={{ fontSize: 12.5, color: R.inkFaint, marginBottom: 16 }}>Total ride count per route</div>
            <HBarChart items={topByRides} />
          </div>
        )}
        {highCancel.length > 0 && (
          <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: R.radius, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: R.ink, marginBottom: 2 }}>High Cancellation Routes</div>
            <div style={{ fontSize: 12.5, color: R.inkFaint, marginBottom: 16 }}>Cancellation rate (%)</div>
            <HBarChart items={highCancel} color={R.danger} />
          </div>
        )}
      </div>

      <ReportTable columns={columns} data={filtered} rowKey="route" title="All Routes" pageSize={12} footer={`${filtered.length} routes`} />
    </ReportShell>
  )
}
