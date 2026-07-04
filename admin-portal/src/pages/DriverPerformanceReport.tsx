import { useEffect, useState, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import ReportShell from '../components/ReportShell'
import StatCard from '../components/StatCard'
import ReportTable from '../components/ReportTable'
import { R } from '../utils/reportTheme'
import { exportPDF, exportExcel } from '../utils/pdfExport'

interface DriverRow {
  id: number; name: string; status: string; vehicle: string;
  totalAssigned: number; completed: number; cancelled: number;
  completionRate: number; avgPassengers: number; stuckAlerts: number; stuckUnresolved: number;
  totalFuelCost: number; score: number;
}
interface Totals { totalDrivers: number; avgCompletionRate: number; totalRidesCompleted: number; totalAlerts: number }

const scoreColor = (s: number) => s >= 80 ? R.good : s >= 55 ? R.warn : R.danger
const scoreBg = (s: number) => s >= 80 ? R.goodSoft : s >= 55 ? R.warnSoft : R.dangerSoft
const scoreLabel = (s: number) => s >= 80 ? 'Excellent' : s >= 55 ? 'Average' : 'Needs Attention'

export default function DriverPerformanceReport() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<DriverRow[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/driver-performance')
      setTotals(res.data.totals); setRows(res.data.rows)
    } catch { /* handled */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchData() }, [fetchData])

  const filtered = rows.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()))
  const medals = ['🥇', '🥈', '🥉']

  const summaryCards = totals ? [
    { label: 'Total Drivers', value: totals.totalDrivers },
    { label: 'Avg Completion Rate', value: `${totals.avgCompletionRate}%`, highlight: true },
    { label: 'Rides Completed', value: totals.totalRidesCompleted },
    { label: 'Total Alerts', value: totals.totalAlerts },
  ] : undefined

  const handlePDF = async () => await exportPDF({
    title: 'Driver Performance Report',
    subtitle: 'Ranked by score — completion rate, cancellations, stuck alerts',
    sectionLabel: 'Driver Performance Rankings',
    orientation: 'landscape',
    adminName: user?.name ?? 'Admin',
    recordCount: filtered.length,
    head: ['#', 'Driver', 'Vehicle', 'Assigned', 'Completed', 'Cancelled', 'Completion %', 'Avg Pax', 'Alerts', 'Score'],
    body: filtered.map((r, i) => [`#${i + 1}`, r.name, r.vehicle, r.totalAssigned, r.completed, r.cancelled, `${r.completionRate}%`, r.avgPassengers, r.stuckAlerts, `${r.score}/100`]),
    fileName: 'driver-performance-report',
    summaryCards,
  })

  const handleExcel = () => exportExcel('driver-performance-report', 'Driver Performance', filtered.map(r => ({
    Driver: r.name, Status: r.status, Vehicle: r.vehicle,
    Assigned: r.totalAssigned, Completed: r.completed, Cancelled: r.cancelled,
    'Completion %': r.completionRate, 'Avg Passengers': r.avgPassengers, 'Stuck Alerts': r.stuckAlerts, Score: r.score,
  })), {
    title: 'Driver Performance Report',
    subtitle: 'Ranked by score — completion rate, cancellations, stuck alerts',
    sectionLabel: 'Driver Performance Rankings',
    adminName: user?.name ?? 'Admin',
    recordCount: filtered.length,
    summaryCards,
  })

  const columns = [
    {
      title: 'Rank', key: 'rank', width: 60,
      render: (_: any, __: any, i: number) => (
        <span style={{ fontWeight: 700, color: R.inkSoft }}>{medals[i] ?? `#${i + 1}`}</span>
      ),
    },
    {
      title: 'Driver', key: 'driver', width: 210,
      render: (_: any, r: DriverRow) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, background: scoreBg(r.score),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14, color: scoreColor(r.score), flexShrink: 0,
          }}>
            {r.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: R.ink }}>{r.name}</div>
            <div style={{ fontSize: 12, color: R.inkFaint }}>{r.vehicle}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 110,
      render: (v: string) => (
        <span style={{
          background: v === 'AVAILABLE' ? R.goodSoft : '#EFF6FF',
          color: v === 'AVAILABLE' ? R.good : R.accent,
          padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
        }}>{v}</span>
      ),
    },
    {
      title: 'Rides', key: 'rides', width: 140,
      render: (_: any, r: DriverRow) => (
        <div style={{ fontSize: 13 }}>
          <span style={{ color: R.ink, fontWeight: 600 }}>{r.totalAssigned}</span>
          <span style={{ color: R.inkFaint }}> assigned </span>
          <span style={{ color: R.good, fontWeight: 600 }}>{r.completed}✓</span>
          {r.cancelled > 0 && <span style={{ color: R.danger }}> {r.cancelled}✗</span>}
        </div>
      ),
    },
    {
      title: 'Completion Rate', key: 'rate', width: 170,
      render: (_: any, r: DriverRow) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 6, background: '#EFF1F5', borderRadius: 4 }}>
            <div style={{ width: `${r.completionRate}%`, height: '100%', background: scoreColor(r.completionRate), borderRadius: 4, transition: 'width 0.5s' }} />
          </div>
          <span style={{ color: scoreColor(r.completionRate), fontWeight: 700, width: 38, textAlign: 'right', fontSize: 13 }}>{r.completionRate}%</span>
        </div>
      ),
    },
    { title: 'Avg Pax', dataIndex: 'avgPassengers', key: 'avgPax', width: 80, render: (v: number) => <span style={{ fontWeight: 600, color: R.accent }}>{v}</span> },
    {
      title: 'Alerts', key: 'alerts', width: 100,
      render: (_: any, r: DriverRow) => r.stuckAlerts > 0 ? (
        <span style={{ color: r.stuckUnresolved > 0 ? R.danger : R.warn, fontWeight: 600 }}>
          {r.stuckAlerts} {r.stuckUnresolved > 0 && <span style={{ fontSize: 11, background: R.dangerSoft, color: R.danger, padding: '1px 5px', borderRadius: 4 }}>{r.stuckUnresolved} open</span>}
        </span>
      ) : <span style={{ color: R.good, fontSize: 12 }}>None</span>,
    },
    {
      title: 'Score', dataIndex: 'score', key: 'score', width: 130,
      render: (v: number) => (
        <div style={{ display: 'flex', align: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: scoreColor(v) }}>{v}</span>
          <span style={{ color: R.inkFaint, fontSize: 12 }}>/100</span>
          <span style={{ display: 'block', fontSize: 11, background: scoreBg(v), color: scoreColor(v), padding: '2px 7px', borderRadius: 5, fontWeight: 600, marginTop: 2 }}>
            {scoreLabel(v)}
          </span>
        </div>
      ),
    },
  ]

  return (
    <ReportShell
      title="Driver Performance Report"
      subtitle="Ranked by score — completion rate, cancellations, stuck alerts"
      loading={loading}
      recordCount={filtered.length}
      adminName={user?.name ?? 'Admin'}
      onExcel={handleExcel}
      onPdf={handlePDF}
      filterBar={
        <>
          <input
            placeholder="🔍  Search driver…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: `1px solid ${R.border}`, borderRadius: 7, padding: '7px 10px', fontSize: 13, color: R.ink, width: 220, background: '#fff' }}
          />
          <div style={{ flex: 1 }} />
          <span style={{ color: R.inkSoft, fontSize: 13 }}>{filtered.length} drivers</span>
        </>
      }
    >
      {totals && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          <StatCard label="Total Drivers" value={totals.totalDrivers} />
          <StatCard label="Avg Completion Rate" value={`${totals.avgCompletionRate}%`} highlight />
          <StatCard label="Rides Completed" value={totals.totalRidesCompleted} color={R.good} colorSoft={R.goodSoft} />
          <StatCard label="Total Alerts Raised" value={totals.totalAlerts} color={totals.totalAlerts > 0 ? R.warn : R.inkFaint} colorSoft={R.warnSoft} />
        </div>
      )}

      {/* Leaderboard visual */}
      {rows.length > 0 && (
        <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: R.radius, padding: '18px 20px', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: R.ink, marginBottom: 2 }}>Score Leaderboard</div>
          <div style={{ fontSize: 12.5, color: R.inkFaint, marginBottom: 16 }}>Overall performance score out of 100</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.slice(0, 8).map((d, i) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 28, fontSize: 14, color: R.inkSoft, fontWeight: 700, flexShrink: 0 }}>
                  {medals[i] ?? `#${i + 1}`}
                </span>
                <span style={{ width: 140, fontSize: 13, color: R.inkSoft, fontWeight: 600, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                <div style={{ flex: 1, height: 10, background: '#EFF1F5', borderRadius: 6 }}>
                  <div style={{ width: `${d.score}%`, height: '100%', background: scoreColor(d.score), borderRadius: 6, transition: 'width 0.6s' }} />
                </div>
                <span style={{ width: 50, textAlign: 'right', fontWeight: 800, fontSize: 14, color: scoreColor(d.score), flexShrink: 0 }}>{d.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ReportTable columns={columns} data={filtered} rowKey="id" title="All Drivers" pageSize={10} />
    </ReportShell>
  )
}
