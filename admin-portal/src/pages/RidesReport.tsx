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

interface MonthRow {
  month: string; total: number; completed: number; cancelled: number;
  inProgress: number; assigned: number; pending: number; approved: number;
}
interface Totals {
  total: number; completed: number; cancelled: number; inProgress: number;
  completionRate: string; cancellationRate: string; avgPassengers: string;
}

export default function RidesReport() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [monthly, setMonthly] = useState<MonthRow[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [yearFilter, setYearFilter] = useState('ALL')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/rides')
      setTotals(res.data.totals); setMonthly(res.data.monthly)
    } catch { /* handled */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchData() }, [fetchData])

  const years = [...new Set(monthly.map(m => m.month.split(' ')[1]))].sort()
  const filtered = yearFilter === 'ALL' ? monthly : monthly.filter(m => m.month.includes(yearFilter))
  const maxTotal = Math.max(...filtered.map(m => m.total), 1)

  const summaryCards = totals ? [
    { label: 'Total Rides', value: totals.total },
    { label: 'Completed', value: totals.completed },
    { label: 'Cancelled', value: totals.cancelled },
    { label: 'Avg Completion', value: `${totals.completionRate}%`, highlight: true },
  ] : undefined

  const handlePDF = async () => await exportPDF({
    title: 'Rides Report',
    subtitle: 'Monthly ride volume & completion performance',
    sectionLabel: 'Ride Volume by Month',
    orientation: 'portrait',
    adminName: user?.name ?? 'Admin',
    recordCount: filtered.length,
    head: ['Month', 'Total', 'Completed', 'Cancelled', 'In Progress', 'Completion %'],
    body: filtered.map(r => [r.month, r.total, r.completed, r.cancelled, r.inProgress, `${r.total > 0 ? ((r.completed / r.total) * 100).toFixed(0) : 0}%`]),
    fileName: 'rides-report',
    summaryCards,
  })

  const handleExcel = () => exportExcel('rides-report', 'Rides', filtered.map(r => ({
    Month: r.month, Total: r.total, Completed: r.completed, Cancelled: r.cancelled,
    'In Progress': r.inProgress, 'Completion %': r.total > 0 ? ((r.completed / r.total) * 100).toFixed(1) + '%' : '0%',
  })), {
    title: 'Rides Report',
    subtitle: 'Monthly ride volume & completion performance',
    sectionLabel: 'Ride Volume by Month',
    adminName: user?.name ?? 'Admin',
    recordCount: filtered.length,
    summaryCards,
  })

  const columns = [
    { title: 'Month', dataIndex: 'month', key: 'month', render: (v: string) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Completed', dataIndex: 'completed', key: 'completed', render: (v: number) => <span style={{ fontWeight: 700, color: R.good }}>{v}</span> },
    { title: 'Cancelled', dataIndex: 'cancelled', key: 'cancelled', render: (v: number) => <span style={{ color: v > 0 ? R.danger : R.inkFaint }}>{v}</span> },
    { title: 'In Progress', dataIndex: 'inProgress', key: 'ip', render: (v: number) => <span style={{ color: v > 0 ? R.accent : R.inkFaint }}>{v}</span> },
    {
      title: 'Completion Rate', key: 'rate',
      render: (_: any, r: MonthRow) => {
        const rate = r.total > 0 ? (r.completed / r.total) * 100 : 0
        const color = rate >= 80 ? R.good : rate >= 50 ? R.warn : R.danger
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 6, background: '#EFF1F5', borderRadius: 4 }}>
              <div style={{ width: `${rate}%`, height: '100%', background: color, borderRadius: 4 }} />
            </div>
            <span style={{ color, fontWeight: 700, fontSize: 13, width: 40, textAlign: 'right' }}>{rate.toFixed(0)}%</span>
          </div>
        )
      },
    },
  ]

  return (
    <ReportShell
      title="Rides Report"
      subtitle="Monthly overview of all ride activity across the fleet"
      loading={loading}
      recordCount={filtered.length}
      adminName={user?.name ?? 'Admin'}
      onExcel={handleExcel}
      onPdf={handlePDF}
      filterBar={
        <>
          <Select value={yearFilter} onChange={setYearFilter} style={{ width: 130 }} size="small"
            options={[{ value: 'ALL', label: 'All years' }, ...years.map(y => ({ value: y, label: y }))]} />
          <div style={{ flex: 1 }} />
          <span style={{ color: R.inkSoft, fontSize: 13 }}>{filtered.length} months</span>
        </>
      }
    >
      {totals && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          <StatCard label="Total Rides" value={totals.total} sub="all time" />
          <StatCard label="Completed" value={totals.completed} sub={`${totals.completionRate}% rate`} highlight color={R.good} colorSoft={R.goodSoft} />
          <StatCard label="Cancelled" value={totals.cancelled} sub={`${totals.cancellationRate}% rate`} color={totals.cancelled > 0 ? R.danger : R.inkFaint} />
          <StatCard label="Avg Passengers" value={totals.avgPassengers} sub="per completed ride" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: R.radius, padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: R.ink, marginBottom: 2 }}>Monthly Volume</div>
          <div style={{ fontSize: 12.5, color: R.inkFaint, marginBottom: 14 }}>Total rides per month</div>
          {filtered.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
              {filtered.map(m => {
                const h = Math.max(6, (m.total / maxTotal) * 100)
                const cH = m.total > 0 ? (m.completed / m.total) * h : 0
                return (
                  <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ color: R.inkFaint, fontSize: 10, marginBottom: 3 }}>{m.total}</span>
                    <div style={{ width: '70%', height: h, background: '#EFF1F5', borderRadius: '3px 3px 0 0', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', bottom: 0, width: '100%', height: cH, background: R.accent, borderRadius: '2px 2px 0 0' }} />
                    </div>
                    <span style={{ color: R.inkFaint, fontSize: 9, marginTop: 4 }}>{m.month.split(' ')[0].slice(0, 3)}</span>
                  </div>
                )
              })}
            </div>
          ) : <div style={{ color: R.inkFaint, fontSize: 12.5, fontStyle: 'italic' }}>No data.</div>}
          <div style={{ display: 'flex', gap: 16, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${R.border}` }}>
            {[['#EFF1F5', 'Total'], [R.accent, 'Completed']].map(([bg, label]) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: R.inkSoft }}>
                <span style={{ width: 10, height: 10, background: bg, borderRadius: 2, display: 'inline-block' }} />{label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: R.radius, padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: R.ink, marginBottom: 2 }}>Status Breakdown</div>
          <div style={{ fontSize: 12.5, color: R.inkFaint, marginBottom: 16 }}>By ride status</div>
          <HBarChart items={[
            { label: 'Completed', value: filtered.reduce((s, m) => s + m.completed, 0), color: R.good },
            { label: 'Cancelled', value: filtered.reduce((s, m) => s + m.cancelled, 0), color: R.danger },
            { label: 'In Progress', value: filtered.reduce((s, m) => s + m.inProgress, 0), color: R.accent },
            { label: 'Assigned', value: filtered.reduce((s, m) => s + m.assigned, 0), color: '#7C93FF' },
            { label: 'Pending', value: filtered.reduce((s, m) => s + m.pending, 0), color: R.inkFaint },
          ].filter(i => i.value > 0)} />
        </div>
      </div>

      <ReportTable columns={columns} data={filtered} rowKey="month" title="Monthly Breakdown" pageSize={12} footer={`${filtered.length} months`} />
    </ReportShell>
  )
}
